import { expect,it } from 'vitest';
import { defaults,parsePreferences } from '../lib/preferences';
it('restaura preferências quando o cookie está corrompido',()=>{
  expect(parsePreferences('invalid')).toEqual(defaults);
  expect(parsePreferences('null')).toEqual(defaults);
});
it('aceita preferências válidas e rejeita valores arbitrários por campo',()=>{
  expect(parsePreferences(JSON.stringify({theme:'light',motion:'reduced',autoplay:false,language:'en'}))).toMatchObject({theme:'light',motion:'reduced',autoplay:false,language:'en'});
  expect(parsePreferences(JSON.stringify({theme:'url(javascript:bad)',language:'xx',autoplay:'true'}))).toEqual(defaults);
});
