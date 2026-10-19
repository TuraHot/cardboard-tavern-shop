import { Tournament, Player, Match, PlayerStanding } from '../types';
import { formatRate } from './tiebreaker';
import { getNationConfig } from './nations';
import { getBossThaiName } from './bosses';

interface ExportPairingsOptions {
  tournament: Tournament;
  roundNumber: number;
  matches: Match[];
  players: Player[];
}

interface ExportStandingsOptions {
  tournament: Tournament;
  standings: PlayerStanding[];
}

function getBaseStyles(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;800&family=Inter:wght@400;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Prompt', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 20px 24px;
      font-size: 13px;
      line-height: 1.4;
      -webkit-font-smoothing: antialiased;
    }

    @page {
      size: A4 portrait;
      margin: 10mm 10mm 12mm 10mm;
    }

    @media print {
      body {
        padding: 0;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print {
        display: none !important;
      }
      tr {
        page-break-inside: avoid;
      }
    }

    .toolbar {
      position: sticky;
      top: 0;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 18px;
      margin: -20px -24px 20px -24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 100;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }

    .btn-primary {
      background: #f59e0b;
      color: #000;
    }
    .btn-primary:hover {
      background: #d97706;
    }

    .btn-secondary {
      background: rgba(255,255,255,0.1);
      color: #fff;
    }
    .btn-secondary:hover {
      background: rgba(255,255,255,0.2);
    }

    /* Header */
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .brand {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.5px;
      background: #0f172a;
      color: #f59e0b;
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 6px;
      text-transform: uppercase;
    }

    .tournament-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
      margin-bottom: 4px;
    }

    .subtitle {
      font-size: 14px;
      font-weight: 600;
      color: #d97706;
    }

    .meta-box {
      text-align: right;
      font-size: 11px;
      color: #475569;
      line-height: 1.6;
    }

    .meta-box strong {
      color: #0f172a;
    }

    /* Table Styles */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 12px;
    }

    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    th.text-center, td.text-center {
      text-align: center;
    }

    th.text-right, td.text-right {
      text-align: right;
    }

    td {
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
      vertical-align: middle;
    }

    tr:nth-child(even) {
      background: #f8fafc;
    }

    .table-num {
      font-family: 'Inter', monospace;
      font-weight: 800;
      font-size: 14px;
      color: #0f172a;
    }

    .player-name {
      font-weight: 700;
      font-size: 13px;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .lucky-pill {
      display: inline-block;
      font-size: 10px;
      font-family: 'Inter', monospace;
      font-weight: 700;
      color: #047857;
      background: #d1fae5;
      padding: 1px 6px;
      border-radius: 4px;
      border: 1px solid #a7f3d0;
    }

    .deck-info {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }

    .vs-badge {
      font-weight: 800;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
      font-family: 'Inter', sans-serif;
    }

    .bye-badge {
      display: inline-block;
      font-weight: 700;
      font-size: 11px;
      color: #b45309;
      background: #fef3c7;
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid #fde68a;
    }

    .score-box {
      border: 1.5px dashed #94a3b8;
      border-radius: 6px;
      padding: 6px 12px;
      text-align: center;
      font-family: 'Inter', monospace;
      font-weight: 700;
      font-size: 12px;
      color: #475569;
      background: #ffffff;
      min-width: 80px;
      display: inline-block;
    }

    .winner-badge {
      display: inline-block;
      font-weight: 700;
      font-size: 11px;
      color: #15803d;
      background: #dcfce7;
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid #86efac;
    }

    .sign-line {
      font-size: 10px;
      color: #94a3b8;
      line-height: 1.6;
    }

    /* Standings Badges */
    .rank-1 {
      background: #fef9c3 !important;
      font-weight: 800;
    }
    .rank-2 {
      background: #f1f5f9 !important;
      font-weight: 800;
    }
    .rank-3 {
      background: #ffedd5 !important;
      font-weight: 800;
    }

    .rank-cell {
      font-weight: 800;
      font-size: 13px;
      text-align: center;
      color: #0f172a;
    }

    .dropped-text {
      color: #dc2626;
      font-size: 10px;
      font-weight: 700;
      margin-left: 4px;
    }

    /* Footer */
    .footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #64748b;
    }
  `;
}

function openPrintWindow(title: string, htmlContent: string) {
  // Create hidden iframe for direct print
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    // Fallback: open in new window
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.title = title;
      newWindow.document.close();
      newWindow.focus();
      setTimeout(() => newWindow.print(), 500);
    }
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.title = title;
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  }, 600);
}

export function exportPairingsPdf({
  tournament,
  roundNumber,
  matches,
  players,
}: ExportPairingsOptions) {
  const playerMap = new Map<string, Player>();
  for (const p of players) {
    playerMap.set(p.id, p);
  }

  const sortedMatches = [...matches]
    .filter((m) => m.round_number === roundNumber)
    .sort((a, b) => a.table_number - b.table_number);

  const nowStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const rowsHtml = sortedMatches
    .map((m) => {
      const p1 = playerMap.get(m.player1_id);
      const p2 = m.player2_id ? playerMap.get(m.player2_id) : null;
      const isBye = m.is_bye || m.is_Bye || !p2;

      return `
        <tr>
          <td class="text-center table-num">${m.table_number}</td>
          <td>
            <span class="player-name">${p1?.name ?? 'ไม่พบข้อมูล'}</span>
          </td>
          <td class="text-center vs-badge">VS</td>
          <td>
            ${
              isBye
                ? '<span class="bye-badge">ชนะบาย (BYE)</span>'
                : `<span class="player-name">${p2?.name ?? 'ไม่พบข้อมูล'}</span>`
            }
          </td>
        </tr>
      `;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>ตารางคู่แข่งขันรอบที่ ${roundNumber} - ${tournament.name}</title>
      <style>${getBaseStyles()}</style>
    </head>
    <body>
      <div class="toolbar no-print">
        <span style="font-weight:700; font-size:14px;">📄 ตัวอย่างก่อนพิมพ์ / บันทึก PDF (Pairings Round ${roundNumber})</span>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-primary" onclick="window.print()">🖨️ บันทึกเป็น PDF / พิมพ์</button>
          <button class="btn btn-secondary" onclick="window.close()">ปิดหน้าต่างนี้</button>
        </div>
      </div>

      <div class="header">
        <div>
          <div class="brand">Cardboard Tavern TCG</div>
          <h1 class="tournament-title">${tournament.name}</h1>
          <div class="subtitle">⚔️ ตารางจับคู่แข่งขัน — รอบที่ ${roundNumber}</div>
        </div>
        <div class="meta-box">
          <div>รูปแบบ: <strong>${tournament.format}</strong></div>
          <div>คู่แข่งขันทั้งหมด: <strong>${sortedMatches.length} คู่</strong></div>
          <div>วันที่พิมพ์: <strong>${nowStr}</strong></div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 70px;">โต๊ะ</th>
            <th style="width: 44%;">ผู้เล่น 1</th>
            <th class="text-center" style="width: 50px;">VS</th>
            <th style="width: 44%;">ผู้เล่น 2</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="4" class="text-center" style="padding: 24px; color:#94a3b8;">ไม่พบคู่แข่งขันในรอบนี้</td></tr>'}
        </tbody>
      </table>

      <div class="footer">
        <span>ระบบจัดการแข่งขัน Cardboard Tavern Shop • Cardfight!! Vanguard Tournament Manager</span>
        <span>หน้า 1 / 1</span>
      </div>
    </body>
    </html>
  `;

  openPrintWindow(`Pairings_Round_${roundNumber}_${tournament.name}`, htmlContent);
}

