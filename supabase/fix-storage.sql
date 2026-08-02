-- ============================================================
-- Harden employee-selfies storage (production)
--
-- Also in Supabase Dashboard → Storage → employee-selfies:
--   turn Public bucket OFF
--
-- Register uploads still allowed (no session yet).
-- Reads require a valid ERP session so anonymous listing stops.
-- ============================================================

drop policy if exists "selfies_public_read" on storage.objects;
drop policy if exists "selfies_upload" on storage.objects;
drop policy if exists "selfies_update" on storage.objects;
drop policy if exists "selfies_authenticated_read" on storage.objects;
drop policy if exists "selfies_authenticated_upload" on storage.objects;
drop policy if exists "selfies_authenticated_update" on storage.objects;

create policy "selfies_authenticated_read"
on storage.objects for select
using (
  bucket_id = 'employee-selfies'
  and public.is_session_valid()
);

create policy "selfies_authenticated_upload"
on storage.objects for insert
with check (bucket_id = 'employee-selfies');

create policy "selfies_authenticated_update"
on storage.objects for update
using (
  bucket_id = 'employee-selfies'
  and public.is_session_valid()
);
