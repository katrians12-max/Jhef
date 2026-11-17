-- =====================================================================
-- Mundo do Bip · banco de dados (Supabase)
-- Turmas do professor, alunos com apelido + PIN, progresso salvo na nuvem.
--
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo inteiro e clique em "Run".
-- Pode rodar de novo sem problema: ele não apaga dados de alunos.
--
-- Privacidade (LGPD): o aluno NÃO informa e-mail, nome completo nem idade.
-- Só um apelido escolhido por ele e um PIN de 4 números (guardado embaralhado, nunca em texto).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- Tabelas ----------
create table if not exists public.professores (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text not null default '' check (char_length(nome) <= 60),
  criado_em  timestamptz not null default now()
);

create table if not exists public.turmas (
  id            uuid primary key default gen_random_uuid(),
  professor_id  uuid not null references auth.users(id) on delete cascade,
  nome          text not null check (char_length(nome) between 1 and 40),
  codigo        text not null unique check (codigo ~ '^[2-9A-HJ-NP-Z]{6}$'),
  ativa         boolean not null default true,
  criado_em     timestamptz not null default now()
);

create table if not exists public.alunos (
  id             uuid primary key default gen_random_uuid(),
  turma_id       uuid not null references public.turmas(id) on delete cascade,
  apelido        text not null check (char_length(apelido) between 2 and 20),
  cor            text not null default '#f2c230' check (cor ~ '^#[0-9a-fA-F]{6}$'),
  pin_hash       text not null,
  tentativas     int not null default 0,
  bloqueado_ate  timestamptz,
  criado_em      timestamptz not null default now(),
  ultimo_acesso  timestamptz
);
create unique index if not exists alunos_apelido_turma on public.alunos (turma_id, lower(apelido));

create table if not exists public.sessoes (
  token      uuid primary key default gen_random_uuid(),
  aluno_id   uuid not null references public.alunos(id) on delete cascade,
  criado_em  timestamptz not null default now(),
  expira_em  timestamptz not null default now() + interval '180 days'
);
create index if not exists sessoes_aluno on public.sessoes (aluno_id);

create table if not exists public.progresso (
  aluno_id       uuid not null references public.alunos(id) on delete cascade,
  jogo           text not null check (jogo in ('robo','academia')),
  dados          jsonb not null default '{}'::jsonb,
  atualizado_em  timestamptz not null default now(),
  primary key (aluno_id, jogo)
);

-- ---------- Segurança: ninguém lê nem altera as tabelas direto pela internet ----------
-- Tudo passa pelas funções abaixo, que conferem quem está pedindo (o PIN fica sempre escondido).
alter table public.professores enable row level security;
alter table public.turmas      enable row level security;
alter table public.alunos      enable row level security;
alter table public.sessoes     enable row level security;
alter table public.progresso   enable row level security;
revoke all on public.professores, public.turmas, public.alunos, public.sessoes, public.progresso from anon, authenticated;

-- ---------- Funções auxiliares (internas) ----------
create or replace function public._novo_codigo() returns text language plpgsql volatile set search_path = public, extensions as $$
declare abc text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; c text; i int;
begin
  loop
    c := '';
    for i in 1..6 loop c := c || substr(abc, 1 + (get_byte(gen_random_bytes(1), 0) % 32), 1); end loop;
    exit when not exists (select 1 from turmas where codigo = c);
  end loop;
  return c;
end $$;

create or replace function public._aluno_da_sessao(p_token uuid) returns uuid language sql stable set search_path = public as $$
  select aluno_id from sessoes where token = p_token and expira_em > now()
$$;

create or replace function public._resposta_aluno(p_aluno uuid, p_token uuid) returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    'token', p_token, 'aluno_id', a.id, 'apelido', a.apelido, 'cor', a.cor,
    'turma', jsonb_build_object('nome', t.nome, 'codigo', t.codigo),
    'progresso', coalesce((select jsonb_object_agg(p.jogo, p.dados) from progresso p where p.aluno_id = a.id), '{}'::jsonb))
  from alunos a join turmas t on t.id = a.turma_id where a.id = p_aluno
$$;

