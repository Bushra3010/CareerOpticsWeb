-- PostgREST talks to these tables as `authenticated`, and a table with RLS on
-- but no GRANT denies every request before a policy is even consulted. 0008
-- granted its own thirteen tables; everything added in 0011–0022 needs the
-- same, or every new CRM screen returns an empty list with no error.
do $$
declare t text;
begin
  foreach t in array array[
    'student_documents','student_exams','appointments','lead_capture_forms',
    'notifications','notification_reads','student_notifications',
    'student_announcements','student_support_tickets','study_materials',
    'student_faqs','associates','associate_wallet_txns',
    'associate_notifications','associate_dispatches','wallet_recharge_requests',
    'associate_resources','associate_support_tickets','student_dispatches',
    'student_uploads','payroll','employees','attendance','leave_requests',
    'expenses','advance_salaries','department_litigations',
    'student_mentorships','revenue_targets'
  ] loop
    execute format('grant select, insert, update, delete on crm.%I to authenticated', t);
  end loop;
end $$;

grant usage, select on all sequences in schema crm to authenticated;

-- The public lead-capture page renders before login, so anon needs read on it.
-- Its policy already narrows that to `is_active = true`.
grant select on crm.lead_capture_forms to anon;
