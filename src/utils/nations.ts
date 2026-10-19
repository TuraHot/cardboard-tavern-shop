import { VanguardNation } from '../types';
import { supabase } from '../lib/supabase';

export interface NationConfig {
  name: VanguardNation;
  thaiName: string;
  badgeClass: string;
  pillColor: string;
  dotColor: string;
  glowColor: string;
  iconSymbol: string;
  abbName: string;
  iconUrl?: string;
  colorCode: string;
}

export function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16) || 0;
    const g = parseInt(cleanHex[1] + cleanHex[1], 16) || 0;
    const b = parseInt(cleanHex[2] + cleanHex[2], 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getNationIconUrl(abbName: string): string {
  if (!abbName) return '';
  const { data } = supabase.storage.from('nation').getPublicUrl(`Icon_${abbName}.webp`);
  return data?.publicUrl || '';
}

export const VANGUARD_NATIONS: NationConfig[] = [
  {
    name: 'Dragon Empire',
    thaiName: 'ดราก้อนเอมไพร์',
    colorCode: '#EF4444',
    badgeClass: 'bg-red-950/40 text-red-300 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.15)] ring-1 ring-red-500/20',
    pillColor: 'bg-red-500/10 text-red-300 border-red-500/30',
    dotColor: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]',
    glowColor: 'shadow-red-500/20',
    iconSymbol: '🐉',
    abbName: 'DE',
    iconUrl: getNationIconUrl('DE'),
  },
  {
    name: 'Dark States',
    thaiName: 'ดาร์คสเตรทส์',
    colorCode: '#3B82F6',
    badgeClass: 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30 shadow-[0_0_12px_rgba(129,140,248,0.15)] ring-1 ring-indigo-500/20',
    pillColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    dotColor: 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]',
    glowColor: 'shadow-indigo-500/20',
    iconSymbol: '🌑',
    abbName: 'DS',
    iconUrl: getNationIconUrl('DS'),
  },
  {
    name: 'Brandt Gate',
    thaiName: 'บรันท์เกต',
    colorCode: '#9CA3AF',
    badgeClass: 'bg-cyan-950/40 text-cyan-200 border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.15)] ring-1 ring-cyan-500/20',
    pillColor: 'bg-cyan-500/10 text-cyan-200 border-cyan-500/30',
    dotColor: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]',
    glowColor: 'shadow-cyan-500/20',
    iconSymbol: '🛸',
    abbName: 'BG',
    iconUrl: getNationIconUrl('BG'),
  },
  {
    name: 'Keter Sanctuary',
    thaiName: 'เคเทอร์แซงค์ทัวรี',
    colorCode: '#EAB308',
    badgeClass: 'bg-amber-950/40 text-amber-200 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/30',
    pillColor: 'bg-amber-500/10 text-amber-200 border-amber-500/40',
    dotColor: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
    glowColor: 'shadow-amber-500/20',
    iconSymbol: '⚔️',
    abbName: 'KS',
    iconUrl: getNationIconUrl('KS'),
  },
  {
    name: 'Stoicheia',
    thaiName: 'สโตยเคีย',
    colorCode: '#10B981',
    badgeClass: 'bg-emerald-950/40 text-emerald-200 border-emerald-500/30 shadow-[0_0_12px_rgba(52,211,153,0.15)] ring-1 ring-emerald-500/20',
    pillColor: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/30',
    dotColor: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
    glowColor: 'shadow-emerald-500/20',
    iconSymbol: '🌿',
    abbName: 'ST',
    iconUrl: getNationIconUrl('ST'),
  },
  {
    name: 'Lyrical Monasterio',
    thaiName: 'ลิริคัลโมนาสเทริโอ้',
    colorCode: '#EC4899',
    badgeClass: 'bg-pink-950/40 text-pink-200 border-pink-500/30 shadow-[0_0_12px_rgba(244,114,182,0.15)] ring-1 ring-pink-500/20',
    pillColor: 'bg-pink-500/10 text-pink-200 border-pink-500/30',
    dotColor: 'bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.8)]',
    glowColor: 'shadow-pink-500/20',
    iconSymbol: '✨',
    abbName: 'LM',
    iconUrl: getNationIconUrl('LM'),
  },
  {
    name: 'Super Sentai',
    thaiName: 'ซุปเปอร์เซนไต',
    colorCode: '#541111',
    badgeClass: 'bg-[#541111]/40 text-red-200 border-[#541111] shadow-[0_0_12px_rgba(84,17,17,0.3)] ring-1 ring-[#541111]/50',
    pillColor: 'bg-[#541111]/25 text-red-200 border-[#541111]/40',
    dotColor: 'bg-[#801b1b] shadow-[0_0_8px_rgba(84,17,17,0.9)]',
    glowColor: 'shadow-[#541111]/25',
    iconSymbol: '🦸',
    abbName: 'SS',
    iconUrl: getNationIconUrl('SS'),
  }
];

