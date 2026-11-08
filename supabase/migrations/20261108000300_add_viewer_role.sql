-- Separate file: a new enum value cannot be used in the transaction that adds it.
alter type public.member_role add value 'viewer';
