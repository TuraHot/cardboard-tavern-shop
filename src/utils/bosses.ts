import { supabase } from '../lib/supabase';
import { BossRow } from '../types';

export const INITIAL_BOSS_TRANSLATIONS: Record<string, string> = {
  "nirvana": "เนอร์วานา",
  "eugene": "ยูจีน",
  "dragonic overlord": "ดราโกนิค โอเวอร์ลอร์ด",
  "overlord the end": "โอเวอร์ลอร์ด ดิเอน",
  "mahar nirvana": "มหาเนอร์วานา",
  "tamayura": "ทามายูระ",
  "shojodoji": "โชโจวโดจิ",
  "gandiva": "คาณฑีวะ",
  "orfist regis": "ออฟิส เรกิส",
  "gravidia": "กราวิเดีย",
  "seraph purelight": "เซราฟ เพียวไลท์",
  "eva": "เอวา",
  "b-hero": "บี-ฮีโร่",
  "ceo westra": "CEO เวลส์ทรา",
  "arkhite": "อัลดิเต้",
  "messiah": "เมสไซยาห์",
  "baromagnes": "บาโรแมกเนส",
  "greedon": "กรีดอน",
  "phantom blaster dragon": "แฟนธอม บลาสเตอร์ ดราก้อน",
  "phantom blaster overlord": "แฟนธอม บลาสเตอร์ โอเวอร์ลอร์ด",
  "majesty lord blaster": "มาเจสตี้ ลอร์ด บลาสเตอร์",
  "thegrea": "เธเกรีย",
  "youthberk": "ยูธเบิร์ก",
  "minerva": "มิเนอร์วา",
  "gramgrace": "กรัมเกรซ",
  "hexaorb aquamarine": "เฮกซาออร์บ อความารีน",
  "bastion": "บาสทีออน",
  "bastion prime": "บาสทีออน ไพรม์",
  "bastion accord": "บาสทีออน แอคคอร์ด",
  "clarissa": "คลาริซซา",
  "kairi": "ไคริ",
  "luticia": "ลูทีเซีย",
  "lilfa": "ลิลฟา",
  "zorga": "ซอก้า",
  "drajeweled": "ดราจีเวลด์",
  "maynard": "เมนาร์ด",
  "bavsargra": "ภวสักการะ",
  "avantgarda": "อาวากัลด้า",
  "irving": "อาร์วิงก์",
  "seraph snow": "เซรัส ไวท์",
  "unrivaled brace": "อัลไรวัล บรูซ",
  "kheios": "คีออส",
  "orfist masques": "ออฟิส มาสก์ส",
  "transrotor": "ทรานซ์โรเตอร์",
  "luquier": "ลูเคียร์",
  "astroea unica": "แอสโทรอา ยูนิก้า",
  "viamance brace": "เวียร์แมนซ์ บรูซ",
  "drajeweled masques": "ดราจีเวลด์ แมสก์ส",
  "violence brace": "ไวโอเลนซ์ บรูซ",
  "schuldfisher dragon": "ชิลด์ฟิชเชอร์ ดราก้อน",
  "iron anchor resentment dragon": "มังกรสมอเหล็กแห้งความแค้น",
  "hexaorb sorceress": "เฮกซาออร์บ ซอเซอร์เรส",
  "solrairon": "โซเรอารอน",
  "alestiel": "อาเรสทีเอล",
  "loronerol": "โรโรเนรอล",
  "vilista": "วีริสตา",
  "feltyroza": "เฟลทีโรซา",
  "herminia": "เอลมิเนีย",
  "fortia": "ฟอลเทีย",
  "haseritt": "ฮาเซริท",
  "mediell": "เมดีเอล",
  "kyouka": "เคียวกะ",
  "michu": "มิจู",
  "petrarca": "เพทรัลก้า",
  "baphormedes": "บาโฟเมเดส",
  "eredogrema": "เอเรดเกรม่า",
  "astroa bico masques": "แอสโทรอา โบโค แมสก์ส",
  "magnolia": "แมกโนเลีย",
  "magnolia elder": "แมกโนเลีย เอลเดอร์",
  "lianorn": "เลียร์นอร์น",
  "granfia": "แกรนเฟีย",
  "shinkenger": "ชินเคนเจอร์",
  "donbrothers": "ดงบราเธอร์ส",
  "gokaiger": "โกไคเจอร์",
  "gaoranger": "กาโอเรนเจอร์",
  "nirvana jheva": "เนอร์วานา ชีวา",
  "vermillion": "เวอร์มิลเลียน",
  "silhouette": "ซีลูเอท",
  "lianorn masques": "เลียร์นอร์น แมสก์ส",
  "gravidia masques": "กราวิเดีย มาสก์ส",
  "greedon masques": "กรีดอน แมสก์ส",
  "elehilecity": "เรซิเด้",
  "ominogruzio masques": "อามานะกรูจิโอ แมสก์ส",
  "ominogruzio": "อามานะกรูจิโอ",
  "flagburg dragon": "แฟลกเบิร์ก ดราก้อน",
  "decay hollow dragom": "มังกรกลวงแห่งการเสื่อมสลาย",
  "rorowa": "โรโรวา",
  "maelstorm": "เมลสตอร์ม",
  "magnolia masques": "แมกโนเลีย แมสก์ส",
  "zorga masques": "ซอก้า แมสก์ส",
  "mythiarq luluthzul": "มิสทิอาร์ค ลูลูทเอล",
  "blond ezel": "บรอนด์ เอเซล",
  "arlette": "อาเลทเต้",
  "chronojet": "โครโนเจ็ต",
  "zorga grave": "ซอร์ก้า เกรฟ",
  "favrneel": "ฟาฟร์นีล",
  "divine sister": "ดีไวน์ ซิสเตอร์",
  "claudine": "คราวเดีย",
  "spinomarquis": "สไปโนมาควิส",
  "leuhan": "ลูอัน",
  "megalonotsuchi": "เมกะโรโนะสึจิ"
};

const bossMap = new Map<string, string>();

// Initialize with pre-seeded translations
for (const [en, th] of Object.entries(INITIAL_BOSS_TRANSLATIONS)) {
  bossMap.set(en.toLowerCase().trim(), th);
}

export function syncBossesFromDb(rows: Array<Pick<BossRow, 'name_en' | 'name_th'>>) {
  if (!rows || !Array.isArray(rows)) return;
  for (const r of rows) {
    if (r.name_en && r.name_th) {
      bossMap.set(r.name_en.toLowerCase().trim(), r.name_th.trim());
    }
  }
}

let isAutoFetching = false;
export async function ensureBossesLoaded() {
  if (isAutoFetching) return;
  isAutoFetching = true;
  try {
    const { data } = await supabase.from('bosses').select('name_en, name_th');
    if (data) {
      syncBossesFromDb(data);
    }
  } catch (err) {
    console.warn('Failed to fetch bosses:', err);
  }
}

// Auto load bosses on startup
ensureBossesLoaded();

export function getBossThaiName(deckBoss?: string | null): string {
  if (!deckBoss) return '';
  const trimmed = deckBoss.trim();
  const lower = trimmed.toLowerCase();
  
  // If found in map, return Thai name
  const matched = bossMap.get(lower);
  if (matched) return matched;

  // If already contains Thai characters, return as is
  if (/[\u0E00-\u0E7F]/.test(trimmed)) {
    return trimmed;
  }

  return trimmed;
}
