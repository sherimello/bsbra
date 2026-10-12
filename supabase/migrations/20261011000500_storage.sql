-- =============================================================================
-- BSBRA Digital Platform — 05 · Storage
--   media      public   photographs, cover images, portraits, logos
--   documents  private  publications & downloads — served via signed URLs
--   minutes    private  board / committee minutes — served via signed URLs
-- Private files are readable only when the matching database row is visible
-- to the caller, so storage access always follows the record's access level.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 10485760, array[
    'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'
  ]),
  ('documents', 'documents', false, 52428800, array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/csv', 'text/plain', 'application/zip',
    'image/jpeg', 'image/png', 'image/webp'
  ]),
  ('minutes', 'minutes', false, 52428800, array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- media -----------------------------------------------------------------------
drop policy if exists "media: public read" on storage.objects;
create policy "media: public read" on storage.objects for select to anon, authenticated
using (bucket_id = 'media');

drop policy if exists "media: staff upload" on storage.objects;
create policy "media: staff upload" on storage.objects for insert to authenticated
with check (bucket_id = 'media' and (select private.is_staff()));

drop policy if exists "media: staff update" on storage.objects;
create policy "media: staff update" on storage.objects for update to authenticated
using (bucket_id = 'media' and (select private.is_staff()))
with check (bucket_id = 'media' and (select private.is_staff()));

drop policy if exists "media: editors delete" on storage.objects;
create policy "media: editors delete" on storage.objects for delete to authenticated
using (bucket_id = 'media' and (select private.is_editor()));

-- documents -------------------------------------------------------------------
drop policy if exists "documents: read when record visible" on storage.objects;
create policy "documents: read when record visible" on storage.objects for select to anon, authenticated
using (
  bucket_id = 'documents'
  and (
    (select private.is_staff())
    or exists (
      select 1 from public.documents d
       where d.file_path = objects.name
         and d.status = 'published'
         and public.role_can_view(d.access_level, (select private.current_user_role()))
    )
  )
);

drop policy if exists "documents: staff upload" on storage.objects;
create policy "documents: staff upload" on storage.objects for insert to authenticated
with check (bucket_id = 'documents' and (select private.is_staff()));

drop policy if exists "documents: staff update" on storage.objects;
create policy "documents: staff update" on storage.objects for update to authenticated
using (bucket_id = 'documents' and (select private.is_staff()))
with check (bucket_id = 'documents' and (select private.is_staff()));

drop policy if exists "documents: editors delete" on storage.objects;
create policy "documents: editors delete" on storage.objects for delete to authenticated
using (bucket_id = 'documents' and (select private.is_editor()));

-- minutes ---------------------------------------------------------------------
drop policy if exists "minutes: read when record visible" on storage.objects;
create policy "minutes: read when record visible" on storage.objects for select to authenticated
using (
  bucket_id = 'minutes'
  and (
    (select private.is_admin())
    or exists (
      select 1 from public.meeting_minutes m
       where m.file_path = objects.name
         and m.status = 'approved'
         and public.role_can_view(m.access_level, (select private.current_user_role()))
    )
  )
);

drop policy if exists "minutes: admins upload" on storage.objects;
create policy "minutes: admins upload" on storage.objects for insert to authenticated
with check (bucket_id = 'minutes' and (select private.is_admin()));

drop policy if exists "minutes: admins update" on storage.objects;
create policy "minutes: admins update" on storage.objects for update to authenticated
using (bucket_id = 'minutes' and (select private.is_admin()))
with check (bucket_id = 'minutes' and (select private.is_admin()));

drop policy if exists "minutes: admins delete" on storage.objects;
create policy "minutes: admins delete" on storage.objects for delete to authenticated
using (bucket_id = 'minutes' and (select private.is_admin()));
