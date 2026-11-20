import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const integrated=process.env.VORNELIX_TEST_SUPABASE==='1';
const password='Vornelix-test!007';
const changedPassword='Vornelix-test!008';

function isolatedAdmin() {
  const backend=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321');
  const key=process.env.VORNELIX_TEST_SUPABASE_KEY;
  if(!key || !['localhost','127.0.0.1','[::1]'].includes(backend.hostname)) throw new Error('A suíte de integração requer um Supabase local isolado.');
  return createClient(backend.href,key,{auth:{autoRefreshToken:false,persistSession:false}});
}

async function login(page:Page,email:string,secret= password) {
  await page.goto('/login');
  await page.getByLabel('E-mail',{exact:true}).fill(email);
  await page.getByLabel('Senha',{exact:true}).fill(secret);
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
}

async function mailCode(request:APIRequestContext,email:string,type:'email'|'recovery') {
  let messageId='';
  const subject=type==='email'?'Confirme sua conta Vornelix':'Redefina sua senha Vornelix';
  await expect.poll(async()=>{
    const response=await request.get('http://127.0.0.1:54324/api/v1/search',{params:{query:'to:'+email}});
    if(!response.ok()) return '';
    const {messages} = await response.json() as {messages?:{ID:string;Subject:string}[]};
    messageId=messages?.find(message=>message.Subject===subject)?.ID||'';
    return messageId;
  },{timeout:15000}).not.toBe('');
  const response=await request.get('http://127.0.0.1:54324/api/v1/message/'+messageId);
  expect(response.ok()).toBeTruthy();
  const message=await response.json() as {HTML:string};
  const code=message.HTML.match(/<strong>(\d{6})<\/strong>/)?.[1];
  expect(code).toMatch(/^\d{6}$/);
  return code!;
}

