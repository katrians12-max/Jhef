-- Imita o que o Supabase já tem pronto (só para testar no computador): papéis, auth.users e auth.uid()
do $$ begin
  if not exists (select from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end $$;
create schema if not exists auth; create schema if not exists extensions;
grant usage on schema public, auth, extensions to anon, authenticated;
create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}'::jsonb);
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant execute on function auth.uid() to anon, authenticated;
alter default privileges in schema public revoke execute on functions from public;
