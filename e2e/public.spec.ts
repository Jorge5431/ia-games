import { expect, test } from '@playwright/test';

const publicRoutes=[
  ['/','VORNELIX — Gaming Reimagined'],['/store','Loja'],['/discover','Descobrir jogos'],['/categories','Categorias'],
  ['/category/acao','Ação'],['/search','Pesquisar jogos'],['/about','Sobre a Vornelix'],['/support','Suporte'],
  ['/terms','Termos de uso'],['/privacy','Privacidade'],['/login','Entre na Vornelix'],['/register','Crie sua conta'],
  ['/forgot-password','Recupere sua senha'],
] as const;

test('rotas públicas, metadados e ausência de erros JavaScript',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  for(const [path,title] of publicRoutes) {
    const response=await page.goto(path);
    expect(response?.status(),path).toBe(200);
    const heading=page.getByRole('heading',{level:1});
    await expect(heading).toBeVisible();
    if(typeof title==='string') await expect(heading).toHaveText(title);
  }
  expect(errors).toEqual([]);
});

test('busca, filtros, limpeza e navegação à página de categoria',async({page})=>{
  await page.goto('/');
  await page.getByRole('searchbox').fill('sobrevivência');
  await page.getByRole('button',{name:'Pesquisar',exact:true}).click();
  await expect(page).toHaveURL(/\/search\?q=/);
  await page.getByRole('searchbox').fill('sobrevivência');
  await page.getByLabel('Gênero').selectOption('sobrevivencia');
  await page.getByLabel('Plataforma').selectOption('Windows');
  await page.getByRole('combobox',{name:'Preço',exact:true}).selectOption('free');
  await page.getByLabel('Nota mínima').selectOption('4');
  await page.getByLabel('Ordenar').selectOption('price-asc');
  await page.getByRole('button',{name:'Aplicar filtros'}).click();
  await expect(page).toHaveURL(/q=sobreviv%C3%AAncia.*genre=sobrevivencia.*price=free/);
  await page.getByRole('link',{name:'Limpar'}).click();
  await expect(page.getByRole('searchbox')).toHaveValue('');
  await page.getByRole('link',{name:'Categorias',exact:true}).click();
  await page.getByRole('link',{name:'Ação',exact:true}).click();
  await expect(page).toHaveURL('/category/acao');
});

test('rotas privadas encaminham para login com o retorno correto',async({page})=>{
  const protectedRoutes=['/account','/account/profile','/account/settings','/account/reviews','/account/purchases',
    '/library','/wishlist','/downloads','/developer/dashboard','/developer/games',
    '/developer/games/new','/developer/submissions','/developer/analytics','/admin','/admin/users','/admin/developers',
    '/admin/games','/admin/moderation','/admin/reports','/admin/settings','/reset-password',
    '/checkout/10000000-0000-4000-8000-000000000001',
    '/developer/games/10000000-0000-4000-8000-000000000001/edit','/developer/games/10000000-0000-4000-8000-000000000001/media',
  ];
  await page.goto('/developer/apply');
  await expect(page.getByRole('link',{name:'Entrar ou criar conta'})).toHaveAttribute('href','/login?next=%2Fdeveloper%2Fapply');
  for(const route of protectedRoutes){
    await page.goto(route);
    await expect(page).toHaveURL('/login?next='+encodeURIComponent(route));
  }
});

test('link de confirmação inválido e página 404',async({page})=>{
  await page.goto('/auth/callback');
  await expect(page.getByRole('heading',{name:'Entre para continuar'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'E-mail confirmado!'})).toHaveCount(0);
  await page.goto('/pagina-inexistente');
  await expect(page.getByRole('heading',{level:1})).toHaveText('Página não encontrada');
  await page.getByRole('link',{name:'Ir para a loja'}).click();
  await expect(page).toHaveURL('/store');
  await page.goto('/game/jogo-inexistente');
  await expect(page.getByRole('heading',{level:1})).toHaveText('Página não encontrada');
});

for(const [width,height] of [[360,800],[390,844],[768,1024],[1366,768],[1920,1080]]) {
  test('layout sem overflow em '+width+'×'+height,async({page})=>{
    await page.setViewportSize({width,height});
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const route of ['/','/store','/register','/categories']){
      await page.goto(route);
      const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:window.innerWidth}));
      expect(size.scroll,route).toBeLessThanOrEqual(size.viewport);
    }
  });
}

test('menu mobile, teclado e preferência por movimento reduzido',async({page,browser})=>{
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link',{name:'Pular para o conteúdo'})).toBeFocused();
  const touch=await mobile.newPage();
  await touch.goto('/');
  await touch.getByRole('button',{name:'Abrir menu'}).tap();
  const navigation=touch.getByRole('navigation',{name:'Menu de navegação'});
  await expect(navigation).toBeVisible();
  await navigation.getByRole('link').first().focus();
  await touch.keyboard.press('Escape');
  await expect(touch.getByRole('button',{name:'Abrir menu'})).toBeFocused();
  await expect(navigation).toBeHidden();
  await touch.getByRole('button',{name:'Abrir menu'}).tap();
  await navigation.getByRole('link',{name:'Descobrir'}).tap();
  await expect(touch).toHaveURL('/discover');
  await expect(navigation).toBeHidden();
  await touch.goto('/');
  await expect(touch.locator('.immersive-embers')).toHaveCount(0);
  expect(await touch.locator('.immersive-art').evaluate(el=>new DOMMatrixReadOnly(getComputedStyle(el).transform).isIdentity)).toBe(true);
  await mobile.close();
});

test('registra métricas de renderização na home institucional',async({page},testInfo)=>{
  await page.addInitScript(()=>{
    const metrics={lcpMs:0,layoutShift:0};
    Object.defineProperty(window,'__vornelixMetrics',{value:metrics});
    new PerformanceObserver(list=>{
      for(const entry of list.getEntries()) metrics.lcpMs=entry.startTime;
    }).observe({type:'largest-contentful-paint',buffered:true});
    new PerformanceObserver(list=>{
      for(const entry of list.getEntries() as (PerformanceEntry & {hadRecentInput:boolean;value:number})[]){
        if(!entry.hadRecentInput) metrics.layoutShift+=entry.value;
      }
    }).observe({type:'layout-shift',buffered:true});
  });
  await page.goto('/');
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
  type MetricsWindow=Window & typeof globalThis & {__vornelixMetrics:{lcpMs:number;layoutShift:number}};
  await expect.poll(()=>page.evaluate(()=>(window as MetricsWindow).__vornelixMetrics.lcpMs)).toBeGreaterThan(0);
  const metrics=await page.evaluate(()=>(window as MetricsWindow).__vornelixMetrics);
  await testInfo.attach('renderizacao-home',{body:JSON.stringify(metrics),contentType:'application/json'});
  expect(metrics.layoutShift).toBeLessThan(.1);
});