test.describe('Supabase local com Auth, Storage e Data API',()=>{
  test.skip(!integrated,'Requer Supabase local e caixa Mailpit isolados');

  test('confirma cadastro, persiste sessão, altera perfil, sai e recupera acesso',async({page,request})=>{
    const supabase=isolatedAdmin();
    const email='player-'+randomUUID()+'@example.com';
    await page.goto('/register');
    await page.getByLabel('Nome de exibição').fill('Jogador teste');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Senha',{exact:true}).fill(password);
    await page.getByLabel('Confirme a senha').fill(password);
    await page.getByRole('checkbox').check();
    await page.getByRole('button',{name:'Cadastrar',exact:true}).click();
    await expect(page).toHaveURL('/verify-email');
    await expect(page.getByRole('heading',{name:'Verifique seu e-mail'})).toBeVisible();
    const users=await supabase.auth.admin.listUsers();
    expect(users.error).toBeNull();
    const user=users.data.users.find(entry=>entry.email===email);
    expect(user).toBeDefined();
    const profile=await supabase.from('profiles').select('role,display_name').eq('id',user!.id).single();
    expect(profile.data).toEqual({role:'player',display_name:'Jogador teste'});

    await page.getByLabel('Código de confirmação').fill(await mailCode(request,email,'email'));
    await page.getByRole('button',{name:'Confirmar e-mail'}).click();
    await expect(page.getByRole('heading',{name:'E-mail confirmado!'})).toBeVisible();
    await page.getByRole('link',{name:'Continuar para minha conta'}).click();
    await expect(page).toHaveURL('/account');
    await page.reload();
    await expect(page.getByRole('heading',{name:'Jogador teste'})).toBeVisible();
    await page.getByRole('link',{name:'Editar perfil'}).click();
    await page.getByLabel('Biografia').fill('Biografia de teste');
    await page.getByRole('button',{name:'Salvar perfil'}).click();
    await expect(page.getByRole('status')).toHaveText('Perfil salvo.');
    await page.locator('input[type=file]').setInputFiles('public/marca-vornelix.webp');
    await expect(page.getByRole('img',{name:'Prévia circular do avatar'})).toBeVisible();
    await page.getByRole('button',{name:'Confirmar recorte e salvar'}).click();
    await expect(page.getByRole('status').filter({hasText:'Avatar atualizado.'})).toBeVisible();
    await expect(page.getByRole('img',{name:'Seu avatar'})).toBeVisible();
    await page.goto('/admin');
    await expect(page.getByRole('heading',{level:1})).toContainText('não tem permissão');

    await page.goto('/account');
    await page.getByRole('button',{name:'Sair'}).click();
    await expect(page).toHaveURL('/');
    await login(page,email,'incorreta');
    await expect(page.locator('#main').getByRole('alert')).toHaveText('E-mail ou senha incorretos.');
    await login(page,email);
    await expect(page).toHaveURL('/account');
    await page.getByRole('button',{name:'Sair'}).click();

    await page.goto('/forgot-password');
    await page.getByLabel('E-mail').fill(email);
    await page.getByRole('button',{name:'Enviar código'}).click();
    await expect(page).toHaveURL('/forgot-password?etapa=codigo');
    await page.getByLabel('Código de verificação').fill(await mailCode(request,email,'recovery'));
    await page.getByLabel('Nova senha',{exact:true}).fill(changedPassword);
    await page.getByLabel('Confirme a nova senha').fill(changedPassword);
    await page.getByRole('button',{name:'Redefinir senha'}).click();
    await expect(page).toHaveURL('/login?senha=atualizada');
    await login(page,email,changedPassword);
    await expect(page).toHaveURL('/account');
  });

  test('solicita acesso, publica um rascunho e valida favoritos, biblioteca, compra e download',async({page,browser})=>{
    test.setTimeout(150000);
    const supabase=isolatedAdmin();
    const run=randomUUID().slice(0,8);
    const developer='developer-'+run+'@example.com';
    const admin='admin-'+run+'@example.com';
    const player='buyer-'+run+'@example.com';

    for(const email of [developer,admin,player]){
      const result=await supabase.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:email.split('@')[0]}});
      expect(result.error).toBeNull();
      if(email===admin){
        const update=await supabase.from('profiles').update({role:'admin'}).eq('id',result.data.user!.id);
        expect(update.error).toBeNull();
      }
    }

    await login(page,developer);
    await expect(page).toHaveURL('/account');
    await page.goto('/developer/apply');
    await page.getByLabel('Nome do estúdio').fill('Estúdio '+run);
    await page.getByLabel('Conte sobre seu projeto e uso de IA').fill('Utilizamos IA na criação dos recursos visuais.');
    await page.getByRole('button',{name:'Enviar solicitação para análise'}).click();
    await expect(page.getByText('Estúdio '+run+' · Em análise')).toBeVisible();

    const adminContext=await browser.newContext();
    const adminPage=await adminContext.newPage();
    await login(adminPage,admin);
    await expect(adminPage).toHaveURL('/account');
    await adminPage.goto('/admin/developers');
    await adminPage.getByRole('heading',{name:'Estúdio '+run}).locator('../..').getByRole('button',{name:'Aprovar',exact:true}).click();
    await expect(adminPage.getByRole('heading',{name:'Estúdio '+run}).locator('..')).toContainText('Aprovada');

    const removableTitle='Rascunho removível '+run;
    await page.goto('/developer/games/new');
    await page.getByLabel('Título').fill(removableTitle);
    await page.getByLabel('Descrição do jogo').fill('Rascunho criado para testar a exclusão do desenvolvedor.');
    await page.getByRole('button',{name:'Salvar rascunho'}).click();
    await expect(page).toHaveURL(/\/developer\/games\/[a-f0-9-]+\/edit/);
    const removableId=new URL(page.url()).pathname.split('/')[3];
    await page.goto('/developer/games');
    const removableRow=page.locator('.row').filter({hasText:removableTitle});
    await removableRow.getByText('Excluir definitivamente',{exact:true}).click();
    await removableRow.getByLabel('Confirmo a exclusão definitiva deste jogo.').check();
    await removableRow.getByRole('button',{name:'Excluir jogo permanentemente'}).click();
    await expect(removableRow).toHaveCount(0);
    expect((await supabase.from('games').select('id').eq('id',removableId)).data).toEqual([]);

    const title='Jogo gratuito '+run;
    await page.goto('/developer/games/new');
    await page.getByLabel('Título').fill(title);
    await page.getByLabel('Descrição do jogo').fill('Descrição cadastrada para o teste de integração.');
    await page.getByRole('button',{name:'Salvar rascunho'}).click();
    await expect(page).toHaveURL(/\/developer\/games\/[a-f0-9-]+\/edit/);
    const gameId=new URL(page.url()).pathname.split('/')[3];
    const draft=await supabase.from('games').select('slug,status').eq('id',gameId).single();
    expect(draft.error).toBeNull();
    expect(draft.data?.status).toBe('draft');
    const slug=draft.data!.slug;
    await page.getByRole('link',{name:'Mídias'}).click();
    const cover=page.locator('.panel').filter({has:page.getByRole('heading',{name:'Capa',exact:true})});
    await cover.locator('input[type=file]').setInputFiles('public/marca-vornelix.webp');
    await cover.getByRole('button',{name:'Salvar imagem'}).click();
    await expect(cover.getByRole('status')).toHaveText('Imagem salva!');
    await expect(cover.getByRole('img',{name:'Prévia'})).toBeVisible();
    await page.getByRole('link',{name:'Voltar para publicação',exact:true}).click();
    const guestContext=await browser.newContext({reducedMotion:'reduce'});
    const guest=await guestContext.newPage();
    const hydrationErrors:string[]=[];
    guest.on('console',message=>{
      if(message.type()==='error' && /hydrat|#418/i.test(message.text())) hydrationErrors.push(message.text());
    });
    await guest.goto('/game/'+slug);
    await expect(guest.getByRole('heading',{level:1})).toHaveText('Página não encontrada');

    await page.getByLabel('Formato').selectOption('windows_zip');
    await page.getByLabel('Link HTTPS').fill('https://example.com/game.zip');
    await page.getByRole('button',{name:'Salvar jogo para análise'}).click();
    await expect(page.getByRole('button',{name:'Salvar e enviar para análise'})).toBeVisible();
    await page.getByLabel('Declaração de uso de IA').fill('Os recursos visuais do jogo foram criados com apoio de IA generativa.');
    await page.getByRole('button',{name:'Salvar e enviar para análise'}).click();
    await expect(page).toHaveURL('/developer/submissions');
    await adminPage.goto('/admin/moderation');
    const moderation=adminPage.getByRole('heading',{name:title,exact:true}).locator('..');
    await moderation.getByLabel('Decisão').selectOption('approve');
    await moderation.getByRole('button',{name:'Registrar decisão'}).click();
    await expect(moderation).toHaveCount(0);
    await guest.goto('/');
    await expect(guest.getByRole('link',{name:new RegExp(title)}).first()).toBeVisible();
    await guest.goto('/search?q='+encodeURIComponent(title));
    await guest.getByRole('link',{name:new RegExp(title)}).click();
    await expect(guest.getByRole('heading',{level:1})).toHaveText(title);
    await guest.getByRole('link',{name:'Download',exact:true}).click();
    await expect(guest).toHaveURL(/\/login\?next=/);
    expect(hydrationErrors).toEqual([]);
    await guestContext.close();

    const buyer=await browser.newContext();
    const buyerPage=await buyer.newPage();
    await login(buyerPage,player);
    await expect(buyerPage).toHaveURL('/account');
    await buyerPage.goto('/game/'+slug);
    await expect(buyerPage.getByRole('button',{name:'Publicar avaliação'})).toHaveCount(0);
    await buyerPage.getByRole('button',{name:'Adicionar aos favoritos'}).click();
    await expect(buyerPage.getByRole('button',{name:'Remover dos favoritos'})).toBeVisible();
    await buyerPage.goto('/wishlist');
    await expect(buyerPage.getByRole('heading',{name:title})).toBeVisible();
    await buyerPage.getByRole('button',{name:'Remover dos favoritos'}).click();
    await expect(buyerPage.getByText('Sua lista de desejos está vazia.')).toBeVisible();
    await buyerPage.goto('/game/'+slug);
    await buyerPage.getByRole('button',{name:'Adicionar à biblioteca'}).click();
    await expect(buyerPage).toHaveURL('/library');
    await expect(buyerPage.getByRole('heading',{name:title})).toBeVisible();
    await buyerPage.getByRole('link',{name:'Download',exact:true}).click();
    await expect(buyerPage.getByRole('status')).toContainText('download deste jogo ainda está indisponível');
    const freeId=new URL(buyerPage.url()).searchParams.get('game');
    const build=await supabase.from('game_versions').insert({game_id:freeId,version:'1.0',security_status:'pending'});
    expect(build.error).toBeNull();
    await buyerPage.reload();
    await expect(buyerPage.getByRole('status')).toContainText('aguarda verificação');
    await buyerPage.goto('/game/'+slug);
    await buyerPage.getByLabel('Comentário').fill('Comentário do teste integrado');
    await buyerPage.getByRole('button',{name:'Publicar avaliação'}).click();
    await expect(buyerPage.locator('p').filter({hasText:'Comentário do teste integrado'})).toBeVisible();
    await buyerPage.getByLabel('Nota').selectOption('4');
    await buyerPage.getByRole('button',{name:'Editar avaliação'}).click();
    await expect(buyerPage.getByRole('region',{name:'Detalhes de '+title}).getByText('1 avaliação',{exact:false})).toBeVisible();
    await buyerPage.getByRole('button',{name:'Excluir avaliação'}).click();
    const reviewsPanel=buyerPage.getByRole('heading',{name:'Avaliações',exact:true}).locator('..');
    await expect(reviewsPanel.getByText('Sem avaliações',{exact:true})).toBeVisible();

    const developerId=(await supabase.auth.admin.listUsers()).data.users.find(user=>user.email===developer)?.id;
    expect(developerId).toBeTruthy();
    const paid=await supabase.from('games').insert({
      developer_id:developerId,title:'Jogo pago '+run,slug:'jogo-pago-'+run,price:19.90,status:'published',
    }).select('id').single();
    expect(paid.error).toBeNull();
    await buyerPage.goto('/game/jogo-pago-'+run);
    await buyerPage.getByRole('link',{name:'Comprar',exact:true}).click();
    await expect(buyerPage).toHaveURL('/checkout/'+paid.data!.id);
    await expect(buyerPage.getByRole('status')).toContainText('Os pagamentos ainda não estão disponíveis.');
    await expect(buyerPage.getByText(/19,90/)).toBeVisible();
    await buyerPage.goto('/account/purchases');
    await expect(buyerPage.getByText('Nenhuma compra registrada.')).toBeVisible();
    await buyer.close();
    await adminContext.close();
  });
});
