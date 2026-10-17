import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Tournament, Player, Match } from "../types";
import { calculateStandings } from "../utils/tiebreaker";
import { Navbar } from "../components/Navbar";
import { CountdownTimer } from "../components/CountdownTimer";
import { PairingsList } from "../components/PairingsList";
import { StandingsTable } from "../components/StandingsTable";
import { MetaAnalytics } from "../components/MetaAnalytics";
import { ReportMatchModal } from "../components/ReportMatchModal";
import {
  Swords,
  Trophy,
  AlertCircle,
  CheckCircle,
  BarChart3,
} from "lucide-react";

export const PlayerTournamentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"pairings" | "standings" | "meta">(
    "pairings",
  );

  // Match report modal
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Fetch all tournament data
  const fetchData = async () => {
    if (!id) return;
    try {
      const { data: tData, error: tErr } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", id)
        .single();

      if (tErr) throw tErr;
      setTournament(tData);

      const { data: pData, error: pErr } = await supabase
        .from("players")
        .select("*")
        .eq("tournament_id", id)
        .order("lucky_draw_number", { ascending: true });

      if (pErr) throw pErr;
      setPlayers(pData || []);

      const { data: mData, error: mErr } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", id)
        .order("table_number", { ascending: true });

      if (mErr) throw mErr;
      setMatches(mData || []);
    } catch (err) {
      console.error("Error fetching tournament data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const tChannel = supabase
      .channel(`tournament:${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tournaments",
          filter: `id=eq.${id}`,
        },
        () => fetchData(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `tournament_id=eq.${id}`,
        },
        () => fetchData(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
          filter: `tournament_id=eq.${id}`,
        },
        () => fetchData(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tChannel);
    };
  }, [id]);

  const handleSaveMatchResult = async (
    winnerId: string | null,
    isDoubleLoss: boolean,
  ) => {
    if (!selectedMatch) return;

    const { error } = await supabase
      .from("matches")
      .update({
        winner_id: winnerId,
        is_double_loss: isDoubleLoss,
        status: "completed",
      })
      .eq("id", selectedMatch.id);

    if (error) throw error;
    await fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06080d] flex items-center justify-center text-amber-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-gray-400">
            กำลังเชื่อมต่อข้อมูลการแข่งขัน...
          </span>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-[#06080d] flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-10 h-10 text-amber-500 mb-3 opacity-60" />
        <h2 className="text-xl font-bold text-white mb-2">
          ไม่พบข้อมูลการแข่งขัน
        </h2>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20"
        >
          กลับสู่หน้าหลัก
        </Link>
      </div>
    );
  }

  const currentRoundMatches = matches.filter(
    (m) => m.round_number === tournament.current_round,
  );

  const standings = calculateStandings(players, matches);

  const p1 = selectedMatch
    ? players.find((p) => p.id === selectedMatch.player1_id)
    : undefined;
  const p2 =
    selectedMatch && selectedMatch.player2_id
      ? players.find((p) => p.id === selectedMatch.player2_id)
      : undefined;

  return (
    <div className="min-h-screen bg-[#06080d] text-gray-100 flex flex-col pb-16">
      <Navbar tournamentId={tournament.id} tournamentName={tournament.name} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 w-full pt-6 flex-1">
        {/* Tournament Banner Card */}
        <div className="p-6 rounded-3xl bg-[#0c121e]/90 border border-white/[0.08] shadow-[0_15px_35px_rgba(0,0,0,0.8)] mb-6 tcg-card sleeve-frame">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono font-semibold">
                  {tournament.format}
                </span>

                {tournament.status === "registering" && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>เปิดรับสมัคร ({tournament.max_players} คน)</span>
                  </span>
                )}
                {tournament.status === "ongoing" && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      กำลังแข่งขัน รอบที่ {tournament.current_round}/
                      {tournament.max_rounds}
                    </span>
                  </span>
                )}
                {tournament.status === "completed" && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/[0.06] text-gray-300 border border-white/10 font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
                    <span>จบการแข่งขันแล้ว</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {tournament.name}
              </h1>
              <div className="text-gray-300 font-semibold text-[16px]">
                {tournament.description?.split(/\\n|\n/).map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </div>

            {tournament.status === "ongoing" && (
              <div>
                <CountdownTimer
                  timerEndsAt={tournament.timer_ends_at}
                  timerPausedRemainingSeconds={
                    tournament.timer_paused_remaining_seconds
                  }
                  roundDurationMinutes={tournament.round_duration_minutes}
                  size="md"
                />
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-6 border-b border-white/[0.06] pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("pairings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "pairings"
                ? "bg-amber-500 text-gray-950 shadow-[0_0_15px_rgba(245,158,11,0.25)] font-black"
                : "bg-white/[0.03] hover:bg-white/[0.06] text-gray-400 hover:text-white border border-white/[0.04]"
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>ตารางการแข่งขัน</span>
            {currentRoundMatches.length > 0 && (
              <span
                className={`text-[11px] px-2 py-0.2 rounded-full font-mono ${
                  activeTab === "pairings"
                    ? "bg-gray-950/30 text-gray-950"
                    : "bg-white/10 text-gray-300"
                }`}
              >
                {currentRoundMatches.length}
              </span>
            )}
          </button>

          {tournament.status === "completed" && (
            <>
              <button
                onClick={() => setActiveTab("standings")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === "standings"
                    ? "bg-amber-500 text-gray-950 shadow-[0_0_15px_rgba(245,158,11,0.25)] font-black"
                    : "bg-white/[0.03] hover:bg-white/[0.06] text-gray-400 hover:text-white border border-white/[0.04]"
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>ตารางคะแนน</span>
                <span
                  className={`text-[11px] px-2 py-0.2 rounded-full font-mono ${
                    activeTab === "standings"
                      ? "bg-gray-950/30 text-gray-950"
                      : "bg-white/10 text-gray-300"
                  }`}
                >
                  {players.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("meta")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === "meta"
                    ? "bg-amber-500 text-gray-950 shadow-[0_0_15px_rgba(245,158,11,0.25)] font-black"
                    : "bg-white/[0.03] hover:bg-white/[0.06] text-gray-400 hover:text-white border border-white/[0.04]"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>วิเคราะห์ Meta</span>
              </button>
            </>
          )}
        </div>

        {/* Tab 1: Pairings View */}
        {activeTab === "pairings" && (
          <div>
            {tournament.status === "registering" ? (
              <div className="p-16 text-center rounded-3xl bg-[#0c121e]/80 border border-white/[0.06]">
                <Swords className="w-12 h-12 text-amber-400 mx-auto mb-3 opacity-60" />
                <h3 className="text-lg font-bold text-white mb-2">
                  ยังไม่เริ่มการแข่งขันรอบที่ 1
                </h3>
                <p className="text-gray-400 text-xs max-w-md mx-auto mb-6">
                  ขณะนี้อยู่ในช่วงเปิดรับสมัคร เมื่อทางร้านกดเริ่มรอบที่ 1
                  รายชื่อโต๊ะจะปรากฏทันที
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>ตารางประกบคู่รอบที่ {tournament.current_round}</span>
                  </h2>
                  <span className="text-xs text-amber-300/80 font-medium">
                    *คลิกโต๊ะของคุณเพื่อส่งผลการแข่งขัน
                  </span>
                </div>

                <PairingsList
                  matches={currentRoundMatches}
                  players={players}
                  canReport={true}
                  onSelectMatch={(m) => {
                    setSelectedMatch(m);
                    setIsReportOpen(true);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Standings View */}
        {activeTab === "standings" && (
          <div>
            <StandingsTable standings={standings} />
          </div>
        )}

        {activeTab === "meta" && (
          <div>
            <MetaAnalytics players={players} />
          </div>
        )}
      </main>

      <ReportMatchModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        match={selectedMatch}
        player1={p1}
        player2={p2}
        onSaveResult={handleSaveMatchResult}
        isAdmin={false}
      />
    </div>
  );
};
