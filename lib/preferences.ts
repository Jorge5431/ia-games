import { z } from 'zod';

export const preferenceSchema = z.object({
  theme:z.enum(['dark','light','system']).catch('dark'),
  language:z.enum(['pt-BR','en','es']).catch('pt-BR'),
  motion:z.enum(['full','reduced']).catch('full'),
  textSize:z.enum(['normal','large']).catch('normal'),
  contrast:z.enum(['normal','high']).catch('normal'),
  autoplay:z.boolean().catch(true),
  density:z.enum(['comfortable','compact']).catch('comfortable'),
});
export type Preferences = z.infer<typeof preferenceSchema>;
export const defaults:Preferences=preferenceSchema.parse({});
export const preferenceCookie='vornelix-preferences-v1';
export function parsePreferences(raw?:string):Preferences {
  try { return preferenceSchema.parse(JSON.parse(raw||'{}')); } catch { return defaults; }
}