-- ---------- Aluno (não precisa de conta: usa o código da turma + apelido + PIN) ----------
create or replace function public.aluno_cadastrar(p_codigo text, p_apelido text, p_pin text, p_cor text default '#f2c230')
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare t turmas; a_id uuid; tok uuid; ap text := btrim(regexp_replace(coalesce(p_apelido,''), '\s+', ' ', 'g'));
begin
  select * into t from turmas where codigo = upper(btrim(p_codigo)) and ativa;
  if not found then raise exception 'turma_nao_encontrada' using errcode = 'P0001'; end if;
  if char_length(ap) < 2 or char_length(ap) > 20 then raise exception 'apelido_invalido' using errcode = 'P0001'; end if;
  if coalesce(p_pin,'') !~ '^[0-9]{4}$' then raise exception 'pin_invalido' using errcode = 'P0001'; end if;
  if (select count(*) from alunos where turma_id = t.id) >= 80 then raise exception 'turma_cheia' using errcode = 'P0001'; end if;
  if exists (select 1 from alunos where turma_id = t.id and lower(apelido) = lower(ap)) then raise exception 'apelido_em_uso' using errcode = 'P0001'; end if;
  insert into alunos (turma_id, apelido, cor, pin_hash, ultimo_acesso)
    values (t.id, ap, case when p_cor ~ '^#[0-9a-fA-F]{6}$' then p_cor else '#f2c230' end, crypt(p_pin, gen_salt('bf', 8)), now())
    returning id into a_id;
  insert into sessoes (aluno_id) values (a_id) returning token into tok;
  return _resposta_aluno(a_id, tok);
end $$;

create or replace function public.aluno_entrar(p_codigo text, p_apelido text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare a alunos; tok uuid;
begin
  select a2.* into a from alunos a2 join turmas t on t.id = a2.turma_id
   where t.codigo = upper(btrim(p_codigo)) and t.ativa and lower(a2.apelido) = lower(btrim(regexp_replace(coalesce(p_apelido,''), '\s+', ' ', 'g')));
  if not found then raise exception 'aluno_nao_encontrado' using errcode = 'P0001'; end if;
  if a.bloqueado_ate is not null and a.bloqueado_ate > now() then raise exception 'bloqueado' using errcode = 'P0001'; end if;
  if a.pin_hash <> crypt(coalesce(p_pin,''), a.pin_hash) then
    -- 5 erros seguidos bloqueiam por 10 minutos (contra quem tenta adivinhar o PIN).
    -- Aqui a função RETORNA o erro em vez de "raise", senão a contagem de tentativas seria desfeita.
    update alunos set tentativas = case when a.tentativas + 1 >= 5 then 0 else a.tentativas + 1 end,
                      bloqueado_ate = case when a.tentativas + 1 >= 5 then now() + interval '10 minutes' else null end
     where id = a.id;
    return jsonb_build_object('erro', case when a.tentativas + 1 >= 5 then 'bloqueado' else 'pin_errado' end,
                              'restam', greatest(0, 4 - a.tentativas));
  end if;
  update alunos set tentativas = 0, bloqueado_ate = null, ultimo_acesso = now() where id = a.id;
  delete from sessoes where aluno_id = a.id and expira_em < now();
  insert into sessoes (aluno_id) values (a.id) returning token into tok;
  return _resposta_aluno(a.id, tok);
end $$;

create or replace function public.aluno_dados(p_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a_id uuid := _aluno_da_sessao(p_token);
begin
  if a_id is null then raise exception 'sessao_expirada' using errcode = 'P0001'; end if;
  update alunos set ultimo_acesso = now() where id = a_id;
  return _resposta_aluno(a_id, p_token);
end $$;

create or replace function public.aluno_salvar(p_token uuid, p_jogo text, p_dados jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a_id uuid := _aluno_da_sessao(p_token);
begin
  if a_id is null then raise exception 'sessao_expirada' using errcode = 'P0001'; end if;
  if p_jogo not in ('robo','academia') then raise exception 'jogo_invalido' using errcode = 'P0001'; end if;
  if jsonb_typeof(p_dados) <> 'object' or octet_length(p_dados::text) > 100000 then raise exception 'dados_invalidos' using errcode = 'P0001'; end if;
  insert into progresso (aluno_id, jogo, dados, atualizado_em) values (a_id, p_jogo, p_dados, now())
    on conflict (aluno_id, jogo) do update set dados = excluded.dados, atualizado_em = now();
  update alunos set ultimo_acesso = now() where id = a_id;
  return jsonb_build_object('ok', true, 'atualizado_em', now());
end $$;

create or replace function public.aluno_sair(p_token uuid)
returns jsonb language sql security definer set search_path = public as $$
  delete from sessoes where token = p_token returning jsonb_build_object('ok', true)
$$;

-- ---------- Professor (entra com e-mail e senha pelo Supabase Auth) ----------
create or replace function public.professor_perfil(p_nome text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); p professores;
begin
  if u is null then raise exception 'precisa_entrar' using errcode = 'P0001'; end if;
  insert into professores (id, nome)
    values (u, coalesce(left(btrim(p_nome), 60), left((select raw_user_meta_data->>'nome' from auth.users where id = u), 60), ''))
    on conflict (id) do update set nome = case when p_nome is null then professores.nome else left(btrim(p_nome), 60) end
    returning * into p;
  return jsonb_build_object('id', p.id, 'nome', p.nome);
end $$;

create or replace function public.professor_criar_turma(p_nome text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare u uuid := auth.uid(); t turmas;
begin
  if u is null then raise exception 'precisa_entrar' using errcode = 'P0001'; end if;
  if char_length(btrim(coalesce(p_nome,''))) < 1 then raise exception 'nome_invalido' using errcode = 'P0001'; end if;
  if (select count(*) from turmas where professor_id = u) >= 30 then raise exception 'limite_turmas' using errcode = 'P0001'; end if;
  perform professor_perfil(null);
  insert into turmas (professor_id, nome, codigo) values (u, left(btrim(p_nome), 40), _novo_codigo()) returning * into t;
  return jsonb_build_object('id', t.id, 'nome', t.nome, 'codigo', t.codigo, 'ativa', t.ativa, 'alunos', 0);
end $$;

create or replace function public.professor_turmas()
returns jsonb language sql security definer stable set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'nome', t.nome, 'codigo', t.codigo, 'ativa', t.ativa, 'criado_em', t.criado_em,
          'alunos', (select count(*) from alunos a where a.turma_id = t.id)) order by t.criado_em desc), '[]'::jsonb)
  from turmas t where t.professor_id = auth.uid()
$$;

create or replace function public.professor_alunos(p_turma uuid)
returns jsonb language plpgsql security definer stable set search_path = public as $$
begin
  if not exists (select 1 from turmas where id = p_turma and professor_id = auth.uid()) then raise exception 'turma_nao_encontrada' using errcode = 'P0001'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'apelido', a.apelido, 'cor', a.cor, 'criado_em', a.criado_em, 'ultimo_acesso', a.ultimo_acesso,
            'progresso', coalesce((select jsonb_object_agg(p.jogo, p.dados) from progresso p where p.aluno_id = a.id), '{}'::jsonb)) order by lower(a.apelido))
          from alunos a where a.turma_id = p_turma), '[]'::jsonb);
