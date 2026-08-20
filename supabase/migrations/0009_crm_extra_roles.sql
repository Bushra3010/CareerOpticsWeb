-- Portal roles for the associates and student portals.
--
-- Its own file for the same reason 0007 is: Postgres refuses to *use* a new
-- enum value in the transaction that adds it, and 0016/0015's RLS policies
-- compare against these.
alter type user_role add value if not exists 'associate';
alter type user_role add value if not exists 'student';