export function exportStandingsPdf({
  tournament,
  standings,
}: ExportStandingsOptions) {
  const nowStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const rowsHtml = standings
    .map((s) => {
      const p = s.player;
      const isDropped = p.is_dropped;
      const rank = s.rank;

      const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
      const medalStr = rank === 1 ? '🥇 ' : rank === 2 ? '🥈 ' : rank === 3 ? '🥉 ' : '';

      const nationCfg = getNationConfig(p.nation);
      const bossThai = p.deck_boss ? getBossThaiName(p.deck_boss) : '';
      const deckStr = [
        nationCfg?.name ? `${nationCfg.name} (${nationCfg.thaiName})` : '',
        bossThai ? bossThai : p.deck_boss || '',
      ]
        .filter(Boolean)
        .join(' • ') || '-';

      return `
        <tr class="${rankClass}">
          <td class="text-center rank-cell">${medalStr}${rank}</td>
          <td>
            <span class="player-name">
              ${p.name}
              ${isDropped ? '<span class="dropped-text">[ดรอป]</span>' : ''}
            </span>
          </td>
          <td style="color:#475569; font-size:11px;">${deckStr}</td>
          <td class="text-center font-bold" style="font-size:13px; font-family:'Inter', monospace; color:#0f172a;">${s.points}</td>
          <td class="text-center" style="font-family:'Inter', monospace;">${s.wins}-${s.losses}</td>
          <td class="text-center" style="font-family:'Inter', monospace; color:#475569;">${formatRate(s.omw)}</td>
          <td class="text-center" style="font-family:'Inter', monospace; color:#64748b;">${formatRate(s.oomw)}</td>
        </tr>
      `;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>ตารางคะแนน - ${tournament.name}</title>
      <style>${getBaseStyles()}</style>
    </head>
    <body>
      <div class="toolbar no-print">
        <span style="font-weight:700; font-size:14px;">📄 ตัวอย่างก่อนพิมพ์ / บันทึก PDF (Standings Leaderboard)</span>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-primary" onclick="window.print()">🖨️ บันทึกเป็น PDF / พิมพ์</button>
          <button class="btn btn-secondary" onclick="window.close()">ปิดหน้าต่างนี้</button>
        </div>
      </div>

      <div class="header">
        <div>
          <div class="brand">Cardboard Tavern TCG</div>
          <h1 class="tournament-title">${tournament.name}</h1>
          <div class="subtitle">🏆 ตารางคะแนนและอันดับการแข่งขัน (Standings)</div>
        </div>
        <div class="meta-box">
          <div>รูปแบบ: <strong>${tournament.format}</strong></div>
          <div>รอบปัจจุบัน: <strong>รอบที่ ${tournament.current_round} / ${tournament.max_rounds}</strong></div>
          <div>ผู้เล่นทั้งหมด: <strong>${standings.length} คน</strong></div>
          <div>วันที่พิมพ์: <strong>${nowStr}</strong></div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 60px;">อันดับ</th>
            <th style="width: 28%;">ชื่อผู้เล่น</th>
            <th style="width: 32%;">ประเทศ / แวนการ์ดหลัก</th>
            <th class="text-center" style="width: 60px;">แต้ม</th>
            <th class="text-center" style="width: 70px;">ชนะ-แพ้</th>
            <th class="text-center" style="width: 70px;" title="Opponents' Match Win Rate">OMW</th>
            <th class="text-center" style="width: 70px;" title="Opponents' Opponents' Match Win Rate">OOMW</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="7" class="text-center" style="padding: 24px; color:#94a3b8;">ยังไม่มีข้อมูลคะแนน</td></tr>'}
        </tbody>
      </table>

      <div class="footer">
        <span>ระบบจัดการแข่งขัน Cardboard Tavern Shop • Tiebreaker: Match Points > OMW% > OOMW%</span>
        <span>หน้า 1 / 1</span>
      </div>
    </body>
    </html>
  `;

  openPrintWindow(`Standings_${tournament.name}`, htmlContent);
}
