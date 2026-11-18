import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { calculateRatings, downloadState, gameVideoUrl, httpsUrl, nextPath, password, purchaseState } from '../lib/rules';

describe('redirecionamentos',()=>{
  it('mantém caminhos internos e seus parâmetros',()=>{
    expect(nextPath('/downloads?game=abc')).toBe('/downloads?game=abc');
    expect(nextPath('/loja#novos')).toBe('/loja#novos');
  });
  it.each(['//evil.example','/\\evil.example','https://evil.example','\n/store','/\t/evil.example'])('bloqueia destino externo %s',path=>{
    expect(nextPath(path)).toBe('/account');
  });
});

describe('entitlements',()=>{
  it('classifica aquisições',()=>{
    expect(purchaseState(false,false,0)).toBe('unavailable');
    expect(purchaseState(true,true,10)).toBe('owned');
    expect(purchaseState(true,false,0)).toBe('free');
    expect(purchaseState(true,false,10)).toBe('paid');
  });
  it('aplica todos os controles antes de autorizar download',()=>{
    expect(downloadState(false,true,'approved',true)).toBe('unavailable');
    expect(downloadState(true,false,'approved',true)).toBe('acquire');
    expect(downloadState(true,true,'pending',true)).toBe('pending');
    expect(downloadState(true,true,'revoked',true)).toBe('missing');
    expect(downloadState(true,true)).toBe('missing');
    expect(downloadState(true,true,'approved')).toBe('disabled');
    expect(downloadState(true,true,'approved',true)).toBe('authorize');
  });
});

it('calcula médias e distribuições reais de 1 a 5',()=>{
  expect(calculateRatings([])).toEqual({distribution:[0,0,0,0,0],count:0,average:null});
  expect(calculateRatings([1,3,5,5,6,1.5].map(rating=>({rating})))).toEqual({distribution:[1,0,1,0,2],count:4,average:3.5});
});

it('limita o comprimento em bytes para senhas Unicode',()=>{
  expect(password.safeParse('palavraf0rte').success).toBe(true);
  expect(password.safeParse('🔑'.repeat(19)).success).toBe(false);
});

it('aceita portfólio opcional e rejeita URLs inválidas sem lançar exceção',()=>{
  const portfolio=z.union([httpsUrl.max(500),z.literal('')]);
  expect(portfolio.safeParse('').success).toBe(true);
  expect(portfolio.safeParse('https://example.com/portfolio').success).toBe(true);
  expect(portfolio.safeParse('invalid-url').success).toBe(false);
  expect(portfolio.safeParse('https://person@example.com').success).toBe(false);
  expect(portfolio.safeParse('http://example.com').success).toBe(false);
});

describe('mídia de gameplay',()=>{
  it.each([
    'https://cdn.example.com/gameplay.mp4',
    'https://cdn.example.com/gameplay.webm?token=temporary',
    'https://www.youtube.com/watch?v=abc123',
    'https://www.youtube.com/watch?v=abc123&feature=shared',
    'https://youtu.be/abc123',
    'https://vimeo.com/1234567',
  ])('aceita vídeo HTTPS suportado: %s',url=>{
    expect(gameVideoUrl.safeParse(url).success).toBe(true);
  });
  it.each([
    'http://cdn.example.com/gameplay.mp4',
    'https://cdn.example.com/gameplay.mov',
    'https://person@example.com/gameplay.mp4',
    'https://youtube.com/watch?v=x',
    'https://youtube.com/watch?feature=shared&v=abc123',
  ])('rejeita mídia incompatível ou insegura: %s',url=>{
    expect(gameVideoUrl.safeParse(url).success).toBe(false);
  });
});
