-- =====================================================================
-- Mundo do Bip · 005 · Painel do Criador
-- 1) "criadores": quem pode abrir o painel. Só entra quem estiver nesta lista
--    (a conferência é feita AQUI no banco, não na página).
-- 2) "visitas": contagem ANÔNIMA de uso por aparelho e por dia
--    (quantos perfis existem no aparelho, quanto tempo em cada jogo).
--    Não guarda nome, apelido, e-mail nem endereço de internet:
--    só um número sorteado que cada navegador cria para si.
-- 3) criador_painel(dias): os relatórios. Recusa quem não é criador.
--
-- Pode rodar de novo sem problema.
-- =====================================================================

create table if not exists public.criadores (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  criado_em  timestamptz not null default now()
);

create table if not exists public.visitas (
  dia            date not null,
  aparelho       uuid not null,
  perfis         smallint not null default 0,      -- perfis do modo normal neste aparelho
  turma          smallint not null default 0,      -- perfis de turma neste aparelho
  celular        boolean not null default false,
  jogos          jsonb not null default '{}'::jsonb,   -- segundos jogados no dia, por jogo
  aberturas      jsonb not null default '{}'::jsonb,   -- vezes que abriu cada jogo no dia
  atualizado_em  timestamptz not null default now(),
  primary key (dia, aparelho)
);
create index if not exists visitas_aparelho on public.visitas (aparelho, dia);

alter table public.criadores enable row level security;
alter table public.visitas   enable row level security;
revoke all on public.criadores, public.visitas from anon, authenticated;

-- deixa só os jogos conhecidos, com números inteiros entre 0 e o limite
create or replace function public._jogos_limpos(j jsonb, lim int)
returns jsonb language sql immutable set search_path = public as $$
  select coalesce(jsonb_object_agg(k, least(lim, floor(v::numeric)::int)), '{}'::jsonb)
  from jsonb_each_text(case when jsonb_typeof(j) = 'object' then j else '{}'::jsonb end) e(k, v)
  where k in ('robo','academia','runner','snake','defesa','bomber') and v ~ '^[0-9]{1,9}(\.[0-9]+)?$'
$$;

-- junta dois registros do mesmo dia ficando com o maior número de cada jogo
create or replace function public._jogos_max(a jsonb, b jsonb)
returns jsonb language sql immutable set search_path = public as $$
  select coalesce(jsonb_object_agg(k, greatest(coalesce((a->>k)::int, 0), coalesce((b->>k)::int, 0))), '{}'::jsonb)
  from (select jsonb_object_keys(coalesce(a, '{}'::jsonb) || coalesce(b, '{}'::jsonb)) k) s
$$;

-- chamado pelo saguão (qualquer visitante, sem login)
create or replace function public.registrar_visita(p_aparelho uuid, p_perfis int, p_turma int, p_celular boolean, p_jogos jsonb, p_aberturas jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if p_aparelho is null then raise exception 'dados_invalidos' using errcode = 'P0001'; end if;
  insert into visitas (dia, aparelho, perfis, turma, celular, jogos, aberturas)
  values (d, p_aparelho, least(greatest(coalesce(p_perfis, 0), 0), 50), least(greatest(coalesce(p_turma, 0), 0), 50),
          coalesce(p_celular, false), _jogos_limpos(p_jogos, 86400), _jogos_limpos(p_aberturas, 500))
  on conflict (dia, aparelho) do update set
    perfis = excluded.perfis, turma = excluded.turma, celular = excluded.celular,
    jogos = _jogos_max(visitas.jogos, excluded.jogos),
    aberturas = _jogos_max(visitas.aberturas, excluded.aberturas),
    atualizado_em = now();
  return jsonb_build_object('ok', true);
end $$;

-- a página do professor pergunta isto para saber se mostra o botão do painel
create or replace function public.sou_criador()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from criadores where user_id = auth.uid())
$$;

-- todos os relatórios de uma vez
create or replace function public.criador_painel(p_dias int default 30)
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare
  n int := least(greatest(coalesce(p_dias, 30), 1), 365);
  hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  ini date := hoje - (n - 1);
  r jsonb;
