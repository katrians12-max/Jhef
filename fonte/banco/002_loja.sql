-- =====================================================================
-- Mundo do Bip · atualização 002: guardar na nuvem as compras da Loja do Bip
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo inteiro e clique em "Run".
-- Não apaga nada. Pode rodar de novo sem problema.
-- =====================================================================
alter table public.progresso drop constraint if exists progresso_jogo_check;
alter table public.progresso add constraint progresso_jogo_check check (jogo in ('robo','academia','loja'));

create or replace function public.aluno_salvar(p_token uuid, p_jogo text, p_dados jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a_id uuid := _aluno_da_sessao(p_token);
begin
  if a_id is null then raise exception 'sessao_expirada' using errcode = 'P0001'; end if;
  if p_jogo not in ('robo','academia','loja') then raise exception 'jogo_invalido' using errcode = 'P0001'; end if;
  if jsonb_typeof(p_dados) <> 'object' or octet_length(p_dados::text) > 100000 then raise exception 'dados_invalidos' using errcode = 'P0001'; end if;
  insert into progresso (aluno_id, jogo, dados, atualizado_em) values (a_id, p_jogo, p_dados, now())
    on conflict (aluno_id, jogo) do update set dados = excluded.dados, atualizado_em = now();
  update alunos set ultimo_acesso = now() where id = a_id;
  return jsonb_build_object('ok', true, 'atualizado_em', now());
end $$;
revoke all on function public.aluno_salvar(uuid,text,jsonb) from public;
grant execute on function public.aluno_salvar(uuid,text,jsonb) to anon, authenticated;
