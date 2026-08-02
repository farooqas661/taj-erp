-- ============================================================
-- FIX: function crypt(text, text) does not exist
--
-- Cause:
--   login_employee / register_employee use:
--     SET search_path = public
--   On Supabase, pgcrypto is installed in schema "extensions",
--   so crypt() / gen_salt() / gen_random_bytes() are invisible.
--
-- Run this entire script in Supabase → SQL Editor.
-- No app code changes required.
-- ============================================================

create schema if not exists extensions;

do $do$
begin
  begin
    create extension if not exists pgcrypto with schema extensions;
  exception
    when duplicate_object then
      null; -- already installed (often in public or extensions)
    when others then
      begin
        create extension if not exists pgcrypto;
      exception
        when others then
          null;
      end;
  end;
end;
$do$;

create or replace function public.login_employee(
  p_employee_id text,
  p_password text
)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  emp employees%rowtype;
  stored_hash text;
  password_ok boolean := false;
  new_token text;
  new_hash text;
begin
  if p_employee_id is null or p_password is null then
    raise exception 'Employee ID and password are required';
  end if;

  select * into emp
  from employees
  where employee_id = p_employee_id
  limit 1;

  if not found then
    raise exception 'Invalid Employee ID or Password';
  end if;

  select password_hash into stored_hash
  from employee_secrets
  where employee_id = p_employee_id;

  if stored_hash is null
    and emp.password is not null
    and emp.password <> 'REDACTED'
  then
    stored_hash := emp.password;
  end if;

  if stored_hash is null then
    raise exception 'Invalid Employee ID or Password';
  end if;

  if public.is_bcrypt_hash(stored_hash) then
    password_ok := (stored_hash = crypt(p_password, stored_hash));
  else
    password_ok := (stored_hash = p_password);
    if password_ok then
      new_hash := crypt(p_password, gen_salt('bf', 10));
      insert into employee_secrets (employee_id, password_hash, updated_at)
      values (emp.employee_id, new_hash, now())
      on conflict (employee_id) do update
      set password_hash = excluded.password_hash,
          updated_at = now();
    end if;
  end if;

  if not password_ok then
    raise exception 'Invalid Employee ID or Password';
  end if;

  if coalesce(emp.approval_status, '') <> 'approved' then
    return json_build_object(
      'employee_id', emp.employee_id,
      'approval_status', emp.approval_status,
      'token', null
    );
  end if;

  new_token := encode(gen_random_bytes(32), 'hex');

  delete from erp_sessions
  where employee_id = emp.employee_id
     or expires_at <= now();

  insert into erp_sessions (employee_id, token, expires_at)
  values (emp.employee_id, new_token, now() + interval '14 days');

  return json_build_object(
    'employee_id', emp.employee_id,
    'approval_status', emp.approval_status,
    'token', new_token,
    'role', emp.role,
    'full_name', emp.full_name
  );
end;
$fn$;

create or replace function public.register_employee(
  p_full_name text,
  p_phone text,
  p_email text,
  p_address text,
  p_password text,
  p_requested_role text,
  p_selfie_url text default ''
)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  new_id text;
  hashed text;
begin
  if p_full_name is null or p_phone is null or p_password is null then
    raise exception 'Please fill all required fields';
  end if;

  new_id := 'PENDING-' || floor(extract(epoch from now()) * 1000)::bigint::text;
  hashed := crypt(p_password, gen_salt('bf', 10));

  insert into employees (
    employee_id,
    full_name,
    phone,
    email,
    address,
    password,
    requested_role,
    selfie_url,
    registration_status,
    approval_status,
    status
  ) values (
    new_id,
    p_full_name,
    p_phone,
    p_email,
    p_address,
    hashed,
    coalesce(nullif(p_requested_role, ''), 'worker'),
    coalesce(p_selfie_url, ''),
    'pending',
    'pending',
    'inactive'
  );

  return json_build_object(
    'employee_id', new_id,
    'status', 'pending'
  );
end;
$fn$;

grant execute on function public.login_employee(text, text) to anon, authenticated;
grant execute on function public.register_employee(text, text, text, text, text, text, text) to anon, authenticated;
