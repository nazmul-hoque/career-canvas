-- A certificate ID is a stable hash, which makes it predictable: anyone who
-- knows the format could print a plausible-looking ID. The signature is what
-- makes a printed certificate checkable — an HMAC over
-- (certificate_id, user_id, path_id, issued_at), written by the server at issue
-- time and re-derived by /verify.
--
-- Nullable because rows issued before this migration have no signature. The
-- verification page reports those as "on record, signature not confirmed"
-- rather than rejecting them.
ALTER TABLE public.issued_certificates ADD COLUMN signature TEXT;
