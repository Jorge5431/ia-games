import { describe, expect, it } from 'vitest';
import { calculateRatings, downloadState, nextPath, password, purchaseState } from '../lib/rules';

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
