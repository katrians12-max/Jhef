\set ON_ERROR_STOP 0
\pset tuples_only on
insert into auth.users(id,email) values ('11111111-1111-1111-1111-111111111111','p1@x'),('22222222-2222-2222-2222-222222222222','p2@x') on conflict do nothing;
-- professor 1 cria turma
set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select '1 perfil', professor_perfil('Jhef');
select (professor_criar_turma('7º ano A'))->>'codigo' as codigo \gset
select :'codigo' ~ '^[2-9A-HJ-NP-Z]{6}$' as "3 codigo valido";
reset role; select set_config('request.jwt.claim.sub','',false);
-- aluno (anon)
set role anon;
select '4 cadastro', (aluno_cadastrar(:'codigo','  Ana   Clara ','1234','#6fb6ff'))->>'apelido';
select '5 apelido repetido'; select aluno_cadastrar(:'codigo','ana clara','9999');
select '6 pin invalido'; select aluno_cadastrar(:'codigo','Beto','12a4');
select '7 turma errada'; select aluno_cadastrar('ZZZZZZ','Beto','1234');
select '8 entrar certo', (aluno_entrar(lower(:'codigo'),'ANA CLARA','1234'))->>'apelido';
select (aluno_entrar(:'codigo','Ana Clara','1234'))->>'token' as tok \gset
select '9 salvar', aluno_salvar(:'tok','robo','{"v":1,"stars":{"Um passo":3}}')->>'ok';
select '10 dados', aluno_dados(:'tok')->'progresso';
select '11 jogo invalido'; select aluno_salvar(:'tok','xadrez','{}');
select '12 erros de pin:', (aluno_entrar(:'codigo','Ana Clara','0000'))->>'erro',(aluno_entrar(:'codigo','Ana Clara','0000'))->>'erro',(aluno_entrar(:'codigo','Ana Clara','0000'))->>'erro',(aluno_entrar(:'codigo','Ana Clara','0000'))->>'erro',(aluno_entrar(:'codigo','Ana Clara','0000'))->>'erro';
select '13 pin certo durante bloqueio'; select aluno_entrar(:'codigo','Ana Clara','1234');
select '14 anon le tabela alunos'; select count(*) from alunos;
select '15 anon chama funcao de professor'; select professor_turmas();
select '16 anon chama funcao interna'; select _novo_codigo();
reset role;
select id as turma_id from turmas limit 1 \gset
select id as aluno_id from alunos limit 1 \gset
-- professor 2 tenta ver a turma do professor 1
set role authenticated; select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
select '17 p2 turmas', professor_turmas();
select '18 p2 ve alunos da p1'; select professor_alunos(:'turma_id');
select '19 p2 select direto alunos'; select count(*) from alunos;
select '20 p2 troca pin de aluno da p1'; select professor_novo_pin(:'aluno_id','5555');
select '21 p2 sessoes'; select count(*) from sessoes;
reset role;
-- professor 1 vê tudo da turma dele
set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select '22 p1 turmas', jsonb_array_length(professor_turmas());
select '23 p1 alunos', professor_alunos(:'turma_id');
select '24 p1 select direto alunos (pin_hash)'; select pin_hash from alunos;
select '25 p1 novo pin', professor_novo_pin(:'aluno_id','4321')->>'ok';
reset role; set role anon;
select '26 token antigo depois do novo pin'; select aluno_dados(:'tok');
select '27 entrar com pin novo (desbloqueado)', (aluno_entrar(:'codigo','Ana Clara','4321'))->>'apelido';
reset role;
