-- CareerOptics — enrollment numbers use the CO- prefix, not HELLODOCTOR's HD-.
--
-- The ported 0027 set the default to 'HD-' || six digits. Students log in to
-- the portal with this number, so it should carry the CareerOptics prefix.
-- Existing HD-/ENR- numbers are renamed; the portal username follows, since it
-- is the enrollment number by design (api/crm/students/create-credentials).

alter table crm.students
  alter column enrollment_number
  set default 'CO-' || floor(random() * 900000 + 100000)::text;

update crm.students
set portal_username = 'CO-' || regexp_replace(portal_username, '^(HD|ENR)-([0-9]+).*$', '\2')
where portal_username ~* '^(HD|ENR)-[0-9]';

update crm.students
set enrollment_number = 'CO-' || regexp_replace(enrollment_number, '^(HD|ENR)-([0-9]+).*$', '\2')
where enrollment_number ~* '^(HD|ENR)-[0-9]';
