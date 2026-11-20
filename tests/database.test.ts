import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';

const player='00000000-0000-4000-8000-000000000001';
const developer='00000000-0000-4000-8000-000000000002';
const admin='00000000-0000-4000-8000-000000000003';
const other='00000000-0000-4000-8000-000000000004';
const free='10000000-0000-4000-8000-000000000001';
const paid='10000000-0000-4000-8000-000000000002';
const draft='10000000-0000-4000-8000-000000000003';
const pending='10000000-0000-4000-8000-000000000004';
const rejected='10000000-0000-4000-8000-000000000005';
const withLibrary='10000000-0000-4000-8000-000000000006';
const withVersion='10000000-0000-4000-8000-000000000007';
const withReview='10000000-0000-4000-8000-000000000008';
const withSession='10000000-0000-4000-8000-000000000009';
const db=new PGlite();

async function as(role:'authenticated'|'anon',id:string,query:string) {
  return db.transaction(async tx=>{
    await tx.exec('set local role '+role);
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[id]);
    return (await tx.query(query)).rows;
  });
}
const by=(id:string,query:string)=>as('authenticated',id,query);
const anon=(query:string)=>as('anon','',query);

beforeAll(async()=>{
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth; create schema storage;
    grant usage on schema auth, storage to anon, authenticated;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid() primary key, bucket_id text, name text);
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to authenticated;
    create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:cardinality(string_to_array(name,'/'))-1] $$;
  `);
  for(const file of readdirSync('supabase/migrations').sort()) await db.exec(readFileSync('supabase/migrations/'+file,'utf8'));
  await db.exec(`
    insert into auth.users (id,raw_user_meta_data) values
      ('${player}','{"display_name":"Jogador teste","username":"duplicate","role":"admin"}'),
      ('${developer}','{"display_name":"Estúdio teste","username":"duplicate"}'),
      ('${admin}','{}'), ('${other}','{}');
    update public.profiles set role='developer' where id='${developer}';
    update public.profiles set role='admin' where id='${admin}';
    insert into public.games (id,developer_id,title,slug,description,ai_disclosure,price,status) values
      ('${free}','${developer}','Fixture gratuita','fixture-gratuita','Descrição','Declaração',0,'published'),
      ('${paid}','${developer}','Fixture paga','fixture-paga','Descrição','Declaração',89.90,'published'),
      ('${draft}','${developer}','Fixture privada','fixture-privada','Descrição','Declaração',0,'draft'),
      ('${pending}','${developer}','Fixture pendente','fixture-pendente','Descrição','Declaração',0,'pending'),
      ('${rejected}','${developer}','Fixture rejeitada','fixture-rejeitada','Descrição','Declaração',0,'rejected'),
      ('${withLibrary}','${developer}','Fixture com biblioteca','fixture-com-biblioteca','Descrição','Declaração',0,'draft'),
      ('${withVersion}','${developer}','Fixture com versão','fixture-com-versao','Descrição','Declaração',0,'draft'),
      ('${withReview}','${developer}','Fixture com avaliação','fixture-com-avaliacao','Descrição','Declaração',0,'draft'),
      ('${withSession}','${developer}','Fixture com sessão','fixture-com-sessao','Descrição','Declaração',0,'draft');
    insert into public.user_library(user_id,game_id) values ('${other}','${withLibrary}');
    insert into public.game_versions(game_id,version) values ('${withVersion}','1.0');
    insert into public.reviews(user_id,game_id,rating) values ('${player}','${withReview}',5);
    insert into public.game_play_sessions(game_id,player_id) values ('${withSession}','${player}');
    insert into public.game_delivery_intake(game_id,delivery_kind,source_url) values ('${rejected}','web','https://example.com/game');
    insert into public.game_updates(game_id,title,description,notes) values ('${rejected}','Atualização de fixture','Descrição','Notas');
    insert into public.game_media(game_id,media_url,media_type) values ('${rejected}','http://localhost:54321/storage/v1/object/public/game-images/${developer}/10000000-0000-4000-8000-000000000010.png','screenshot');
    insert into public.game_moderation_history(game_id,status_from,status_to) values ('${rejected}','pending','rejected');
    insert into public.wishlists(user_id,game_id) values ('${player}','${rejected}');
  `);
});

afterAll(async()=>db.close());

describe('schema, papéis e Storage',()=>{
  it('cria perfil player e resolve colisão no trigger',async()=>{
    expect(await by(player,`select username,display_name,role from profiles where id='${player}'`)).toEqual([{username:'duplicate',display_name:'Jogador teste',role:'player'}]);
    expect(await by(developer,`select role, username='duplicate' as collision from profiles where id='${developer}'`)).toEqual([{role:'developer',collision:false}]);
  });

  it('protege perfis e notas, mantém crédito público e bloqueia a alteração de papel',async()=>{
    await expect(anon('select id from profiles')).rejects.toThrow(/permission denied/);
    expect(await by(player,`select id from profiles where id='${other}'`)).toEqual([]);
    expect(await by(admin,'select count(*)::int as total from profiles')).toEqual([{total:4}]);
    await expect(by(player,`update profiles set role='admin' where id='${player}'`)).rejects.toThrow(/permission denied/);
    await expect(anon('select moderation_notes from games')).rejects.toThrow(/permission denied/);
    await expect(by(player,'select admin_notes from developer_applications')).rejects.toThrow(/permission denied/);
    expect(await anon(`select published_game_developer('${free}') as developer`)).toEqual([{developer:'Estúdio teste'}]);
    expect(await anon(`select published_game_developer('${draft}') as developer`)).toEqual([{developer:null}]);
  });

  it('permite imagens na pasta do usuário e bloqueia executáveis e pastas alheias',async()=>{
    await expect(by(player,`insert into storage.objects(bucket_id,name) values ('avatars','${player}/avatar.png')`)).resolves.toEqual([]);
    await expect(by(player,`insert into storage.objects(bucket_id,name) values ('avatars','${developer}/avatar.png')`)).rejects.toThrow(/row-level security/);
    await expect(by(player,`insert into storage.objects(bucket_id,name) values ('game-images','${player}/cover.png')`)).rejects.toThrow(/row-level security/);
    await expect(by(developer,`insert into storage.objects(bucket_id,name) values ('game-images','${developer}/cover.png')`)).resolves.toEqual([]);
    await expect(by(admin,`insert into storage.objects(bucket_id,name) values ('game-builds','${pending}/game.zip')`)).rejects.toThrow(/row-level security/);
  });

  it('limita o catálogo público a jogos publicados e bloqueia publicação direta',async()=>{
    expect(await anon('select title from published_games_catalog order by title')).toEqual([{title:'Fixture gratuita'},{title:'Fixture paga'}]);
    expect(await by(other,`select id from games where id='${draft}'`)).toEqual([]);
    await expect(by(developer,`update games set status='published' where id='${draft}'`)).rejects.toThrow(/row-level security/);
    expect(await by(player,`update games set title='Mudança' where id='${draft}' returning id`)).toEqual([]);
    await expect(by(player,`select review_game('${pending}',true,null)`)).rejects.toThrow(/Acesso negado/);
    await expect(by(player,`select submit_game('${draft}')`)).rejects.toThrow(/Acesso negado/);
  });
});

describe('fluxos persistidos',()=>{
  it('exclui somente rascunhos ou rejeitados do dono sem histórico de jogadores',async()=>{
    await expect(anon(`select public.delete_own_game('${draft}')`)).rejects.toThrow(/permission denied/);
    await expect(by(other,`select public.delete_own_game('${draft}')`)).rejects.toThrow(/sem permissão/);
    await expect(by(developer,`select public.delete_own_game('${free}')`)).rejects.toThrow(/Apenas rascunhos e jogos rejeitados/);
    for(const gameId of [withLibrary,withVersion,withReview,withSession]){
      await expect(by(developer,`select public.delete_own_game('${gameId}')`)).rejects.toThrow(/histórico ou instalações/);
    }

    await by(developer,`select public.delete_own_game('${rejected}')`);
    expect((await db.query(`select id from public.games where id='${rejected}'`)).rows).toEqual([]);
    expect((await db.query(`
      select
        (select count(*)::int from public.game_delivery_intake where game_id='${rejected}') as delivery,
        (select count(*)::int from public.game_updates where game_id='${rejected}') as updates,
        (select count(*)::int from public.game_media where game_id='${rejected}') as media,
        (select count(*)::int from public.game_moderation_history where game_id='${rejected}') as moderation,
        (select count(*)::int from public.wishlists where game_id='${rejected}') as wishlists
    `)).rows).toEqual([{delivery:0,updates:0,media:0,moderation:0,wishlists:0}]);
  });

  it('aprova um desenvolvedor e registra o revisor',async()=>{
    await by(other,`insert into developer_applications(user_id,studio_name) values ('${other}','Estúdio fixture')`);
    const [application]=await by(other,`select id from developer_applications where user_id='${other}'`) as {id:string}[];
    await expect(by(player,`select review_developer_application('${application.id}',true)`)).rejects.toThrow(/Acesso negado/);
    await by(admin,`select review_developer_application('${application.id}',true)`);
    expect(await by(other,`select role from profiles where id='${other}'`)).toEqual([{role:'developer'}]);
    expect(await by(admin,`select status,reviewed_by from developer_applications where id='${application.id}'`)).toEqual([{status:'approved',reviewed_by:admin}]);
  });

  it('testa envio, rejeição, privacidade de notas, reenvio e publicação',async()=>{
    expect(await by(other,`update games set title='Edição indevida' where id='${draft}' returning id`)).toEqual([]);
    await by(developer,`select submit_game('${draft}')`);
    await by(admin,`select review_game('${draft}',false,'Revisar detalhes')`);
    expect(await by(player,`select get_game_moderation_notes('${draft}') as note`)).toEqual([{note:null}]);
    expect(await by(developer,`select get_game_moderation_notes('${draft}') as note`)).toEqual([{note:'Revisar detalhes'}]);
    await by(developer,`update games set status='draft' where id='${draft}'`);
    await by(developer,`select submit_game('${draft}')`);
    await by(admin,`select review_game('${draft}',true,null)`);
    expect(await anon(`select id from published_games_catalog where id='${draft}'`)).toEqual([{id:draft}]);
    expect(await by(player,`select id from game_moderation_history where game_id='${draft}'`)).toEqual([]);
    expect(await by(admin,`select count(*)::int as total from game_moderation_history where game_id='${draft}'`)).toEqual([{total:5}]);
  });

  it('exige propriedade para avaliações, persiste favoritos e impede aquisições indevidas',async()=>{
    await expect(anon(`select claim_free_game('${free}')`)).rejects.toThrow(/permission denied/);
    await expect(by(player,`select claim_free_game('${paid}')`)).rejects.toThrow(/indisponível/);
    await expect(by(player,`insert into user_library(user_id,game_id) values ('${player}','${paid}')`)).rejects.toThrow(/permission denied/);
    await expect(by(player,`insert into reviews(user_id,game_id,rating) values ('${player}','${free}',5)`)).rejects.toThrow(/row-level security/);
    await by(player,`select claim_free_game('${free}')`);
    await by(player,`select claim_free_game('${free}')`);
    expect(await by(player,'select game_id from user_library')).toEqual([{game_id:free}]);
    await by(player,`insert into reviews(user_id,game_id,rating,comment) values ('${player}','${free}',5,'Muito bom')`);
    expect(await anon(`select rating_average::float,review_count::int from published_games_catalog where id='${free}'`)).toEqual([{rating_average:5,review_count:1}]);
    await by(player,`update reviews set rating=4 where game_id='${free}'`);
    expect(await anon(`select rating from published_game_ratings where game_id='${free}'`)).toEqual([{rating:4}]);
    await by(player,`delete from reviews where game_id='${free}'`);
    await by(player,`insert into wishlists(user_id,game_id) values ('${player}','${paid}')`);
    expect(await by(other,'select game_id from wishlists')).toEqual([]);
    await expect(by(player,`insert into wishlists(user_id,game_id) values ('${player}','${pending}')`)).rejects.toThrow(/row-level security/);
    await by(player,`delete from wishlists where game_id='${paid}'`);
    expect(await by(player,'select game_id from wishlists')).toEqual([]);
  });

  it('expõe estado de versão somente ao proprietário e mantém bucket privado',async()=>{
    const [bucket]=((await db.query("select public from storage.buckets where id='game-builds'")).rows);
    expect(bucket).toEqual({public:false});
    await db.exec(`insert into game_versions(game_id,version) values ('${free}','1.0')`);
    expect(await by(player,'select security_status from game_versions')).toEqual([{security_status:'pending'}]);
    expect(await by(other,'select security_status from game_versions')).toEqual([]);
    await expect(by(player,'select sha256 from game_versions')).rejects.toThrow(/permission denied/);
  });
});
