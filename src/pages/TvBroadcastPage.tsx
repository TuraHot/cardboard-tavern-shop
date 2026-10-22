import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Tournament, Player, Match } from '../types';
import { calculateStandings } from '../utils/tiebreaker';
import { CountdownTimer } from '../components/CountdownTimer';
import { StandingsTable } from '../components/StandingsTable';
import { PairingsList } from '../components/PairingsList';
import { QRCodeSVG } from 'qrcode.react';
import {
  Maximize,
  Minimize,
  Swords,
  Trophy,
  QrCode,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

export const TvBroadcastPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDisplayTab, setActiveDisplayTab] = useState<'pairings' | 'standings'>('pairings');
  const [autoScroll, setAutoScroll] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    if (!id) return;
    try {
      const { data: tData, error: tErr } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single();
      if (tErr) throw tErr;
      setTournament(tData);

      if (tData.status === 'completed') {
        setActiveDisplayTab('standings');
      }

      const { data: pData, error: pErr } = await supabase
        .from('players')
        .select('*')
        .eq('tournament_id', id)
        .order('lucky_draw_number', { ascending: true });
      if (pErr) throw pErr;
      setPlayers(pData || []);

      const { data: mData, error: mErr } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', id)
        .order('table_number', { ascending: true });
      if (mErr) throw mErr;
      setMatches(mData || []);
    } catch (err) {
      console.error('Failed to load TV broadcast data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`tv:${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${id}` },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `tournament_id=eq.${id}` },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${id}` },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    if (!autoScroll) return;

    let scrollDirection = 1;
    const interval = setInterval(() => {
      const el = scrollContainerRef.current;
      if (!el) return;

      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
        scrollDirection = -1;
      } else if (el.scrollTop <= 5) {
        scrollDirection = 1;
      }

      el.scrollTop += scrollDirection * 1;
    }, 50);

    return () => clearInterval(interval);
  }, [autoScroll]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070b] flex items-center justify-center text-amber-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-sm font-semibold text-gray-400">กำลังเชื่อมต่อสัญญาณถ่ายทอดสด 1080p...</span>
        </div>
      </div>
    );
  }

  if (!tournament) return null;

  const currentRoundMatches = matches.filter(
    (m) => m.round_number === tournament.current_round
  );
  const isCurrentRoundFullyCompleted =
    tournament.current_round > 0 &&
    currentRoundMatches.length > 0 &&
    currentRoundMatches.every((m) => m.status === 'completed');

  const matchesForStandings =
    tournament.status === 'completed' || isCurrentRoundFullyCompleted
      ? matches.filter((m) => m.round_number <= tournament.current_round)
      : matches.filter((m) => m.round_number < tournament.current_round);

  const standings = calculateStandings(players, matchesForStandings);
  const playerMobileUrl = `${window.location.origin}/tournament/${tournament.id}`;

  return (
    <div className="h-screen w-screen bg-[#05070b] text-gray-100 flex flex-col overflow-hidden select-none font-sans">
      {/* Top TV Championship Bar */}
      <div className="h-16 px-6 bg-[#080d16]/95 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link
            to={`/admin/tournament/${tournament.id}`}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors border border-white/[0.06]"
            title="กลับสู่ Admin"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/40 font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                <span>LIVE STREAM</span>
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono font-semibold">
                {tournament.format}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-white leading-tight">
              {tournament.name}
            </h1>
          </div>
        </div>

        {/* Display Controls */}
        <div className="flex items-center gap-2.5">
          <div className="flex bg-black/40 rounded-xl p-1 border border-white/[0.06]">
            <button
              onClick={() => setActiveDisplayTab('pairings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeDisplayTab === 'pairings'
                  ? 'bg-amber-500 text-gray-950 font-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>ตารางโต๊ะ (Pairings)</span>
            </button>

            <button
              onClick={() => setActiveDisplayTab('standings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeDisplayTab === 'standings'
                  ? 'bg-amber-500 text-gray-950 font-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>ตารางคะแนน (Standings)</span>
            </button>
          </div>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              autoScroll
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30'
                : 'bg-white/[0.04] text-gray-400 border-white/[0.06]'
            }`}
          >
            {autoScroll ? '⚡ Auto-Scroll' : 'Auto-Scroll: ปิด'}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white transition-colors border border-white/[0.06]"
            title="จอเต็ม (Fullscreen)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Split-Screen 16:9 Broadcast Layout */}
      <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* Left Side: Giant Timer + QR Code (4 of 12 columns) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 justify-between overflow-y-auto">
          {/* Giant Chronometer */}
          <div className="flex-1 flex flex-col justify-center">
            <CountdownTimer
              timerEndsAt={tournament.timer_ends_at}
              timerPausedRemainingSeconds={tournament.timer_paused_remaining_seconds}
              roundDurationMinutes={tournament.round_duration_minutes}
              size="tv"
            />
          </div>

          {/* QR Code Card Frame */}
          <div className="p-6 rounded-3xl bg-[#0c121e]/90 border border-white/[0.08] shadow-2xl flex flex-col items-center text-center tcg-card sleeve-frame">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
              <QrCode className="w-4 h-4" />
              <span>สแกนดูโต๊ะและผลการแข่งขันบนมือถือ</span>
            </div>

            <div className="p-3 bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] my-2 border border-white/20">
              <QRCodeSVG
                value={playerMobileUrl}
                size={160}
                level="M"
                includeMargin={false}
              />
            </div>

            <span className="text-[11px] text-gray-400 font-mono mt-2 break-all max-w-[260px] line-clamp-1">
              {playerMobileUrl}
            </span>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-200/80 font-light">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>เปิดดูตารางจับคู่และคะแนนสดได้ทันที</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auto-Scrolling Championship Tables (8 of 12 columns) */}
        <div
          ref={scrollContainerRef}
          className="col-span-12 lg:col-span-8 overflow-y-auto pr-2 rounded-3xl bg-[#080d16]/80 border border-white/[0.08] p-6 shadow-2xl relative tcg-card"
        >
          {activeDisplayTab === 'pairings' ? (
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2.5">
                  <Swords className="w-5 h-5 text-amber-400" />
                  <h2 className="text-xl font-black text-white">
                    {tournament.status === 'registering'
                      ? 'รอเริ่มการแข่งขันรอบที่ 1'
                      : `ตารางโต๊ะแข่งขันรอบที่ ${tournament.current_round}`}
                  </h2>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono font-bold">
                  {currentRoundMatches.length} คู่แข่งขัน
                </span>
              </div>

              {tournament.status === 'registering' ? (
                <div className="p-16 text-center text-gray-500">
                  <Swords className="w-16 h-16 mx-auto mb-4 text-gray-700 animate-pulse opacity-40" />
                  <h3 className="text-lg font-bold text-gray-300">กำลังเปิดรับสมัครผู้เข้าแข่งขัน</h3>
                  <p className="text-xs text-gray-500 mt-2">
                    ผู้เล่นสามารถสแกน QR Code ทางด้านซ้ายเพื่อลงทะเบียนเข้าร่วมได้ทันที
                  </p>
                </div>
              ) : (
                <PairingsList
                  matches={currentRoundMatches}
                  players={players}
                  canReport={false}
                />
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <h2 className="text-xl font-black text-white gold-gradient-text">
                    ตารางคะแนนล่าสุด (TOURNAMENT STANDINGS)
                  </h2>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono font-bold">
                  {players.length} ผู้เล่น
                </span>
              </div>

              <StandingsTable
                standings={standings}
                showNationAndBoss={tournament.status === 'completed'}
                format={tournament.format}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
