-- ============================================================
-- Reject plaintext passwords in login_employee (production)
-- Requires: secure-rls.sql + fix-crypt-extension.sql already applied
-- Run in Supabase → SQL Editor
-- ============================================================

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
    and public.is_bcrypt_hash(emp.password)
  then
    stored_hash := emp.password;
  end if;

  if stored_hash is null or not public.is_bcrypt_hash(stored_hash) then
    raise exception 'Invalid Employee ID or Password';
  end if;

  password_ok := (stored_hash = crypt(p_password, stored_hash));

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

grant execute on function public.login_employee(text, text) to anon, authenticated;
