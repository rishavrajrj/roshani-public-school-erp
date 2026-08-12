-- Migration 020: Private Storage Bucket for Student Documents

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-documents',
  'student-documents',
  false, -- PRIVATE BUCKET
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- Storage objects RLS policies
DROP POLICY IF EXISTS "student_docs_objects_select" ON storage.objects;
CREATE POLICY "student_docs_objects_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-documents' AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal']) OR
      (storage.foldername(name))[1] IN (
        SELECT s.id::text FROM public.students s
        WHERE s.school_id = public.get_current_school_id()
          AND (
            public.is_guardian_of_student(s.id) OR
            (s.profile_id IS NOT NULL AND s.profile_id = public.get_current_profile_id() AND public.has_role('Student'))
          )
      )
    )
  );

DROP POLICY IF EXISTS "student_docs_objects_insert" ON storage.objects;
CREATE POLICY "student_docs_objects_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'student-documents' AND
    public.has_any_role(ARRAY['Super Admin', 'Admin'])
  );

DROP POLICY IF EXISTS "student_docs_objects_update" ON storage.objects;
CREATE POLICY "student_docs_objects_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'student-documents' AND
    public.has_any_role(ARRAY['Super Admin', 'Admin'])
  );

DROP POLICY IF EXISTS "student_docs_objects_delete" ON storage.objects;
CREATE POLICY "student_docs_objects_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'student-documents' AND
    public.has_any_role(ARRAY['Super Admin', 'Admin'])
  );
