-- CRM staff roles, added to the existing `user_role` enum so the CRM and the
-- website share one profiles table and one login rather than maintaining two.
--
-- This is its own migration on purpose: Postgres refuses to *use* a new enum
-- value in the same transaction that adds it, and 0006's RLS policies compare
-- against these. Splitting the file is what makes the values committed and
-- usable by the time 0006 runs.
alter type user_role add value if not exists 'telecaller';
alter type user_role add value if not exists 'backend';
alter type user_role add value if not exists 'finance';
