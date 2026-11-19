-- 0033 — B.Ed / D.El.Ed documents: Allotment Letter and Registration.
--
-- Staff upload these (like admit cards, any number per student, one per
-- session/semester) and the student sees them in the portal. A physical copy
-- can be ordered from the portal like any other document.

alter table crm.student_credentials drop constraint if exists student_credentials_kind_check;
alter table crm.student_credentials add constraint student_credentials_kind_check
  check (kind in ('allotment_letter', 'registration', 'admit_card', 'id_card',
                  'marksheet', 'certificate', 'other'));

alter table crm.document_order_items drop constraint if exists document_order_items_kind_check;
alter table crm.document_order_items add constraint document_order_items_kind_check
  check (kind in ('allotment_letter', 'registration', 'admit_card', 'id_card',
                  'marksheet', 'certificate', 'other'));

-- Physical-copy items for the new documents. Off until the office sets a price.
insert into crm.document_order_items (name, kind, description, price, is_active, sort_order)
select v.name, v.kind, v.description, 0, false, v.sort_order
from (values
  ('Physical Allotment Letter', 'allotment_letter', 'Printed allotment letter, delivered by courier', 10),
  ('Physical Registration Slip', 'registration', 'Printed registration slip, delivered by courier', 11),
  ('Physical Admit Card', 'admit_card', 'Printed admit card, delivered by courier', 12)
) as v(name, kind, description, sort_order)
where not exists (select 1 from crm.document_order_items i where i.kind = v.kind);
