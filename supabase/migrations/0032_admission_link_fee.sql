-- 0032 — fee on a B.Ed / D.El.Ed admission link.
--
-- A counsellor sets the amount when creating a form link. The public
-- /apply/[code] page then shows a UPI payment step for exactly that amount
-- (QR + "pay in UPI app" link, built from crm.payment_settings.upi_id), and
-- the student submits the UTR and a payment screenshot with the form.
-- NULL or 0 = no payment step.
--
-- /api/leads copies this amount into answers.payment_amount itself, so the
-- figure the CRM shows never comes from the browser.

alter table crm.admission_links
  add column if not exists amount numeric(10,2)
  check (amount is null or amount >= 0);
