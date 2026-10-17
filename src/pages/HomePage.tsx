import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Tournament, TournamentFormat } from "../types";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import {
  Plus,
  Swords,
  Calendar,
  Shield,
  MapPin,
  Users,
  Sparkles,
  Upload,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import { compressImage } from "../utils/compressImage";
import { useAuth } from "../contexts/AuthContext";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [playerCounts, setPlayerCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Form states for creating tournament
  const [name, setName] = useState("แข่งแวนการ์ด D TH วันเสาร์");
  const [format, setFormat] = useState<TournamentFormat>("Standard TH");
  const [eventDate, setEventDate] = useState("2026-10-17T14:30");
  const [entryFee, setEntryFee] = useState<number>(70);
  const [maxPlayers, setMaxPlayers] = useState<number>(20);
  const [storeName, setStoreName] = useState("Cardboard Tavern");
  const [location, setLocation] = useState(
    "Lotus หลักสี่ ชั้น 2 (BTS วัดพระศรี)",
  );
  const [bannerUrl, setBannerUrl] = useState("/images/vanguard_banner_1.jpg");
  const [maxRounds, setMaxRounds] = useState(4);
  const [roundDuration, setRoundDuration] = useState(30);
  const [description, setDescription] = useState(
    "รางวัลอันดับที่ 1-3 : การ์ดโปรโมประจำเดือน คนละ 4 ใบ+\n" +
      "รางวัลอันดับที่ 4 เป็นต้นไป : การ์ดโปรโม คนละ 4 ใบ\n" +
      "มี Lucky Draw สุ่มแจกการ์ดพิเศษ (กรณีผู้แข่ง 16 คนขึ้นไป)\n" +
      "เปิดลงทะเบียน walk in 12:00 น. | เริ่มแพริ่งแข่งขัน 14:30 น.",
  );

  // Banner image upload & compression states
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressing, setCompressing] = useState<boolean>(false);
  const [compressionStats, setCompressionStats] = useState<{
    origSize: string;
    compSize: string;
    ratio: string;
  } | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [rlsError, setRlsError] = useState<string | null>(null);

  // Handle image upload and compression
  const handleFileChange = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WebP) เท่านั้นครับ");
      return;
    }

    setCompressing(true);
    try {
      const origKB = (file.size / 1024).toFixed(0) + " KB";
      const { blob, size } = await compressImage(file, 1200, 1200, 0.82);
      const compKB = (size / 1024).toFixed(0) + " KB";
      const savedPct = Math.round(((file.size - size) / file.size) * 100);

      const previewUrl = URL.createObjectURL(blob);
      setBannerFile(file);
      setCompressedBlob(blob);
      setBannerPreview(previewUrl);
      setCompressionStats({
        origSize: origKB,
        compSize: compKB,
        ratio: savedPct > 0 ? `ลดขนาดลง ${savedPct}%` : "พร้อมใช้งาน",
      });
    } catch (err: any) {
      console.error("Compression error:", err);
      alert("ไม่สามารถบีบอัดรูปภาพได้: " + (err.message || ""));
    } finally {
      setCompressing(false);
    }
  };

  // Fetch tournaments & player counts (in parallel)
  const fetchTournaments = async () => {
    try {
      const [{ data, error }, { data: pData }] = await Promise.all([
        supabase
          .from("tournaments")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("players").select("tournament_id"),
      ]);

      if (error) throw error;
      setTournaments(data || []);

      if (pData) {
        const counts: Record<string, number> = {};
        for (const p of pData) {
          counts[p.tournament_id] = (counts[p.tournament_id] || 0) + 1;
        }
        setPlayerCounts(counts);
      }
    } catch (err) {
      console.error("Failed to fetch tournaments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();

    // Debounce realtime bursts (e.g. many players inserted at once)
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(fetchTournaments, 300);
    };

    const channel = supabase
      .channel("public:tournaments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournaments" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        refresh,
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      setRlsError(null);

      let finalBannerUrl = bannerUrl || "/images/vanguard_banner_1.jpg";

      // If user uploaded a new image, upload compressed image to Supabase Storage bucket 'banners'
      if (compressedBlob) {
        try {
          setUploadingImage(true);
          const fileName = `banner_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;

          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from("banners")
            .upload(fileName, compressedBlob, {
              contentType: "image/jpeg",
              upsert: true,
            });

          if (uploadErr) {
            console.warn("Storage upload notice:", uploadErr);
            alert(
              "⚠️ อัปโหลดรูปภาพไปยัง Bucket 'banners' ไม่สำเร็จ:\n" +
                (uploadErr.message ||
                  "กรุณาตรวจสอบว่าได้สร้าง Bucket 'banners' ใน Supabase Storage และเปิด Public Policy แล้ว") +
                "\n\n(ระบบจะใช้รูปโปสเตอร์เริ่มต้นของร้านแทน เพื่อให้สร้างทัวร์นาเมนต์ได้สำเร็จ)",
            );
          } else if (uploadData) {
            const { data: urlData } = supabase.storage
              .from("banners")
              .getPublicUrl(fileName);
            if (urlData?.publicUrl) {
              finalBannerUrl = urlData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.error("Storage error:", storageErr);
        } finally {
          setUploadingImage(false);
        }
      }

      // Attempt to insert full detailed tournament
      const fullPayload = {
        name: name.trim(),
        format,
        max_rounds: maxRounds,
        round_duration_minutes: roundDuration,
        status: "registering" as const,
        current_round: 0,
        event_date: eventDate
          ? new Date(eventDate).toISOString()
          : new Date().toISOString(),
        entry_fee: Number(entryFee) || 70,
        max_players: Number(maxPlayers) || 20,
        store_name: storeName.trim() || "Cardboard Tavern",
        location: location.trim() || "Lotus หลักสี่ ชั้น 2 (BTS วัดพระศรี)",
        banner_url: finalBannerUrl,
        description: description.trim() || null,
      };

      let createdTournament: any = null;

      const { data, error } = await supabase
        .from("tournaments")
        .insert(fullPayload)
        .select()
        .single();

      if (error) {
        // If columns haven't been added yet in Supabase SQL editor, fallback to base schema
        const isMissingColumn =
          error.code === "PGRST204" ||
          error.code === "42703" ||
          error.message?.includes("column");

        if (isMissingColumn) {
          console.warn(
            "New columns not detected in Supabase yet, creating with base columns:",
            error.message,
          );
          const basePayload = {
            name: name.trim(),
            format,
            max_rounds: maxRounds,
            round_duration_minutes: roundDuration,
            status: "registering" as const,
            current_round: 0,
          };

          const fallbackRes = await supabase
            .from("tournaments")
            .insert(basePayload)
            .select()
            .single();

          if (fallbackRes.error) throw fallbackRes.error;
          createdTournament = fallbackRes.data;
        } else {
          throw error;
        }
      } else {
        createdTournament = data;
      }

      setIsModalOpen(false);
      if (createdTournament) {
        navigate(`/admin/tournament/${createdTournament.id}`);
      }
    } catch (err: any) {
      console.error("Error creating tournament:", err);
      const isRls =
        err?.code === "42501" ||
        err?.message?.includes("row-level security") ||
        err?.message?.includes("policy");
      if (isRls) {
        setRlsError(
          "ฐานข้อมูล Supabase ปฏิเสธการบันทึกเนื่องจากติด Row-Level Security (RLS) Policy",
        );
      } else {
        alert(
          "ไม่สามารถสร้างทัวร์นาเมนต์ได้: " +
            (err.message || "โปรดตรวจสอบการเชื่อมต่อ Supabase"),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatEventDate = (dateStr?: string | null) => {
    if (!dateStr) return "17 ต.ค. 14:30";
    try {
      const d = new Date(dateStr);
      const day = d.getDate();
      const thaiMonths = [
        "ม.ค.",
        "ก.พ.",
        "มี.ค.",
        "เม.ย.",
        "พ.ค.",
        "มิ.ย.",
        "ก.ค.",
        "ส.ค.",
        "ก.ย.",
        "ต.ค.",
        "พ.ย.",
        "ธ.ค.",
      ];
      const month = thaiMonths[d.getMonth()];
      const hours = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      return `${day} ${month} ${hours}:${mins}`;
    } catch {
      return "17 ต.ค. 14:30";
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-gray-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* RLS Warning Banner */}
        {rlsError && (
          <div className="mb-8 p-6 rounded-2xl bg-amber-950/40 border border-amber-500/40 shadow-xl text-amber-200">
            <h3 className="text-base font-bold text-white mb-1">
              ⚠️ ต้องเปิดสิทธิ์ (RLS Policy) ใน Supabase ก่อนเริ่มใช้งาน
            </h3>
            <p className="text-xs text-amber-200/90 mb-3">
              รันคำสั่ง{" "}
              <code>ALTER TABLE tournaments DISABLE ROW LEVEL SECURITY;</code>{" "}
              ใน Supabase SQL Editor
            </p>
          </div>
        )}

        {/* Top Header / Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold uppercase tracking-widest">
                Cardboard Tavern Tournament
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Swords className="w-6 h-6 text-amber-400" />
              <span>รายการการแข่งขันการ์ดเกม</span>
            </h1>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3">
              <button
                id="create-tournament-btn"
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>สร้างการแข่งขันใหม่</span>
              </button>
            </div>
          )}
        </div>

        {/* Tournament Cards Grid (Faithful Bushiroad / TCG Event Card Layout) */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-[460px] rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse"
              />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-[#0c111c]/60 border border-white/[0.06] max-w-lg mx-auto">
            <Swords className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-50" />
            <h3 className="text-base font-bold text-gray-300">
              ยังไม่มีการแข่งขันในขณะนี้
            </h3>
            {isAdmin && (
              <>
                <p className="text-gray-500 text-xs mt-1 mb-6 font-light">
                  คลิกปุ่ม "สร้างการแข่งขันใหม่" เพื่อเปิดทัวร์นาเมนต์แรกของร้าน
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 font-black text-xs"
                >
                  สร้างการแข่งขัน
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 justify-items-center sm:justify-items-stretch">
            {tournaments.map((tourney, index) => {
              const isRegistering = tourney.status === "registering";
              const isOngoing = tourney.status === "ongoing";
              const isCompleted = tourney.status === "completed";

              const bannerImage =
                tourney.banner_url ||
                (index % 2 === 0
                  ? "/images/vanguard_banner_1.jpg"
                  : "/images/vanguard_banner_2.jpg");

              const currentPlayers = playerCounts[tourney.id] || 0;
              const maxCap = tourney.max_players || 20;
              const feeText =
                tourney.entry_fee !== undefined
                  ? `฿${tourney.entry_fee}`
                  : "฿70";
              const shopName = tourney.store_name || "Cardboard Tavern";
              const venue =
                tourney.location || "Lotus หลักสี่ ชั้น 2 (BTS วัดพระศรี)";

              return (
                <div
                  key={tourney.id}
                  onClick={() =>
                    navigate(
                      isAdmin
                        ? `/admin/tournament/${tourney.id}`
                        : `/tournament/${tourney.id}`,
                    )
                  }
                  className="w-full max-w-[380px] rounded-2xl border border-white/[0.08] bg-[#0d121f] hover:border-amber-400/50 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 cursor-pointer group"
                >
                  {/* Top Poster Visual Section */}
                  <div>
                    <div className="relative aspect-[6/5] w-full overflow-hidden bg-black/80">
                      <img
                        src={bannerImage}
                        alt={tourney.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      {/* Gradient Vignette */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d121f] via-transparent to-black/20 pointer-events-none" />

                      {/* Top-Left: Date & Time Pill (Matching Reference) */}
                      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white shadow-md">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        <span>
                          {formatEventDate(
                            tourney.event_date || tourney.created_at,
                          )}
                        </span>
                      </div>

                      {/* Top-Right: RECEPTION / Status Badge (Matching Reference) */}
                      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-2">
                        {isRegistering && (
                          <span className="px-2.5 py-0.5 rounded-md bg-[#00e676]/20 border border-[#00e676]/60 text-[#00e676] text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg">
                            RECEPTION
                          </span>
                        )}
                        {isOngoing && (
                          <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/60 text-amber-300 text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                            <span>ONGOING R{tourney.current_round}</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-800/80 border border-white/20 text-gray-300 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-lg">
                            COMPLETED
                          </span>
                        )}
                      </div>

                      {/* Format Watermark on bottom right of poster */}
                      <div className="absolute bottom-2.5 right-2.5 z-10 text-[9px] font-mono uppercase tracking-widest text-amber-300 font-black bg-black/70 px-2 py-0.5 rounded-md backdrop-blur-sm border border-amber-500/30">
                        {tourney.format}
                      </div>
                    </div>

                    {/* Content Section (Matching Title, Shop Avatar, Location Pin) */}
                    <div className="p-3.5 pt-3">
                      {/* Tournament Title */}
                      <h3 className="text-[15px] font-black text-white tracking-tight leading-snug line-clamp-1 mb-2 group-hover:text-amber-300 transition-colors uppercase">
                        {tourney.name}
                      </h3>

                      {/* Store & Location Details (2 lines identical to reference) */}
                      <div className="space-y-1 text-xs">
                        {/* Line 1: Circular store avatar + Store Name */}
                        <div className="flex items-center gap-2 text-gray-200">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 flex-shrink-0 flex items-center justify-center p-[1px] shadow-sm overflow-hidden">
                            <img
                              src="/images/shop_logo.jpg"
                              alt="CT"
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display =
                                  "none";
                              }}
                            />
                          </div>
                          <span className="font-semibold text-[13px] text-gray-200 truncate">
                            {shopName}
                          </span>
                        </div>

                        {/* Line 2: 📍 Pin + Location Name */}
                        <div className="flex items-center gap-1.5 text-gray-400 font-normal">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20 flex-shrink-0" />
                          <span className="text-[12px] text-gray-400 truncate">
                            {venue}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Bar: Fees Pill, Capacity Pill & Action Menu */}
                  <div className="p-3.5 pt-1">
                    <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06]">
                      {/* Left: [ ฿70 ] and [ 👥 6/20 ] Badges */}
                      <div className="flex items-center gap-1.5">
                        {/* Price Pill */}
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#161e30] border border-white/10 text-[11px] font-mono font-bold text-gray-300 shadow-inner">
                          {feeText}
                        </span>

                        {/* Capacity Pill */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#161e30] border border-white/10 text-[11px] font-mono font-bold text-gray-300 shadow-inner">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>
                            {currentPlayers}/{maxCap}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal: Create Tournament (Fully synchronized with Card details) */}
      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0e1422] border border-white/[0.12] w-full max-w-2xl rounded-2xl shadow-2xl p-6 sm:p-7 tcg-card my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <span>สร้างการแข่งขันใหม่</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTournament} className="space-y-5">
              {/* Row 1: Tournament Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                  ชื่อการแข่งขัน<span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น แข่งแวนการ์ด D TH วันเสาร์, Cardfight!! Vanguard Store Championship"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                />
              </div>

              {/* Row 2: Format & Date/Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                    รูปแบบการแข่งขัน<span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={format}
                    onChange={(e) => {
                      const newFormat = e.target.value as TournamentFormat;
                      setFormat(newFormat);
                      if (newFormat === "Standard TH") {
                        setBannerUrl("/images/vanguard_banner_1.jpg");
                        setName("แข่งแวนการ์ด D TH วันเสาร์");
                      } else if (newFormat === "Premium TH") {
                        setBannerUrl("/images/vanguard_banner_2.jpg");
                        setName("แข่งแวนการ์ด Premium วันอาทิตย์");
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                  >
                    <option value="Standard TH">
                      Standard (TH) - การ์ดไทย
                    </option>
                    <option value="Standard JP">
                      Standard (JP) - การ์ดญี่ปุ่น
                    </option>
                    <option value="Premium TH">Premium (TH) - การ์ดไทย</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                    วันและเวลาเริ่มแข่ง (24 ชม.){" "}
                    <span className="text-amber-400">*</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* 1. ช่องเลือกวันที่ */}
                    <input
                      type="date"
                      required
                      value={eventDate ? eventDate.split("T")[0] : ""}
                      onChange={(e) => {
                        const datePart = e.target.value;
                        const timePart =
                          eventDate?.split("T")[1]?.slice(0, 5) || "13:00";
                        setEventDate(datePart ? `${datePart}T${timePart}` : "");
                      }}
                      style={{ colorScheme: "dark" }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                    />

                    {/* 2. ช่องเลือกเวลาแบบ 24 ชั่วโมง (ชั่วโมง : นาที) */}
                    <div className="flex items-center gap-1.5 bg-[#070a12] border border-white/10 rounded-xl px-3 py-2 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/30">
                      {/* เลือกชั่วโมง (00 - 23) */}
                      <select
                        value={eventDate?.split("T")[1]?.split(":")[0] || "13"}
                        onChange={(e) => {
                          const datePart =
                            eventDate?.split("T")[0] ||
                            new Date().toISOString().split("T")[0];
                          const minutePart =
                            eventDate
                              ?.split("T")[1]
                              ?.split(":")[1]
                              ?.slice(0, 2) || "00";
                          setEventDate(
                            `${datePart}T${e.target.value}:${minutePart}`,
                          );
                        }}
                        className="w-full bg-transparent text-white text-sm font-mono text-center focus:outline-none cursor-pointer"
                      >
                        {Array.from({ length: 24 }, (_, i) =>
                          String(i).padStart(2, "0"),
                        ).map((hour) => (
                          <option
                            key={hour}
                            value={hour}
                            className="bg-gray-900 text-white"
                          >
                            {hour}
                          </option>
                        ))}
                      </select>

                      <span className="text-amber-400 font-bold">:</span>

                      {/* เลือกนาที (ทีละ 5 นาที: 00, 05, 10, ..., 55) */}
                      <select
                        value={
                          eventDate
                            ?.split("T")[1]
                            ?.split(":")[1]
                            ?.slice(0, 2) || "00"
                        }
                        onChange={(e) => {
                          const datePart =
                            eventDate?.split("T")[0] ||
                            new Date().toISOString().split("T")[0];
                          const hourPart =
                            eventDate?.split("T")[1]?.split(":")[0] || "13";
                          setEventDate(
                            `${datePart}T${hourPart}:${e.target.value}`,
                          );
                        }}
                        className="w-full bg-transparent text-white text-sm font-mono text-center focus:outline-none cursor-pointer"
                      >
                        {Array.from({ length: 12 }, (_, i) =>
                          String(i * 5).padStart(2, "0"),
                        ).map((minute) => (
                          <option
                            key={minute}
                            value={minute}
                            className="bg-gray-900 text-white"
                          >
                            {minute}
                          </option>
                        ))}
                      </select>

                      <span className="text-xs text-gray-400 ml-1 shrink-0">
                        น.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Entry Fee, Max Capacity, Round Duration & Rounds */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                    ค่าสมัคร (บาท)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={entryFee}
                    onChange={(e) => setEntryFee(parseInt(e.target.value) || 0)}
                    placeholder="70"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                    จำกัดผู้สมัคร (คน)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={128}
                    value={maxPlayers}
                    onChange={(e) =>
                      setMaxPlayers(parseInt(e.target.value) || 20)
                    }
                    placeholder="20"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                    เวลาต่อรอบ (นาที)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={120}
                    value={roundDuration}
                    onChange={(e) =>
                      setRoundDuration(parseInt(e.target.value) || 30)
                    }
                    placeholder="30"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                    จำนวนรอบสูงสุด
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={maxRounds}
                    onChange={(e) =>
                      setMaxRounds(parseInt(e.target.value) || 4)
                    }
                    placeholder="4"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Row 4: Store & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                    ชื่อร้านค้า
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Cardboard Tavern"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                    สถานที่จัดแข่ง
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Lotus หลักสี่ ชั้น 2 (BTS วัดพระศรี)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Row 5: Banner Image Upload & Compression (Bucket: banners) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>อัปโหลดรูปโปสเตอร์การแข่งขัน</span>
                  </label>
                  {compressionStats && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold font-mono">
                      ✨ {compressionStats.origSize} ➔{" "}
                      {compressionStats.compSize} ({compressionStats.ratio})
                    </span>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileChange(file);
                  }}
                />

                {bannerPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/60 shadow-lg">
                    <div className="relative aspect-[6/5] w-full max-h-60 sm:max-h-72 overflow-hidden flex items-center justify-center">
                      <img
                        src={bannerPreview}
                        alt="Banner Preview"
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                      {/* Top badges preview */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white shadow-md">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        <span>{formatEventDate(eventDate)}</span>
                      </div>

                      <div className="absolute top-2.5 right-2.5">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#00e676]/20 border border-[#00e676]/60 text-[#00e676] text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
                          RECEPTION
                        </span>
                      </div>

                      {/* Action buttons on image */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={compressing || uploadingImage}
                          className="px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black/95 text-white text-xs font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
                        >
                          <Upload className="w-3.5 h-3.5 text-amber-400" />
                          <span>เปลี่ยนรูปภาพ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setBannerFile(null);
                            setCompressedBlob(null);
                            setBannerPreview(null);
                            setCompressionStats(null);
                            setBannerUrl("/images/vanguard_banner_1.jpg");
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
                          className="p-1.5 px-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors shadow-lg"
                          title="ลบรูปและใช้ค่าเริ่มต้น"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 bg-[#070a12] border-t border-white/[0.08] flex items-center justify-between text-xs text-gray-400">
                      <span className="truncate max-w-[240px] text-gray-300 font-medium">
                        📁 {bannerFile ? bannerFile.name : "รูปภาพที่เลือก"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileChange(file);
                    }}
                    className="cursor-pointer border-2 border-dashed border-white/15 hover:border-amber-400/50 rounded-2xl p-6 sm:p-7 bg-[#070a12]/70 hover:bg-white/[0.02] flex flex-col items-center justify-center text-center transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform border border-amber-500/20">
                      {compressing ? (
                        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                    </div>
                    <p className="text-sm font-bold text-white mb-1">
                      {compressing
                        ? "กำลังบีบอัดรูปภาพ..."
                        : "คลิกหรือลากไฟล์ภาพโปสเตอร์มาวางที่นี่"}
                    </p>
                    <p className="text-xs text-gray-400 max-w-sm mb-2.5">
                      รองรับไฟล์ภาพ JPG, PNG, WebP
                    </p>
                  </div>
                )}
              </div>

              {/* Row 6: Tournament Description / Rewards */}
              <div>
                <label className="text-xs font-semibold text-gray-200 mb-1.5 flex items-center justify-between gap-2">
                  <div>
                    <span>รายละเอียดการแข่งขัน / ของรางวัล / กำหนดการ</span>
                    <span className="text-[11px] text-gray-500 font-light ml-1.5 hidden sm:inline">
                      (แสดงในหน้าข้อมูลทัวร์นาเมนต์)
                    </span>
                  </div>

                  {/* ปุ่มลัดช่วยกรอกแพตเทิร์นของร้านอัตโนมัติ */}
                  <button
                    type="button"
                    onClick={() =>
                      setDescription(
                        "รางวัลอันดับที่ 1-3 โปรโมเดือนนี้คนละ 4 ใบ+\nอันดับที่ 4 เป็นต้นไปคนละ 4 ใบ\nมี Lucky Draw 🍀 กรณีผู้แข่ง 16 คนขึ้นไป\nเปิดลงทะเบียน Walk-in 12:00 เริ่มแพริ่ง 14:30",
                      )
                    }
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2 transition-colors"
                  >
                    + ใช้ข้อความตั้งต้นของร้าน
                  </button>
                </label>

                <textarea
                  rows={4}
                  value={description?.replace(/\\n/g, "\n") || ""}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    "เช่น:\nรางวัลอันดับที่ 1-3 โปรโมเดือนนี้...\nมี Lucky Draw กรณีผู้แข่ง 16 คนขึ้นไป\nเปิดลงทะเบียน Walk-in 12:00 เริ่มแพริ่ง 14:30"
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-xs leading-relaxed focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 resize-y"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
                <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>ข้อมูลทั้งหมดจะแสดงผลหน้ารายละเอียดการแข่งขัน</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-gray-300 text-sm font-medium transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 text-sm font-black shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>
                      {submitting ? "กำลังสร้าง..." : "สร้างทัวร์นาเมนต์"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
