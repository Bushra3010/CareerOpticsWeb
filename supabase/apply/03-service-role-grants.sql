-- ==========================================================================
-- CareerOptics CRM — BLOCK 3: service_role table grants
--
-- Run this if blocks 1 and 2 are already applied. It is also included at the
-- end of 02-crm-schema.sql, so a fresh install does not need it separately.
--
-- Safe to run more than once.
-- ==========================================================================

-- Table grants for `service_role` in the crm schema.
--
-- In `public`, Supabase's bootstrap sets default privileges so service_role
-- gets every table automatically. A schema created by a migration inherits
-- none of that: 0008 granted `usage on schema crm` to service_role but never
-- any table, so every service-role request returned
--   42501  permission denied for table <t>
-- with RLS never even consulted. Caught against the live project the first
-- time the crm schema was exposed to the API.
--
-- The one caller this breaks is the bulk lead importer, which uses the service
-- role for its batch insert (`import-actions.ts`) — it would have failed on
-- the very first real import.

grant usage on schema crm to service_role;

grant select, insert, update, delete
  on all tables in schema crm to service_role;

grant usage, select on all sequences in schema crm to service_role;

-- `all tables in schema` only covers what exists right now. Default privileges
-- cover whatever a later migration adds, so this bug cannot come back.
alter default privileges in schema crm
  grant select, insert, update, delete on tables to service_role;

alter default privileges in schema crm
  grant usage, select on sequences to service_role;

-- Same reasoning for `authenticated`: 0008 and 0023 each had to list their own
-- tables by hand, and 0023 exists only because 0011-0022 were forgotten once.
alter default privileges in schema crm
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema crm
  grant usage, select on sequences to authenticated;