begin
  if auth.uid() is null or not exists (select 1 from criadores where user_id = auth.uid()) then
    raise exception 'sem_acesso' using errcode = 'P0001';
  end if;
  with
  v as (select * from visitas where dia >= ini),
  ult as (select distinct on (aparelho) aparelho, perfis, turma, celular from visitas order by aparelho, dia desc),
  prim as (select aparelho, min(dia) d0 from visitas group by aparelho),
  dias as (select generate_series(ini, hoje, interval '1 day')::date d),
  jg as (select e.key jogo, sum(e.value::numeric)::bigint seg, count(distinct v.aparelho) aparelhos
           from v, jsonb_each_text(v.jogos) e where e.value::numeric > 0 group by e.key),
  ab as (select e.key jogo, sum(e.value::numeric)::bigint vezes from v, jsonb_each_text(v.aberturas) e group by e.key)
  select jsonb_build_object(
    'agora', now(), 'dias', n, 'hoje', hoje,
    'totais', jsonb_build_object(
      'aparelhos_total',  (select count(*) from prim),
      'aparelhos_periodo',(select count(distinct aparelho) from v),
      'aparelhos_hoje',   (select count(*) from visitas where dia = hoje),
      'aparelhos_novos',  (select count(*) from prim where d0 >= ini),
      'perfis_normais',   (select coalesce(sum(perfis), 0) from ult),
      'perfis_turma_aparelhos', (select coalesce(sum(turma), 0) from ult),
      'celular_periodo',  (select count(distinct aparelho) from v where celular),
      'segundos_periodo', (select coalesce(sum(seg), 0) from jg),
      'segundos_hoje',    (select coalesce(sum(e.value::numeric), 0)::bigint from visitas x, jsonb_each_text(x.jogos) e where x.dia = hoje),
      'professores',      (select count(*) from professores),
      'professores_novos',(select count(*) from professores where criado_em >= ini),
      'turmas',           (select count(*) from turmas),
      'turmas_abertas',   (select count(*) from turmas where aberta),
      'alunos',           (select count(*) from alunos),
      'alunos_novos',     (select count(*) from alunos where criado_em >= ini),
      'alunos_hoje',      (select count(*) from alunos where ultimo_acesso >= hoje::timestamp at time zone 'America/Sao_Paulo'),
      'alunos_7d',        (select count(*) from alunos where ultimo_acesso >= now() - interval '7 days'),
      'alunos_30d',       (select count(*) from alunos where ultimo_acesso >= now() - interval '30 days')),
    'por_dia', (select coalesce(jsonb_agg(jsonb_build_object(
        'dia', d,
        'aparelhos', (select count(*) from v where v.dia = d),
        'novos',     (select count(*) from prim where d0 = d),
        'com_turma', (select count(*) from v where v.dia = d and v.turma > 0),
        'minutos',   (select coalesce(sum(e.value::numeric), 0)::bigint / 60 from v, jsonb_each_text(v.jogos) e where v.dia = d),
        'alunos_novos', (select count(*) from alunos a where (a.criado_em at time zone 'America/Sao_Paulo')::date = d),
        'professores_novos', (select count(*) from professores p where (p.criado_em at time zone 'America/Sao_Paulo')::date = d)
      ) order by d), '[]'::jsonb) from dias),
    'jogos', (select coalesce(jsonb_object_agg(g, jsonb_build_object(
        'segundos', coalesce((select seg from jg where jg.jogo = g), 0),
        'aparelhos', coalesce((select aparelhos from jg where jg.jogo = g), 0),
        'aberturas', coalesce((select vezes from ab where ab.jogo = g), 0))), '{}'::jsonb)
      from unnest(array['robo','academia','runner','snake','defesa','bomber']) g),
    'professores', (select coalesce(jsonb_agg(jsonb_build_object(
        'nome', p.nome, 'email', u.email, 'criado_em', p.criado_em,
        'turmas', (select count(*) from turmas t where t.professor_id = p.id),
        'abertas', (select count(*) from turmas t where t.professor_id = p.id and t.aberta),
        'alunos', (select count(*) from alunos a join turmas t on t.id = a.turma_id where t.professor_id = p.id),
        'ativos_7d', (select count(*) from alunos a join turmas t on t.id = a.turma_id where t.professor_id = p.id and a.ultimo_acesso >= now() - interval '7 days'),
        'ultimo_aluno', (select max(a.ultimo_acesso) from alunos a join turmas t on t.id = a.turma_id where t.professor_id = p.id)
      ) order by p.criado_em desc), '[]'::jsonb) from professores p left join auth.users u on u.id = p.id),
    'turmas', (select coalesce(jsonb_agg(jsonb_build_object(
        'nome', t.nome, 'professor', p.nome, 'ativa', t.ativa, 'aberta', t.aberta, 'criado_em', t.criado_em,
        'alunos', (select count(*) from alunos a where a.turma_id = t.id),
        'ativos_7d', (select count(*) from alunos a where a.turma_id = t.id and a.ultimo_acesso >= now() - interval '7 days'),
        'ultimo', (select max(a.ultimo_acesso) from alunos a where a.turma_id = t.id)
      ) order by t.criado_em desc), '[]'::jsonb) from turmas t left join professores p on p.id = t.professor_id),
    'cadastros', (select coalesce(jsonb_agg(x order by x->>'quando' desc), '[]'::jsonb) from (
        (select jsonb_build_object('tipo', 'aluno', 'nome', a.apelido, 'onde', t.nome, 'quando', a.criado_em) x
           from alunos a join turmas t on t.id = a.turma_id order by a.criado_em desc limit 25)
        union all
        (select jsonb_build_object('tipo', 'professor', 'nome', p.nome, 'onde', '', 'quando', p.criado_em)
           from professores p order by p.criado_em desc limit 10)) s)
  ) into r;
  return r;
end $$;

revoke all on function public._jogos_limpos(jsonb,int), public._jogos_max(jsonb,jsonb) from public, anon, authenticated;
revoke all on function public.registrar_visita(uuid,int,int,boolean,jsonb,jsonb), public.sou_criador(), public.criador_painel(int) from public;
grant execute on function public.registrar_visita(uuid,int,int,boolean,jsonb,jsonb) to anon, authenticated;
grant execute on function public.sou_criador(), public.criador_painel(int) to authenticated;