end $$;

create or replace function public.professor_editar_turma(p_turma uuid, p_nome text default null, p_ativa boolean default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  update turmas set nome = coalesce(left(nullif(btrim(p_nome), ''), 40), nome), ativa = coalesce(p_ativa, ativa)
   where id = p_turma and professor_id = auth.uid();
  if not found then raise exception 'turma_nao_encontrada' using errcode = 'P0001'; end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.professor_apagar_turma(p_turma uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  delete from turmas where id = p_turma and professor_id = auth.uid();
  if not found then raise exception 'turma_nao_encontrada' using errcode = 'P0001'; end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.professor_novo_pin(p_aluno uuid, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if coalesce(p_pin,'') !~ '^[0-9]{4}$' then raise exception 'pin_invalido' using errcode = 'P0001'; end if;
  update alunos a set pin_hash = crypt(p_pin, gen_salt('bf', 8)), tentativas = 0, bloqueado_ate = null
   from turmas t where a.id = p_aluno and t.id = a.turma_id and t.professor_id = auth.uid();
  if not found then raise exception 'aluno_nao_encontrado' using errcode = 'P0001'; end if;
  delete from sessoes where aluno_id = p_aluno;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.professor_remover_aluno(p_aluno uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  delete from alunos a using turmas t where a.id = p_aluno and t.id = a.turma_id and t.professor_id = auth.uid();
  if not found then raise exception 'aluno_nao_encontrado' using errcode = 'P0001'; end if;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- Quem pode chamar cada função ----------
revoke all on function public._novo_codigo(), public._aluno_da_sessao(uuid), public._resposta_aluno(uuid, uuid) from public, anon, authenticated;
revoke all on function public.aluno_cadastrar(text,text,text,text), public.aluno_entrar(text,text,text), public.aluno_dados(uuid),
  public.aluno_salvar(uuid,text,jsonb), public.aluno_sair(uuid) from public;
grant execute on function public.aluno_cadastrar(text,text,text,text), public.aluno_entrar(text,text,text), public.aluno_dados(uuid),
  public.aluno_salvar(uuid,text,jsonb), public.aluno_sair(uuid) to anon, authenticated;
revoke all on function public.professor_perfil(text), public.professor_criar_turma(text), public.professor_turmas(), public.professor_alunos(uuid),
  public.professor_editar_turma(uuid,text,boolean), public.professor_apagar_turma(uuid), public.professor_novo_pin(uuid,text), public.professor_remover_aluno(uuid) from public, anon;
grant execute on function public.professor_perfil(text), public.professor_criar_turma(text), public.professor_turmas(), public.professor_alunos(uuid),
  public.professor_editar_turma(uuid,text,boolean), public.professor_apagar_turma(uuid), public.professor_novo_pin(uuid,text), public.professor_remover_aluno(uuid) to authenticated;
