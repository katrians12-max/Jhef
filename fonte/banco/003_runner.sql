-- =====================================================================
-- Mundo do Bip · atualização 003: Bip Runner
--  1) o banco passa a aceitar o progresso do jogo "runner" (recordes, Bipcoins do dia, erros);
--  2) nova função aluno_recordes: os 5 maiores recordes da turma, para mostrar no jogo.
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo inteiro e clique em "Run".
-- Não apaga nada. Pode rodar de novo sem problema.
-- =====================================================================
alter table public.progresso drop constraint if exists progresso_jogo_check;
alter table public.progresso add constraint progresso_jogo_check check (jogo in ('robo','academia','loja','runner'));

create or replace function public.aluno_salvar(p_token uuid, p_jogo text, p_dados jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a_id uuid := _aluno_da_sessao(p_token);
begin
  if a_id is null then raise exception 'sessao_expirada' using errcode = 'P0001'; end if;
  if p_jogo not in ('robo','academia','loja','runner') then raise exception 'jogo_invalido' using errcode = 'P0001'; end if;
  if jsonb_typeof(p_dados) <> 'object' or octet_length(p_dados::text) > 100000 then raise exception 'dados_invalidos' using errcode = 'P0001'; end if;
  insert into progresso (aluno_id, jogo, dados, atualizado_em) values (a_id, p_jogo, p_dados, now())
    on conflict (aluno_id, jogo) do update set dados = excluded.dados, atualizado_em = now();
  update alunos set ultimo_acesso = now() where id = a_id;
  return jsonb_build_object('ok', true, 'atualizado_em', now());
end $$;
revoke all on function public.aluno_salvar(uuid,text,jsonb) from public;
grant execute on function public.aluno_salvar(uuid,text,jsonb) to anon, authenticated;

-- Os 5 maiores recordes da turma do aluno numa trilha (só apelido e pontos; nada de PIN ou outros dados).
create or replace function public.aluno_recordes(p_token uuid, p_trilha text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a_id uuid := _aluno_da_sessao(p_token); t_id uuid;
begin
  if a_id is null then raise exception 'sessao_expirada' using errcode = 'P0001'; end if;
  if p_trilha is null or p_trilha !~ '^[a-z]{2,20}$' then raise exception 'dados_invalidos' using errcode = 'P0001'; end if;
  select turma_id into t_id from alunos where id = a_id;
  return coalesce((
    select jsonb_agg(jsonb_build_object('apelido', x.apelido, 'pontos', x.pontos, 'eu', x.id = a_id) order by x.pontos desc, lower(x.apelido))
    from (select al.id, al.apelido, (pr.dados->'best'->>p_trilha)::int as pontos
          from progresso pr join alunos al on al.id = pr.aluno_id
          where al.turma_id = t_id and pr.jogo = 'runner' and coalesce(pr.dados->'best'->>p_trilha, '') ~ '^[0-9]{1,7}$'
          order by 3 desc, lower(al.apelido) limit 5) x
    where x.pontos > 0), '[]'::jsonb);
end $$;
revoke all on function public.aluno_recordes(uuid,text) from public;
grant execute on function public.aluno_recordes(uuid,text) to anon, authenticated;
