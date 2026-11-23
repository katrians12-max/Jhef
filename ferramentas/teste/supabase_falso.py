"""Servidor de teste que imita o Supabase usando o Postgres local (só para testar no computador).
Serve a pasta dist/ e responde /rest/v1/rpc/* e /auth/v1/* como o Supabase faria.
uso: python3 supabase_falso.py PORTA PASTA_DIST"""
import sys,json,subprocess,re,uuid,http.server,urllib.parse,os
PORT=int(sys.argv[1]);DIST=sys.argv[2]
PSQL=['psql','-h','/tmp','-p','5433','-U','postgres','-d','bip','-At','-v','ON_ERROR_STOP=1','-q']
def q(v):
    tag='q'+uuid.uuid4().hex[:8];return f'${tag}${v}${tag}$'
def sql(cmd):
    r=subprocess.run(PSQL+['-c',cmd],capture_output=True,text=True)
    return r.returncode,r.stdout.strip(),r.stderr.strip()
USERS={}
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k):super().__init__(*a,directory=DIST,**k)
    def log_message(s,*a):pass
    def send(s,code,obj):
        b=json.dumps(obj).encode();s.send_response(code);s.send_header('Content-Type','application/json');s.send_header('Content-Length',str(len(b)));s.end_headers();s.wfile.write(b)
    def body(s):
        n=int(s.headers.get('Content-Length') or 0);return json.loads(s.rfile.read(n) or b'{}')
    def do_GET(s):
        p=urllib.parse.urlparse(s.path).path
        if p in('/','/index.html','/professor.html','/runner.html','/snake.html'):
            f=os.path.join(DIST,'index.html' if p=='/' else p[1:]);h=open(f,encoding='utf8').read()
            h=re.sub(r'window\.BIP_CFG=\{[^}]*\};',f'window.BIP_CFG={{"url":"http://localhost:{PORT}","key":"chave-teste"}};',h)
            b=h.encode();s.send_response(200);s.send_header('Content-Type','text/html; charset=utf-8');s.send_header('Content-Length',str(len(b)));s.end_headers();s.wfile.write(b);return
        return super().do_GET()
    def do_PUT(s):
        if s.path.startswith('/auth/v1/user'):s.body();return s.send(200,{"ok":True})
        s.send(404,{})
    def do_POST(s):
        u=urllib.parse.urlparse(s.path);path=u.path;qs=urllib.parse.parse_qs(u.query);d=s.body()
        if s.headers.get('apikey')!='chave-teste':return s.send(401,{"message":"No API key found in request"})
        auth=s.headers.get('Authorization','');sub=auth[len('Bearer tok-'):] if auth.startswith('Bearer tok-') else ''
        if path.startswith('/rest/v1/rpc/'):
            fn=path.split('/')[-1]
            if not re.fullmatch(r'[a-z_]+',fn):return s.send(404,{})
            args=', '.join(f'{k} => {q(json.dumps(v) if isinstance(v,(dict,list)) else ("" if v is None else str(v)))}' if v is not None else f'{k} => null' for k,v in d.items())
            role='authenticated' if sub else 'anon'
            rc,out,err=sql(f"set role {role}; select set_config('request.jwt.claim.sub','{sub}',false); select to_json(public.{fn}({args}));")
            if rc:
                m=re.search(r'ERROR:\s+(.*)',err);msg=m.group(1) if m else err
                code=401 if 'permission denied' in msg else 400
                return s.send(code,{"code":"42501" if code==401 else "P0001","message":msg})
            out=out.splitlines()[-1] if out else 'null'
            b=out.encode();s.send_response(200);s.send_header('Content-Type','application/json');s.send_header('Content-Length',str(len(b)));s.end_headers();s.wfile.write(b);return
        if path=='/auth/v1/signup':
            rc,out,err=sql(f"insert into auth.users(email,raw_user_meta_data) values ({q(d['email'])},{q(json.dumps(d.get('data') or {}))}::jsonb) returning id")
            uid=out.splitlines()[-1];USERS[d['email']]=(uid,d.get('password'),d.get('data') or {})
            if os.environ.get('CONFIRMAR'):return s.send(200,{"id":uid,"email":d['email']})
            return s.send(200,{"access_token":'tok-'+uid,"refresh_token":'r-'+uid,"expires_in":3600,"user":{"id":uid,"email":d['email'],"user_metadata":d.get('data') or {}}})
        if path=='/auth/v1/token':
            g=qs.get('grant_type',[''])[0]
            if g=='password':
                x=USERS.get(d.get('email'))
                if not x or x[1]!=d.get('password'):return s.send(400,{"error_code":"invalid_credentials","msg":"Invalid login credentials"})
                return s.send(200,{"access_token":'tok-'+x[0],"refresh_token":'r-'+x[0],"expires_in":3600,"user":{"id":x[0],"email":d['email'],"user_metadata":x[2]}})
            if g=='refresh_token':
                uid=d.get('refresh_token','')[2:];return s.send(200,{"access_token":'tok-'+uid,"refresh_token":'r-'+uid,"expires_in":3600,"user":{"id":uid}})
        if path in('/auth/v1/logout','/auth/v1/recover'):return s.send(200,{})
        s.send(404,{"message":"not found"})
http.server.ThreadingHTTPServer(('127.0.0.1',PORT),H).serve_forever()
