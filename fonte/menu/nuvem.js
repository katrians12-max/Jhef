/* ===== Mundo do Bip · conexão com o banco (Supabase), sem biblioteca: só fetch =====
   window.BIP_CFG = {url, key} é colocado pelo build.py a partir de fonte/config.json.
   Sem configuração, NUVEM.on = false e o site funciona só no aparelho, como antes. */
const NUVEM=(()=>{
 const C=window.BIP_CFG||{},on=!!(C.url&&C.key);
 const H=tok=>{const h={"Content-Type":"application/json","apikey":C.key};if(tok)h.Authorization="Bearer "+tok;return h};
 async function call(url,opt){let r,j=null;
  try{r=await fetch(url,opt)}catch(e){throw {code:"sem_internet"}}
  try{j=await r.json()}catch(e){}
  return {r,j}}
 /* funções do banco (aluno_*, professor_*) */
 async function rpc(fn,args,tok,keepalive){
  const {r,j}=await call(C.url+"/rest/v1/rpc/"+fn,{method:"POST",headers:H(tok),body:JSON.stringify(args||{}),keepalive:!!keepalive});
  if(!r.ok){const m=(j&&(j.message||j.msg))||"";throw {code:/^[a-z_]+$/.test(m)?m:(r.status==401||r.status==403?"sem_permissao":"erro_"+r.status),status:r.status}}
  if(j&&j.erro)throw {code:j.erro,restam:j.restam};
  return j}
 /* login do professor (Supabase Auth) */
 async function auth(path,body,tok){
  const {r,j}=await call(C.url+"/auth/v1/"+path,{method:"POST",headers:H(tok),body:JSON.stringify(body||{})});
  if(!r.ok)throw {code:(j&&(j.error_code||j.code||j.error))||"erro_"+r.status,msg:(j&&(j.msg||j.error_description||j.message))||"",status:r.status};
  return j}
 return {on,rpc,auth}})();

const ERROS_BIP={
 turma_nao_encontrada:"Não achei essa turma. Confira o código com seu professor.",
 aluno_nao_encontrado:"Não achei esse apelido nesta turma. Se é sua primeira vez, toque em “Primeira vez nesta turma?”.",
 pin_errado:"PIN errado.",
 bloqueado:"Muitas tentativas erradas. Espere 10 minutos ou peça para o professor trocar seu PIN.",
 apelido_em_uso:"Esse apelido já existe nesta turma. Escolha outro (pode juntar com um número, como Ana7).",
 apelido_invalido:"O apelido precisa ter de 2 a 20 letras.",
 pin_invalido:"O PIN precisa ter 4 números.",
 turma_cheia:"Essa turma já está cheia. Fale com seu professor.",
 sessao_expirada:"Sua entrada expirou. Digite seu PIN de novo.",
 turma_fechada:"Sua turma está fechada agora. Ela abre quando o professor começar a aula. Enquanto isso, você pode jogar no modo normal (volte e toque em “Criar meu perfil”).",
 sem_internet:"Sem internet agora. Confira a conexão e tente de novo.",
 nome_invalido:"Escreva um nome para a turma.",
 limite_turmas:"Você chegou ao limite de 30 turmas.",
 precisa_entrar:"Sua sessão de professor terminou. Entre de novo.",
 sem_permissao:"Sua sessão de professor terminou. Entre de novo.",
 invalid_credentials:"E-mail ou senha errados.",
 email_not_confirmed:"Falta confirmar o e-mail. Abra a mensagem que o Supabase enviou e clique no link.",
 user_already_exists:"Já existe uma conta com esse e-mail. Use “Entrar”.",
 weak_password:"Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.",
 over_email_send_rate_limit:"Muitos e-mails enviados agora. Espere alguns minutos e tente de novo.",
 validation_failed:"Confira o e-mail digitado."};
const erroBip=e=>(e&&ERROS_BIP[e.code])||(e&&e.msg)||"Algo deu errado. Tente de novo.";
