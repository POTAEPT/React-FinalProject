-- Drop the skip feature: the feed no longer hides cards per user.
-- Run this only after the app version without skipParty / the skips filter
-- is live, so a running older build does not query a missing table.
-- Dropping the table also drops its index and RLS policies.

drop table if exists public.skips;
