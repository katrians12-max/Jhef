-- =====================================================================
-- Mundo do Bip · atualização 004: abrir e fechar a aula
--  O professor toca em "Abrir aula" e "Fechar aula" na área do professor.
--  Com a turma FECHADA, o aluno não entra na turma, não cria acesso e o banco
--  recusa salvar progresso (mesmo de quem já estava com a turma aberta no celular).
--  Em casa, o aluno pode jogar no modo normal (perfil só do aparelho), que não conta para a turma.
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo inteiro e clique em "Run".
-- Não apaga nada. Pode rodar de novo sem problema. Depois de rodar, as turmas começam FECHADAS.
-- =====================================================================
alter table public.turmas add column if not exists aberta boolean not null default false;
alter table public.turmas add column if not exists aberta_em timestamptz;

-- a turma do aluno está aberta agora?
create or replace function public._turma_aberta(p_aluno uuid) returns boolean language sql stable set search_path = public as $$
  select coalesce((select t.aberta from alunos a join turmas t on t.id = a.turma_id where a.id = p_aluno), false)
$$;

create or replace function public._resposta_aluno(p_aluno uuid, p_token uuid) returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    'token', p_token, 'aluno_id', a.id, 'apelido', a.apelido, 'cor', a.cor,
    'turma', jsonb_build_object('nome', t.nome, 'codigo', t.codigo, 'aberta', t.aberta),
    'progresso', coalesce((select jsonb_object_agg(p.jogo, p.dados) from progresso p where p.aluno_id = a.id), '{}'::jsonb))
  from alunos a join turmas t on t.id = a.turma_id where a.id = p_aluno
$$;

create or replace function public.aluno_cadastrar(p_codigo text, p_apelido text, p_pin text, p_cor text default '#f2c230')
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare t turmas; a_id uuid; tok uuid; ap text := btrim(regexp_replace(coalesce(p_apelido,''), '\s+', ' ', 'g'));
begin
  select * into t from turmas where codigo = upper(btrim(p_codigo)) and ativa;
  if not found then raise exception 'turma_nao_encontrada' using errcode = 'P0001'; end if;
  if not t.aberta then raise exception 'turma_fechada' using errcode = 'P0001'; end if;
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
declare a alunos; tok uuid; aberta boolean;
begin
  select a2.* into a from alunos a2 join turmas t on t.id = a2.turma_id
   where t.codigo = upper(btrim(p_codigo)) and t.ativa and lower(a2.apelido) = lower(btrim(regexp_replace(coalesce(p_apelido,''), '\s+', ' ', 'g')));
  if not found then raise exception 'aluno_nao_encontrado' using errcode = 'P0001'; end if;
  select t.aberta into aberta from turmas t where t.id = a.turma_id;
  if not aberta then raise exception 'turma_fechada' using errcode = 'P0001'; end if;
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
  if not _turma_aberta(a_id) then raise exception 'turma_fechada' using errcode = 'P0001'; end if;
  update alunos set ultimo_acesso = now() where id = a_id;
  return _resposta_aluno(a_id, p_token);
end $$;

create or replace function public.aluno_salvar(p_token uuid, p_jogo text, p_dados jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a_id uuid := _aluno_da_sessao(p_token);
begin
  if a_id is null then raise exception 'sessao_expirada' using errcode = 'P0001'; end if;
  if not _turma_aberta(a_id) then raise exception 'turma_fechada' using errcode = 'P0001'; end if;
  if p_jogo not in ('robo','academia','loja','runner') then raise exception 'jogo_invalido' using errcode = 'P0001'; end if;
  if jsonb_typeof(p_dados) <> 'object' or octet_length(p_dados::text) > 100000 then raise exception 'dados_invalidos' using errcode = 'P0001'; end if;
  insert into progresso (aluno_id, jogo, dados, atualizado_em) values (a_id, p_jogo, p_dados, now())
    on conflict (aluno_id, jogo) do update set dados = excluded.dados, atualizado_em = now();
  update alunos set ultimo_acesso = now() where id = a_id;
  return jsonb_build_object('ok', true, 'atualizado_em', now());
end $$;

-- lista de turmas do professor, agora dizendo se a aula está aberta
create or replace function public.professor_turmas()
returns jsonb language sql security definer stable set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'nome', t.nome, 'codigo', t.codigo, 'ativa', t.ativa, 'criado_em', t.criado_em,
          'aberta', t.aberta, 'aberta_em', t.aberta_em,
          'alunos', (select count(*) from alunos a where a.turma_id = t.id)) order by t.criado_em desc), '[]'::jsonb)
  from turmas t where t.professor_id = auth.uid()
$$;

-- turma nova já responde se a aula está aberta (começa fechada)
create or replace function public.professor_criar_turma(p_nome text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare u uuid := auth.uid(); t turmas;
begin
  if u is null then raise exception 'precisa_entrar' using errcode = 'P0001'; end if;
  if char_length(btrim(coalesce(p_nome,''))) < 1 then raise exception 'nome_invalido' using errcode = 'P0001'; end if;
  if (select count(*) from turmas where professor_id = u) >= 30 then raise exception 'limite_turmas' using errcode = 'P0001'; end if;
  perform professor_perfil(null);
  insert into turmas (professor_id, nome, codigo) values (u, left(btrim(p_nome), 40), _novo_codigo()) returning * into t;
  return jsonb_build_object('id', t.id, 'nome', t.nome, 'codigo', t.codigo, 'ativa', t.ativa, 'aberta', t.aberta, 'aberta_em', t.aberta_em, 'alunos', 0);
end $$;

-- botão "Abrir aula" / "Fechar aula"
create or replace function public.professor_aula(p_turma uuid, p_aberta boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r turmas;
begin
  update turmas set aberta = coalesce(p_aberta, false), aberta_em = case when coalesce(p_aberta, false) then now() else null end
   where id = p_turma and professor_id = auth.uid() returning * into r;
  if not found then raise exception 'turma_nao_encontrada' using errcode = 'P0001'; end if;
  return jsonb_build_object('ok', true, 'aberta', r.aberta, 'aberta_em', r.aberta_em);
end $$;

revoke all on function public._turma_aberta(uuid), public._resposta_aluno(uuid, uuid) from public, anon, authenticated;
revoke all on function public.aluno_cadastrar(text,text,text,text), public.aluno_entrar(text,text,text), public.aluno_dados(uuid), public.aluno_salvar(uuid,text,jsonb) from public;
grant execute on function public.aluno_cadastrar(text,text,text,text), public.aluno_entrar(text,text,text), public.aluno_dados(uuid), public.aluno_salvar(uuid,text,jsonb) to anon, authenticated;
revoke all on function public.professor_turmas(), public.professor_criar_turma(text), public.professor_aula(uuid,boolean) from public, anon;
grant execute on function public.professor_turmas(), public.professor_criar_turma(text), public.professor_aula(uuid,boolean) to authenticated;
