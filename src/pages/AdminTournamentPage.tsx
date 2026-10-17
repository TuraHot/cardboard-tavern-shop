import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Tournament, Player, Match, VanguardNation } from "../types";
import { VANGUARD_NATIONS } from "../utils/nations";
import { calculateStandings } from "../utils/tiebreaker";
import { generateSwissPairings } from "../utils/pairing";
import { Navbar } from "../components/Navbar";
import { CountdownTimer } from "../components/CountdownTimer";
import { PairingsList } from "../components/PairingsList";
import { StandingsTable } from "../components/StandingsTable";
import { ReportMatchModal } from "../components/ReportMatchModal";
import { LuckyDrawModal } from "../components/LuckyDrawModal";
import { MetaAnalytics } from "../components/MetaAnalytics";
import { NationBadge } from "../components/NationBadge";
import {
  Users,
  Swords,
  Trophy,
  Play,
  Sparkles,
  Plus,
  Trash2,
  UserX,
  UserCheck,
  Tv,
  AlertTriangle,
  BarChart3,
  Edit2,
  Shield,
} from "lucide-react";

export const AdminTournamentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<
    "round" | "players" | "standings" | "meta"
  >("round");
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<number>(1);

  // Modals
  const [isLuckyDrawOpen, setIsLuckyDrawOpen] = useState(false);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [isEditPlayerOpen, setIsEditPlayerOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);

  // Add/Edit Player form state
  const [formName, setFormName] = useState("");
  const [formNation, setFormNation] = useState<VanguardNation>("Dragon Empire");
  const [formDeckBoss, setFormDeckBoss] = useState("");
  const [submittingPlayer, setSubmittingPlayer] = useState(false);
  const [isGeneratingRound, setIsGeneratingRound] = useState(false);

  // Fetch all data
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
      if (tData.current_round > 0) {
        setSelectedRoundFilter(tData.current_round);
      }

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
        .order("round_number", { ascending: true })
        .order("table_number", { ascending: true });
      if (mErr) throw mErr;
      setMatches(mData || []);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`admin:${id}`)
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
      supabase.removeChannel(channel);
    };
  }, [id]);

  const currentRoundMatches = matches.filter(
    (m) => tournament && m.round_number === tournament.current_round,
  );
  const hasPendingMatchesInCurrentRound = currentRoundMatches.some(
    (m) => m.status === "pending",
  );

  const handleGenerateNextRound = async () => {
    if (!tournament) return;
    const nextRoundNum = tournament.current_round + 1;

    if (nextRoundNum > tournament.max_rounds) {
      alert(`ทัวร์นาเมนต์นี้กำหนดไว้สูงสุด ${tournament.max_rounds} รอบแล้ว`);
      return;
    }

    try {
      setIsGeneratingRound(true);

      const pairingResult = generateSwissPairings(
        tournament.id,
        nextRoundNum,
        players,
        matches,
      );

      const { error: insertErr } = await supabase
        .from("matches")
        .insert(pairingResult.matches);
      if (insertErr) throw insertErr;

      if (pairingResult.byePlayerId) {
        await supabase
          .from("players")
          .update({ has_received_bye: true })
          .eq("id", pairingResult.byePlayerId);
      }

      const durationMs = tournament.round_duration_minutes * 60 * 1000;
      const endsAt = new Date(Date.now() + durationMs).toISOString();

      const { error: tErr } = await supabase
        .from("tournaments")
        .update({
          status: "ongoing",
          current_round: nextRoundNum,
          timer_ends_at: endsAt,
          timer_paused_remaining_seconds: null,
        })
        .eq("id", tournament.id);

      if (tErr) throw tErr;

      setSelectedRoundFilter(nextRoundNum);
      await fetchData();
    } catch (err: any) {
      console.error("Failed to generate next round:", err);
      alert("ไม่สามารถจับคู่รอบถัดไปได้: " + (err.message || ""));
    } finally {
      setIsGeneratingRound(false);
    }
  };

  // 1. ผูกฟังก์ชันนี้เข้ากับปุ่ม "จบการแข่งขัน" เดิมบนหน้าเว็บ
  const handleRequestEndTournament = () => {
    if (!tournament) return;
    setIsEndModalOpen(true); // เปิด Modal ขึ้นมาถาม
  };

  // 2. ฟังก์ชันนี้จะทำงานเมื่อกดปุ่ม "ยืนยัน" ข้างใน Modal
  const confirmEndTournament = async () => {
    if (!tournament) return;
    setIsEndModalOpen(false); // ปิด Modal

    await supabase
      .from("tournaments")
      .update({
        status: "completed",
        timer_ends_at: null,
        timer_paused_remaining_seconds: null,
      })
      .eq("id", tournament.id);

    await fetchData();
  };

  const handleStartTimer = async () => {
    if (!tournament) return;
    const remainingSec =
      tournament.timer_paused_remaining_seconds !== null
        ? tournament.timer_paused_remaining_seconds
        : tournament.round_duration_minutes * 60;

    const endsAt = new Date(Date.now() + remainingSec * 1000).toISOString();

    await supabase
      .from("tournaments")
      .update({
        timer_ends_at: endsAt,
        timer_paused_remaining_seconds: null,
      })
      .eq("id", tournament.id);

    await fetchData();
  };

  const handlePauseTimer = async () => {
    if (!tournament || !tournament.timer_ends_at) return;
    const diff = Math.floor(
      (new Date(tournament.timer_ends_at).getTime() - Date.now()) / 1000,
    );
    const remaining = Math.max(0, diff);

    await supabase
      .from("tournaments")
      .update({
        timer_ends_at: null,
        timer_paused_remaining_seconds: remaining,
      })
      .eq("id", tournament.id);

    await fetchData();
  };

  const handleResetTimer = async () => {
    if (!tournament) return;
    await supabase
      .from("tournaments")
      .update({
        timer_ends_at: null,
        timer_paused_remaining_seconds: tournament.round_duration_minutes * 60,
      })
      .eq("id", tournament.id);

    await fetchData();
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !formName.trim()) return;

    try {
      setSubmittingPlayer(true);
      const nextLuckyNumber =
        players.length > 0
          ? Math.max(...players.map((p) => p.lucky_draw_number || 0)) + 1
          : 1;

      const { error } = await supabase.from("players").insert({
        tournament_id: id,
        name: formName.trim(),
        nation: formNation,
        deck_boss: formDeckBoss.trim() || null,
        lucky_draw_number: nextLuckyNumber,
        is_dropped: false,
        has_received_bye: false,
      });

      if (error) throw error;
      setFormName("");
      setFormDeckBoss("");
      setIsAddPlayerOpen(false);
      await fetchData();
    } catch (err: any) {
      alert("ไม่สามารถเพิ่มผู้เล่นได้: " + (err.message || ""));
    } finally {
      setSubmittingPlayer(false);
    }
  };

  const handleUpdatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer || !formName.trim()) return;

    try {
      setSubmittingPlayer(true);
      const { error } = await supabase
        .from("players")
        .update({
          name: formName.trim(),
          nation: formNation,
          deck_boss: formDeckBoss.trim() || null,
        })
        .eq("id", editingPlayer.id);

      if (error) throw error;
      setIsEditPlayerOpen(false);
      setEditingPlayer(null);
      await fetchData();
    } catch (err: any) {
      alert("ไม่สามารถแก้ไขผู้เล่นได้: " + (err.message || ""));
    } finally {
      setSubmittingPlayer(false);
    }
  };

  const handleToggleDropPlayer = async (player: Player) => {
    const action = player.is_dropped ? "กลับเข้าแข่ง" : "ดรอป (ออกจากการแข่ง)";
    if (!confirm(`ต้องการให้ผู้เล่น "${player.name}" ${action} ใช่หรือไม่?`))
      return;

    await supabase
      .from("players")
      .update({ is_dropped: !player.is_dropped })
      .eq("id", player.id);

    await fetchData();
  };

  const handleDeletePlayer = async (player: Player) => {
    if (!confirm(`ต้องการลบผู้เล่น "${player.name}" ออกจากระบบใช่หรือไม่?`))
      return;

    await supabase.from("players").delete().eq("id", player.id);
    await fetchData();
  };

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
            กำลังโหลดข้อมูลแดชบอร์ด...
          </span>
        </div>
      </div>
    );
  }

  if (!tournament) return null;

  const standings = calculateStandings(players, matches);
  const displayedMatches = matches.filter(
    (m) => m.round_number === selectedRoundFilter,
  );

  const p1 = selectedMatch
    ? players.find((p) => p.id === selectedMatch.player1_id)
    : undefined;
  const p2 =
    selectedMatch && selectedMatch.player2_id
      ? players.find((p) => p.id === selectedMatch.player2_id)
      : undefined;

  const totalRoundsPlayed = tournament.current_round;
  const availableRounds = Array.from(
    { length: Math.max(1, totalRoundsPlayed) },
    (_, i) => i + 1,
  );

  return (
    <div className="min-h-screen bg-[#06080d] text-gray-100 flex flex-col pb-16">
      <Navbar tournamentId={tournament.id} tournamentName={tournament.name} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-6 flex-1">
        {/* Admin Header Bar */}
        <div className="p-6 rounded-3xl bg-[#0c121e]/90 border border-white/[0.08] shadow-[0_15px_35px_rgba(0,0,0,0.8)] mb-6 tcg-card sleeve-frame">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider">
                  Admin Management
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-white/[0.05] text-gray-300 border border-white/10 font-mono font-medium">
                  Vanguard {tournament.format}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {tournament.name}
              </h1>
            </div>

            {/* Quick Actions & Timer */}
            <div className="flex flex-wrap items-center gap-3">
              <CountdownTimer
                timerEndsAt={tournament.timer_ends_at}
                timerPausedRemainingSeconds={
                  tournament.timer_paused_remaining_seconds
                }
                roundDurationMinutes={tournament.round_duration_minutes}
                showControls={true}
                onStart={handleStartTimer}
                onPause={handlePauseTimer}
                onReset={handleResetTimer}
              />

              <button
                onClick={() => setIsLuckyDrawOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(52,211,153,0.25)] transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>🍀 สุ่ม Lucky Draw</span>
              </button>

              <Link
                to={`/tournament/${tournament.id}/tv`}
                target="_blank"
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-cyan-200 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Tv className="w-4 h-4 text-cyan-400" />
                <span>เปิดจอ TV</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-6 border-b border-white/[0.06] pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("round")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "round"
                ? "bg-amber-500 text-gray-950 shadow-[0_0_15px_rgba(245,158,11,0.25)] font-black"
                : "bg-white/[0.03] hover:bg-white/[0.06] text-gray-400 hover:text-white border border-white/[0.04]"
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>จัดการรอบแข่งขัน</span>
          </button>

          <button
            onClick={() => setActiveTab("players")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "players"
                ? "bg-amber-500 text-gray-950 shadow-[0_0_15px_rgba(245,158,11,0.25)] font-black"
                : "bg-white/[0.03] hover:bg-white/[0.06] text-gray-400 hover:text-white border border-white/[0.04]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>จัดการผู้เล่น</span>
            <span className="text-[11px] px-2 py-0.2 rounded-full bg-black/30 font-mono">
              {players.length}
            </span>
          </button>

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
        </div>

        {/* Tab 1: Rounds & Pairings Control */}
        {activeTab === "round" && (
          <div className="space-y-6">
            {/* Round Status Banner & Generate Button */}
            <div className="p-6 rounded-2xl bg-[#0c121e]/90 border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4 tcg-card">
              <div>
                <div className="text-sm font-semibold text-gray-200">
                  {tournament.status === "registering"
                    ? "ขั้นตอนปัจจุบัน: เปิดรับสมัครผู้เข้าแข่งขัน"
                    : tournament.status === "ongoing"
                      ? `ขั้นตอนปัจจุบัน: กำลังแข่งขันรอบที่ ${tournament.current_round} จากทั้งหมด ${tournament.max_rounds} รอบ`
                      : "ขั้นตอนปัจจุบัน: จบการแข่งขันแล้ว (Completed)"}
                </div>
                <div className="text-xs text-gray-400 mt-1 font-light">
                  ผู้เล่นที่มีสิทธิ์แข่งขัน:{" "}
                  <span className="text-amber-300 font-semibold font-mono">
                    {players.filter((p) => !p.is_dropped).length}
                  </span>{" "}
                  คน
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {tournament.status !== "completed" &&
                  tournament.current_round !== tournament.max_rounds && (
                    <button
                      onClick={handleGenerateNextRound}
                      disabled={
                        isGeneratingRound ||
                        players.filter((p) => !p.is_dropped).length < 2 ||
                        (tournament.status === "ongoing" &&
                          hasPendingMatchesInCurrentRound) ||
                        tournament.current_round >= tournament.max_rounds
                      }
                      className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all ${
                        hasPendingMatchesInCurrentRound &&
                        tournament.status === "ongoing"
                          ? "bg-white/[0.04] text-gray-500 cursor-not-allowed border border-white/[0.06]"
                          : tournament.current_round >= tournament.max_rounds
                            ? "bg-white/[0.04] text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 shadow-[0_0_20px_rgba(245,158,11,0.25)] active:scale-95"
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>
                        {tournament.current_round === 0
                          ? "เริ่มรอบที่ 1 (Start Round 1)"
                          : tournament.current_round === tournament.max_rounds
                            ? "จบการแข่งขัน (End Tournament)"
                            : `รอบที่ ${tournament.current_round + 1}`}
                      </span>
                    </button>
                  )}

                {tournament.status === "ongoing" && (
                  <button
                    onClick={handleRequestEndTournament}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-rose-950 text-gray-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 text-xs sm:text-sm font-semibold transition-colors"
                  >
                    จบการแข่งขัน
                  </button>
                )}
              </div>
            </div>

            {hasPendingMatchesInCurrentRound &&
              tournament.status === "ongoing" && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex items-center gap-2 font-light">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>
                    ยังมีโต๊ะที่กำลังแข่งขันในรอบที่ {tournament.current_round}{" "}
                    อยู่ กรุณาบันทึกผลการแข่งขันให้ครบทุกโต๊ะก่อนจับคู่รอบถัดไป
                  </span>
                </div>
              )}

            {/* Round Selector Bar */}
            {totalRoundsPlayed > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mr-1">
                  เลือกรอบ:
                </span>
                {availableRounds.map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRoundFilter(r)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedRoundFilter === r
                        ? "bg-amber-500 text-gray-950 font-black shadow-md shadow-amber-500/20"
                        : "bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white border border-white/[0.04]"
                    }`}
                  >
                    รอบที่ {r}{" "}
                    {r === tournament.current_round && "(รอบปัจจุบัน)"}
                  </button>
                ))}
              </div>
            )}

            {/* Pairings List with Admin Override */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>รายชื่อคู่แข่งขันรอบที่ {selectedRoundFilter}</span>
                </h3>
                <span className="text-[11px] text-amber-300/80 font-medium">
                  *Admin สามารถคลิกโต๊ะใดก็ได้เพื่อแก้ไขผลการแข่งได้ทันที
                </span>
              </div>

              <PairingsList
                matches={displayedMatches}
                players={players}
                canReport={true}
                onSelectMatch={(m) => {
                  setSelectedMatch(m);
                  setIsReportOpen(true);
                }}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Player Management */}
        {activeTab === "players" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  รายชื่อผู้เข้าแข่งขันทั้งหมด
                </h3>
                <p className="text-xs text-gray-400 font-light">
                  สามารถเพิ่ม แก้ไขข้อมูล หรือตั้งค่า Drop
                  สำหรับผู้เล่นที่ต้องการออกจากการแข่งขัน
                </p>
              </div>

              {tournament.status === "registering" && (
                <button
                  onClick={() => {
                    setFormName("");
                    setFormDeckBoss("");
                    setFormNation("Dragon Empire");
                    setIsAddPlayerOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>เพิ่มผู้เล่น</span>
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#0c121e]/90 overflow-hidden shadow-xl tcg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-black/40 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-4 text-center w-16">🍀 #</th>
                      <th className="py-3 px-4">ชื่อผู้เล่น</th>
                      <th className="py-3 px-4">ประเทศ / แวนการ์ดหลัก</th>
                      <th className="py-3 px-4 text-center">สถานะ</th>
                      <th className="py-3 px-4 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-sm">
                    {players.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-12 text-center text-gray-500 text-xs"
                        >
                          ยังไม่มีผู้เล่นลงทะเบียน
                        </td>
                      </tr>
                    ) : (
                      players.map((p) => (
                        <tr
                          key={p.id}
                          className={`hover:bg-white/[0.02] transition-colors ${
                            p.is_dropped ? "opacity-40 line-through" : ""
                          }`}
                        >
                          <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                            #{p.lucky_draw_number}
                          </td>
                          <td className="py-3 px-4 font-bold text-white">
                            {p.name}
                          </td>
                          <td className="py-3 px-4">
                            <NationBadge
                              nation={p.nation}
                              deckBoss={p.deck_boss}
                              size="sm"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            {p.is_dropped ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/30">
                                ดรอปแล้ว
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-semibold">
                                แข่งขันอยู่
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingPlayer(p);
                                  setFormName(p.name);
                                  setFormNation(p.nation);
                                  setFormDeckBoss(p.deck_boss || "");
                                  setIsEditPlayerOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 text-gray-300 transition-colors border border-white/[0.06]"
                                title="แก้ไขข้อมูล"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleToggleDropPlayer(p)}
                                className={`p-1.5 rounded-lg transition-colors border ${
                                  p.is_dropped
                                    ? "bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/30"
                                    : "bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-500/30"
                                }`}
                                title={
                                  p.is_dropped ? "กลับเข้าแข่ง" : "ตั้งค่าดรอป"
                                }
                              >
                                {p.is_dropped ? (
                                  <UserCheck className="w-3.5 h-3.5" />
                                ) : (
                                  <UserX className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {tournament.status === "registering" && (
                                <button
                                  onClick={() => handleDeletePlayer(p)}
                                  className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 transition-colors"
                                  title="ลบผู้เล่น"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Standings */}
        {activeTab === "standings" && (
          <div>
            <StandingsTable standings={standings} />
          </div>
        )}

        {/* Tab 4: Meta Analytics */}
        {activeTab === "meta" && (
          <div>
            <MetaAnalytics players={players} />
          </div>
        )}
      </main>

      {/* Modal: Add Player */}
      {isAddPlayerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#0e1422] border border-white/[0.12] w-full max-w-md rounded-2xl shadow-2xl p-6 tcg-card">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span>เพิ่มผู้เข้าแข่งขันใหม่</span>
            </h3>
            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  ชื่อผู้เล่น
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="เช่น ไค โทชิกิ"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  ประเทศ
                </label>
                <select
                  value={formNation}
                  onChange={(e) =>
                    setFormNation(e.target.value as VanguardNation)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 shadow-inner"
                >
                  {VANGUARD_NATIONS.map((n) => (
                    <option key={n.name} value={n.name}>
                      {n.iconSymbol} {n.name} ({n.thaiName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  ชื่อแวนการ์ดหลัก
                </label>
                <input
                  type="text"
                  value={formDeckBoss}
                  onChange={(e) => setFormDeckBoss(e.target.value)}
                  placeholder="เช่น Dragonic Overlord"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 shadow-inner"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsAddPlayerOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-gray-300 text-sm font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submittingPlayer}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 text-sm font-black shadow-md"
                >
                  {submittingPlayer ? "กำลังบันทึก..." : "เพิ่มผู้เล่น"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Player */}
      {isEditPlayerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#0e1422] border border-white/[0.12] w-full max-w-md rounded-2xl shadow-2xl p-6 tcg-card">
            <h3 className="text-lg font-bold text-white mb-4">
              แก้ไขข้อมูลผู้เล่น
            </h3>
            <form onSubmit={handleUpdatePlayer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  ชื่อผู้เล่น
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  ประเทศ
                </label>
                <select
                  value={formNation}
                  onChange={(e) =>
                    setFormNation(e.target.value as VanguardNation)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 shadow-inner"
                >
                  {VANGUARD_NATIONS.map((n) => (
                    <option key={n.name} value={n.name}>
                      {n.iconSymbol} {n.name} ({n.thaiName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  ชื่อแวนการ์ดหลัก
                </label>
                <input
                  type="text"
                  value={formDeckBoss}
                  onChange={(e) => setFormDeckBoss(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 shadow-inner"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsEditPlayerOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-gray-300 text-sm font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submittingPlayer}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 text-sm font-black shadow-md"
                >
                  {submittingPlayer ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lucky Draw Modal */}
      <LuckyDrawModal
        isOpen={isLuckyDrawOpen}
        onClose={() => setIsLuckyDrawOpen(false)}
        players={players}
      />

      {/* Override Match Result Modal */}
      <ReportMatchModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        match={selectedMatch}
        player1={p1}
        player2={p2}
        onSaveResult={handleSaveMatchResult}
        isAdmin={true}
      />
      {/* Modal ยืนยันจบการแข่งขัน */}
      {isEndModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            {/* หัวข้อ Modal */}
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                ยืนยันจบการแข่งขัน?
              </h3>
            </div>

            {/* รายละเอียดคำเตือน */}
            <p className="text-sm text-gray-300 leading-relaxed mb-6">
              เมื่อจบการแข่งขันแล้ว
              ระบบจะสรุปอันดับตารางคะแนน
              โดยจะไม่สามารถจับคู่รอบใหม่ได้อีก
            </p>

            {/* ปุ่มกด ยกเลิก / ยืนยัน */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEndModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/10 transition-all"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmEndTournament}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-amber-500 hover:bg-amber-400 text-gray-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all"
              >
                ยืนยันจบการแข่งขัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
