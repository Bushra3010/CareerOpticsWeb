-- Student portal columns on crm.students
ALTER TABLE crm.students
  ADD COLUMN IF NOT EXISTS portal_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS portal_username text,
  ADD COLUMN IF NOT EXISTS portal_temp_password text,
  ADD COLUMN IF NOT EXISTS portal_active boolean not null default false,
  ADD COLUMN IF NOT EXISTS university_name text,
  ADD COLUMN IF NOT EXISTS board_name text,
  ADD COLUMN IF NOT EXISTS father_name text,
  ADD COLUMN IF NOT EXISTS guardian_name text,
  ADD COLUMN IF NOT EXISTS guardian_phone text,
  ADD COLUMN IF NOT EXISTS guardian_relationship text,
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male','female','other')),
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS pincode text,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending','in_review','verified','rejected')),
  ADD COLUMN IF NOT EXISTS exam_status text NOT NULL DEFAULT 'not_scheduled'
    CHECK (exam_status IN ('not_scheduled','scheduled','completed','result_awaited','passed','failed')),
  ADD COLUMN IF NOT EXISTS result_status text NOT NULL DEFAULT 'awaited'
    CHECK (result_status IN ('awaited','declared','passed','failed','re_appear')),
  ADD COLUMN IF NOT EXISTS admit_card_url text,
  ADD COLUMN IF NOT EXISTS enrollment_card_url text,
  ADD COLUMN IF NOT EXISTS id_card_url text,
  ADD COLUMN IF NOT EXISTS marksheet_url text,
  ADD COLUMN IF NOT EXISTS certificate_url text,
  ADD COLUMN IF NOT EXISTS profile_photo_url text,
  ADD COLUMN IF NOT EXISTS admission_progress int NOT NULL DEFAULT 0 CHECK (admission_progress BETWEEN 0 AND 100);

CREATE UNIQUE INDEX IF NOT EXISTS crm_students_portal_user_idx ON crm.students(portal_user_id) WHERE portal_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS crm_students_portal_active_idx ON crm.students(portal_active);

-- Student notifications
CREATE TABLE IF NOT EXISTS crm.student_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES crm.students(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','alert')),
  file_url text,
  category text,
  is_read boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_student_notif_student_idx ON crm.student_notifications(student_id);
CREATE INDEX IF NOT EXISTS crm_student_notif_read_idx ON crm.student_notifications(student_id, is_read);

-- Student announcements
CREATE TABLE IF NOT EXISTS crm.student_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL DEFAULT 'general' CHECK (type IN ('general','exam','result','fee','urgent')),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
CREATE INDEX IF NOT EXISTS crm_announcements_active_idx ON crm.student_announcements(is_active, created_at DESC);

-- Student support tickets
CREATE TABLE IF NOT EXISTS crm.student_support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES crm.students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  admin_reply text,
  replied_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_tickets_student_idx ON crm.student_support_tickets(student_id);
CREATE INDEX IF NOT EXISTS crm_tickets_status_idx ON crm.student_support_tickets(status);

-- Study materials
CREATE TABLE IF NOT EXISTS crm.study_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'pdf' CHECK (type IN ('ebook','pdf_notes','syllabus','recorded_class','live_class','other')),
  url text,
  course_id uuid REFERENCES crm.courses(id) ON DELETE SET NULL,
  sub_course_id uuid REFERENCES crm.sub_courses(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_materials_course_idx ON crm.study_materials(course_id, is_active);
CREATE INDEX IF NOT EXISTS crm_materials_type_idx ON crm.study_materials(type, is_active);

-- Student FAQs
CREATE TABLE IF NOT EXISTS crm.student_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE crm.student_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.student_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.student_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.student_faqs ENABLE ROW LEVEL SECURITY;

-- Admin/backend: full access
CREATE POLICY "admin_student_notif" ON crm.student_notifications FOR ALL
  USING (crm.is_manager());
CREATE POLICY "admin_announcements" ON crm.student_announcements FOR ALL
  USING (crm.is_manager());
CREATE POLICY "admin_tickets" ON crm.student_support_tickets FOR ALL
  USING (crm.is_manager());
CREATE POLICY "admin_materials" ON crm.study_materials FOR ALL
  USING (crm.is_manager());
CREATE POLICY "admin_faqs" ON crm.student_faqs FOR ALL
  USING (crm.is_manager());

-- Students: own notifications (read + mark read)
CREATE POLICY "student_own_notif" ON crm.student_notifications FOR SELECT
  USING (student_id IN (SELECT id FROM crm.students WHERE portal_user_id = auth.uid()));
CREATE POLICY "student_mark_notif_read" ON crm.student_notifications FOR UPDATE
  USING (student_id IN (SELECT id FROM crm.students WHERE portal_user_id = auth.uid()));

-- Students: announcements
CREATE POLICY "student_view_announcements" ON crm.student_announcements FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Students: own tickets
CREATE POLICY "student_own_tickets" ON crm.student_support_tickets FOR SELECT
  USING (student_id IN (SELECT id FROM crm.students WHERE portal_user_id = auth.uid()));
CREATE POLICY "student_create_tickets" ON crm.student_support_tickets FOR INSERT
  WITH CHECK (student_id IN (SELECT id FROM crm.students WHERE portal_user_id = auth.uid()));

-- Students: active materials for their course
CREATE POLICY "student_view_materials" ON crm.study_materials FOR SELECT
  USING (
    is_active = true AND (
      course_id IS NULL
      OR course_id IN (SELECT course_id FROM crm.students WHERE portal_user_id = auth.uid() AND course_id IS NOT NULL)
    )
  );

-- Students: FAQs
CREATE POLICY "student_view_faqs" ON crm.student_faqs FOR SELECT
  USING (is_active = true);

-- Students: own student record
CREATE POLICY "student_read_own" ON crm.students FOR SELECT
  USING (portal_user_id = auth.uid());
CREATE POLICY "student_update_own_profile" ON crm.students FOR UPDATE
  USING (portal_user_id = auth.uid())
  WITH CHECK (portal_user_id = auth.uid());

-- Students: own payments
CREATE POLICY "student_own_payments" ON crm.payments FOR SELECT
  USING (student_id IN (SELECT id FROM crm.students WHERE portal_user_id = auth.uid()));

-- Seed FAQs
INSERT INTO crm.student_faqs (question, answer, category, sort_order) VALUES
  ('How do I check my admission status?', 'Go to "My Admission Status" section in the portal to see your complete admission progress including verification, exam, and result status.', 'admission', 1),
  ('How can I download my admit card?', 'Once your admit card is issued, it will appear in the "My Admission Status" section under "Documents". You can download it from there.', 'exam', 2),
  ('Where can I see my payment history?', 'Go to "Accounts" section to view your complete payment history, pending dues, and download receipts.', 'payment', 3),
  ('How do I raise a support ticket?', 'Go to "Help & Support" section and click "Raise a Ticket". Our team will respond within 24-48 hours.', 'support', 4),
  ('How do I update my contact information?', 'Go to "Profile" section and click on "Contact Information" to update your phone number, email, or address.', 'profile', 5)
ON CONFLICT DO NOTHING;
