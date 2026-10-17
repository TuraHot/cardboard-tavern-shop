import { VanguardNation } from '../types';

export interface NationConfig {
  name: VanguardNation;
  thaiName: string;
  badgeClass: string;
  pillColor: string;
  dotColor: string;
  glowColor: string;
  iconSymbol: string;
  abbName: string;
}

export const VANGUARD_NATIONS: NationConfig[] = [
  {
    name: 'Dragon Empire',
    thaiName: 'ดราก้อนเอมไพร์',
    badgeClass: 'bg-red-950/40 text-red-300 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.15)] ring-1 ring-red-500/20',
    pillColor: 'bg-red-500/10 text-red-300 border-red-500/30',
    dotColor: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]',
    glowColor: 'shadow-red-500/20',
    iconSymbol: '🐉',
    abbName: 'DE'
  },
  {
    name: 'Dark States',
    thaiName: 'ดาร์คสเตรทส์',
    badgeClass: 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30 shadow-[0_0_12px_rgba(129,140,248,0.15)] ring-1 ring-indigo-500/20',
    pillColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    dotColor: 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]',
    glowColor: 'shadow-indigo-500/20',
    iconSymbol: '🌑',
    abbName: 'DS'
  },
  {
    name: 'Brandt Gate',
    thaiName: 'บรันท์เกต',
    badgeClass: 'bg-cyan-950/40 text-cyan-200 border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.15)] ring-1 ring-cyan-500/20',
    pillColor: 'bg-cyan-500/10 text-cyan-200 border-cyan-500/30',
    dotColor: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]',
    glowColor: 'shadow-cyan-500/20',
    iconSymbol: '🛸',
    abbName: 'BG'
  },
  {
    name: 'Keter Sanctuary',
    thaiName: 'เคเทอร์แซงค์ทัวรี',
    badgeClass: 'bg-amber-950/40 text-amber-200 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/30',
    pillColor: 'bg-amber-500/10 text-amber-200 border-amber-500/40',
    dotColor: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
    glowColor: 'shadow-amber-500/20',
    iconSymbol: '⚔️',
    abbName: 'KS'
  },
  {
    name: 'Stoicheia',
    thaiName: 'สโตยเคีย',
    badgeClass: 'bg-emerald-950/40 text-emerald-200 border-emerald-500/30 shadow-[0_0_12px_rgba(52,211,153,0.15)] ring-1 ring-emerald-500/20',
    pillColor: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/30',
    dotColor: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
    glowColor: 'shadow-emerald-500/20',
    iconSymbol: '🌿',
    abbName: 'ST'
  },
  {
    name: 'Lyrical Monasterio',
    thaiName: 'ลิริคัลโมนาสเทริโอ้',
    badgeClass: 'bg-pink-950/40 text-pink-200 border-pink-500/30 shadow-[0_0_12px_rgba(244,114,182,0.15)] ring-1 ring-pink-500/20',
    pillColor: 'bg-pink-500/10 text-pink-200 border-pink-500/30',
    dotColor: 'bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.8)]',
    glowColor: 'shadow-pink-500/20',
    iconSymbol: '✨',
    abbName: 'LM'
  }
];

export function getNationConfig(nation: string): NationConfig {
  const found = VANGUARD_NATIONS.find(
    (n) => n.name.toLowerCase() === (nation || '').toLowerCase()
  );
  return (
    found || {
      name: 'Other',
      thaiName: nation || 'อื่นๆ',
      badgeClass: 'bg-slate-900/60 text-slate-300 border-slate-700/50 ring-1 ring-slate-600/20',
      pillColor: 'bg-slate-500/10 text-slate-300 border-slate-600/30',
      dotColor: 'bg-slate-400',
      glowColor: 'shadow-slate-500/20',
      iconSymbol: '🎴',
      abbName: ''
    }
  );
}
