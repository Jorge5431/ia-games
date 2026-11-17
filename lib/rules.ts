import { z } from 'zod';

export const categories = [
  ['acao','Ação'], ['aventura','Aventura'], ['rpg','RPG'], ['sobrevivencia','Sobrevivência'],
  ['terror','Terror'], ['estrategia','Estratégia'], ['simulacao','Simulação'], ['corrida','Corrida'],
  ['puzzle','Puzzle'], ['indie','Indie'], ['mundo-aberto','Mundo aberto'], ['multiplayer','Multiplayer'],
] as const;

export const platforms = ['Windows','macOS','Linux','Android','iOS','Web'] as const;
export const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const uuid = z.uuid();
export const email = z.email().max(254);
export const password = z.string().min(8).max(72).refine(value => new TextEncoder().encode(value).length <= 72);
export const slug = z.string().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const httpsUrl = z.string().refine(value => {
  try {
    const url = new URL(value);
    return value === value.trim() && url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}, 'Informe um endereço HTTPS válido.');

export const textField = (max: number) => z.string().trim().max(max);
export const gameStatuses = { draft:'Rascunho', pending:'Em análise', published:'Publicado', rejected:'Rejeitado' } as const;
export const flags = Object.freeze({ realPayments: false, executableUpload: false, realFileDistribution: false });

export function nextPath(value: unknown, fallback = '/account') {
  if (typeof value !== 'string' || !value.startsWith('/') || /[\\\x00-\x20]/.test(value)) return fallback;
  try {
    const target = new URL(value, 'https://vornelix.invalid');
    return target.origin === 'https://vornelix.invalid' ? target.pathname + target.search + target.hash : fallback;
  } catch {
    return fallback;
  }
}

export function purchaseState(published: boolean, owned: boolean, price: number) {
  if (!published) return 'unavailable';
  if (owned) return 'owned';
  return price === 0 ? 'free' : 'paid';
}

export type DownloadState = 'unavailable'|'acquire'|'pending'|'missing'|'disabled'|'authorize';

export function downloadState(published: boolean, owned: boolean, version?: 'pending' | 'approved' | 'revoked', enabled: boolean = flags.realFileDistribution): DownloadState {
  if (!published) return 'unavailable';
  if (!owned) return 'acquire';
  if (version === 'pending') return 'pending';
  if (version !== 'approved') return 'missing';
  return enabled ? 'authorize' : 'disabled';
}

export function calculateRatings(reviews: { rating: number }[]) {
  const distribution = [0, 0, 0, 0, 0];
  for (const { rating } of reviews) {
    if (Number.isInteger(rating) && rating >= 1 && rating <= 5) distribution[rating - 1]++;
  }
  const count = distribution.reduce((sum, quantity) => sum + quantity, 0);
  const average = count ? distribution.reduce((sum, quantity, index) => sum + quantity * (index + 1), 0) / count : null;
  return { distribution, average, count };
}
