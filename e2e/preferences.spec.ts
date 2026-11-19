import {expect,test} from '@playwright/test';

test('preferências persistem após recarregar e idioma atualiza navegação',async({page})=>{
  await page.goto('/settings');
  await page.getByLabel('Tema',{exact:true}).selectOption('light');
  await page.getByLabel('Movimento',{exact:true}).selectOption('reduced');
  await page.getByLabel('Tamanho do texto').selectOption('large');
  await page.getByLabel('Contraste',{exact:true}).selectOption('high');
  await page.getByLabel('Trocar banners automaticamente').uncheck();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await expect(page.locator('html')).toHaveAttribute('data-motion','reduced');
  await expect(page.getByLabel('Trocar banners automaticamente')).not.toBeChecked();
  await page.getByLabel('Idioma da navegação').selectOption('en');
  await expect(page.getByRole('link',{name:'Store',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Reset preferences'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
});
test('confirmação não apresenta sucesso sem sessão válida',async({page})=>{
  await page.goto('/auth/confirmed?next=https://evil.example');
  await expect(page.getByRole('heading',{name:'Entre para continuar'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'E-mail confirmado!'})).toHaveCount(0);
  await expect(page.locator('main').getByRole('link',{name:'Entrar',exact:true})).toHaveAttribute('href','/login?next=%2Faccount');
});
test('efeitos acompanham scroll e ficam imóveis em movimento reduzido',async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
  const ring=page.locator('.immersive-art');
  const before=await ring.evaluate(el=>getComputedStyle(el).transform);
  await page.mouse.wheel(0,450);
  await expect.poll(()=>ring.evaluate(el=>getComputedStyle(el).transform)).not.toBe(before);
  await page.goto('/settings');
  await page.getByLabel('Movimento',{exact:true}).selectOption('reduced');
  await page.goto('/');
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
  const stationary=page.locator('.immersive-art');
  const isIdentity=()=>stationary.evaluate(el=>new DOMMatrixReadOnly(getComputedStyle(el).transform).isIdentity);
  await expect.poll(isIdentity).toBe(true);
  await page.mouse.wheel(0,450);
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(0);
  await page.waitForTimeout(300); // Allow scroll-linked animation frames to run.
  expect(await isIdentity()).toBe(true);
});