// Runtime cache for nations from Supabase table `nations`
const nationDbMap = new Map<
  string,
  { color_code?: string; logo_url?: string; name_th?: string; name_en?: string }
>();

export function syncNationsFromDb(
  rows: Array<{ name_en: string; color_code?: string; logo_url?: string | null; name_th?: string }>
) {
  if (!rows || !Array.isArray(rows)) return;
  for (const r of rows) {
    if (r.name_en) {
      nationDbMap.set(r.name_en.toLowerCase().trim(), {
        color_code: r.color_code,
        logo_url: r.logo_url || undefined,
        name_th: r.name_th,
        name_en: r.name_en,
      });
    }
  }
}

export function getNationConfig(nation: string): NationConfig {
  const normalized = (nation || '').toLowerCase().trim();
  const dbEntry = nationDbMap.get(normalized);

  const found = VANGUARD_NATIONS.find(
    (n) =>
      n.name.toLowerCase() === normalized ||
      n.thaiName.toLowerCase() === normalized ||
      (n.abbName && n.abbName.toLowerCase() === normalized) ||
      (n.name === 'Super Sentai' && (normalized === 'ซุปเปร์เซนไต' || normalized === 'ซูปเปอร์เซนไต' || normalized === 'ซูเปอร์เซนไต'))
  );

  if (found) {
    const finalColorCode = dbEntry?.color_code || found.colorCode;
    const finalLogoUrl = dbEntry?.logo_url || found.iconUrl || getNationIconUrl(found.abbName);
    return {
      ...found,
      colorCode: finalColorCode,
      iconUrl: finalLogoUrl,
    };
  }

  // If found in DB cache even if not in static VANGUARD_NATIONS
  if (dbEntry) {
    const color = dbEntry.color_code || '#64748B';
    return {
      name: (dbEntry.name_en as VanguardNation) || (nation as VanguardNation),
      thaiName: dbEntry.name_th || nation || 'อื่นๆ',
      badgeClass: 'text-slate-200 border-slate-700/50 ring-1 ring-slate-600/20',
      pillColor: 'text-slate-300 border-slate-600/30',
      dotColor: 'bg-slate-400',
      glowColor: 'shadow-slate-500/20',
      iconSymbol: '🎴',
      abbName: '',
      iconUrl: dbEntry.logo_url || '',
      colorCode: color,
    };
  }

  return {
    name: 'Other',
    thaiName: nation || 'อื่นๆ',
    badgeClass: 'bg-slate-900/60 text-slate-300 border-slate-700/50 ring-1 ring-slate-600/20',
    pillColor: 'bg-slate-500/10 text-slate-300 border-slate-600/30',
    dotColor: 'bg-slate-400',
    glowColor: 'shadow-slate-500/20',
    iconSymbol: '🎴',
    abbName: '',
    iconUrl: '',
    colorCode: '#64748B',
  };
}
