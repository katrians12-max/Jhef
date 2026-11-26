-- =====================================================================
-- Mundo do Bip · 006 · Modo foco
-- O professor liga ou desliga o Modo foco em cada turma.
-- Com ele ligado, o aluno ganha ⚡2 por aula da Academia ou fase nova do Robô
-- e gasta ⚡1 por partida de jogo rápido (a conta é feita no site).
-- Aqui no banco só fica guardado SE o foco está ligado e DESDE QUANDO.
-- Pode rodar de novo sem problema.
-- =====================================================================

alter table public.turmas add column if not exists foco boolean not null default false;
alter table public.turmas add column if not exists foco_em timestamptz;

-- o aluno recebe junto com a turma se o foco está ligado
create or replace function public._resposta_aluno(p_aluno uuid, p_token uuid) returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    'token', p_token, 'aluno_id', a.id, 'apelido', a.apelido, 'cor', a.cor,
    'turma', jsonb_build_object('nome', t.nome, 'codigo', t.codigo, 'aberta', t.aberta, 'foco', t.foco, 'foco_em', t.foco_em),
    'progresso', coalesce((select jsonb_object_agg(p.jogo, p.dados) from progresso p where p.aluno_id = a.id), '{}'::jsonb))
  from alunos a join turmas t on t.id = a.turma_id where a.id = p_aluno
$$;

create or replace function public.professor_turmas()
returns jsonb language sql security definer stable set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'nome', t.nome, 'codigo', t.codigo, 'ativa', t.ativa, 'criado_em', t.criado_em,
          'aberta', t.aberta, 'aberta_em', t.aberta_em, 'foco', t.foco, 'foco_em', t.foco_em,
          'alunos', (select count(*) from alunos a where a.turma_id = t.id)) order by t.criado_em desc), '[]'::jsonb)
  from turmas t where t.professor_id = auth.uid()
$$;

create or replace function public.professor_criar_turma(p_nome text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare u uuid := auth.uid(); t turmas;
begin
  if u is null then raise exception 'precisa_entrar' using errcode = 'P0001'; end if;
  if char_length(btrim(coalesce(p_nome,''))) < 1 then raise exception 'nome_invalido' using errcode = 'P0001'; end if;
  if (select count(*) from turmas where professor_id = u) >= 30 then raise exception 'limite_turmas' using errcode = 'P0001'; end if;
  perform professor_perfil(null);
  insert into turmas (professor_id, nome, codigo) values (u, left(btrim(p_nome), 40), _novo_codigo()) returning * into t;
  return jsonb_build_object('id', t.id, 'nome', t.nome, 'codigo', t.codigo, 'ativa', t.ativa, 'aberta', t.aberta, 'aberta_em', t.aberta_em,
                            'foco', t.foco, 'foco_em', t.foco_em, 'alunos', 0);
end $$;

-- botão "Modo foco": ligar ou desligar
create or replace function public.professor_foco(p_turma uuid, p_foco boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r turmas;
begin
  update turmas set foco = coalesce(p_foco, false), foco_em = case when coalesce(p_foco, false) then now() else null end
   where id = p_turma and professor_id = auth.uid() returning * into r;
  if not found then raise exception 'turma_nao_encontrada' using errcode = 'P0001'; end if;
  return jsonb_build_object('ok', true, 'foco', r.foco, 'foco_em', r.foco_em);
end $$;

revoke all on function public._resposta_aluno(uuid, uuid) from public, anon, authenticated;
revoke all on function public.professor_turmas(), public.professor_criar_turma(text), public.professor_foco(uuid,boolean) from public, anon;
grant execute on function public.professor_turmas(), public.professor_criar_turma(text), public.professor_foco(uuid,boolean) to authenticated;
