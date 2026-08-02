-- Fixes a rating-wipe caused by the 0001 review trigger.
--
-- `refresh_college_rating` fires on every insert/update/delete of `reviews` and
-- recomputes `colleges.rating` from approved rows only. A brand-new review is
-- always `is_approved = false`, so the very first submission on a college
-- recomputed an average over zero approved rows and set `rating` to 0 and
-- `review_count` to 0.
--
-- Because /api/reviews is public, that made a college's displayed rating
-- destroyable by any visitor: submit one review per college and every rating on
-- the site drops to zero. Reproduced against the live project during P6.
--
-- The guard below returns early unless an approved row is actually involved,
-- so a pending review no longer touches the aggregate. A trigger-level WHEN
-- clause cannot express this: NEW is unavailable on DELETE and OLD on INSERT,
-- so the check has to live in the function body.
--
-- Migrations are never edited after apply (CLAUDE.md rule 3), hence a new file
-- rather than a change to 0001.

create or replace function public.refresh_college_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.college_id, old.college_id);
begin
  -- Only a change involving an approved review can move the aggregate.
  if tg_op = 'INSERT' and not coalesce(new.is_approved, false) then
    return null;
  end if;

  if tg_op = 'DELETE' and not coalesce(old.is_approved, false) then
    return null;
  end if;

  if tg_op = 'UPDATE'
     and not coalesce(new.is_approved, false)
     and not coalesce(old.is_approved, false) then
    return null;
  end if;

  update colleges c
     set rating = coalesce((
           select round(avg(r.rating)::numeric, 1)
             from reviews r
            where r.college_id = target and r.is_approved
         ), 0),
         review_count = (
           select count(*) from reviews r
            where r.college_id = target and r.is_approved
         )
   where c.id = target;

  return null;
end;
$$;
