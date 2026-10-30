import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { sounds } from "../utils/audio";
import {
  Database,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  Download,
  Lock,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Code,
  AlertTriangle,
  Home,
  CheckCircle,
} from "lucide-react";

type TableName = "tournaments" | "players" | "matches" | "nations" | "bosses";

interface TableConfig {
  name: TableName;
  label: string;
  icon: string;
  primaryKey: string;
  columns: {
    key: string;
    label: string;
    type: "text" | "number" | "boolean" | "datetime" | "textarea" | "select";
    options?: string[];
  }[];
}

const TABLE_CONFIGS: Record<TableName, TableConfig> = {
  tournaments: {
    name: "tournaments",
    label: "การแข่งขัน (Tournaments)",
    icon: "🏆",
    primaryKey: "id",
    columns: [
      { key: "id", label: "ID (UUID)", type: "text" },
      { key: "name", label: "ชื่อการแข่งขัน", type: "text" },
      {
        key: "format",
        label: "รูปแบบ (Format)",
        type: "select",
        options: ["Standard TH", "Standard JP", "Premium TH", "V-Premium", "Standard", "Premium"],
      },
      {
        key: "status",
        label: "สถานะ",
        type: "select",
        options: ["registering", "ongoing", "completed"],
      },
      { key: "current_round", label: "รอบปัจจุบัน", type: "number" },
      { key: "max_rounds", label: "รอบสูงสุด", type: "number" },
      { key: "round_duration_minutes", label: "เวลาต่อรอบ (นาที)", type: "number" },
      { key: "max_players", label: "ความจุผู้เล่นสูงสุด", type: "number" },
      { key: "entry_fee", label: "ค่าสมัคร (บาท)", type: "number" },
      { key: "store_name", label: "ชื่อร้าน", type: "text" },
      { key: "location", label: "สถานที่", type: "text" },
      { key: "banner_url", label: "URL รูปแบนเนอร์", type: "text" },
      { key: "description", label: "รายละเอียด / ของรางวัล", type: "textarea" },
      { key: "timer_ends_at", label: "เวลาสิ้นสุด (ISO)", type: "datetime" },
      { key: "timer_paused_remaining_seconds", label: "วินาทีคงเหลือเมื่อหยุด", type: "number" },
    ],
  },
  players: {
    name: "players",
    label: "ผู้เล่น (Players)",
    icon: "👥",
    primaryKey: "id",
    columns: [
      { key: "id", label: "ID (UUID)", type: "text" },
      { key: "tournament_id", label: "Tournament ID", type: "text" },
      { key: "name", label: "ชื่อผู้เล่น", type: "text" },
      { key: "nation", label: "เนชั่น (Nation)", type: "text" },
      { key: "deck_boss", label: "บอสการ์ด (Deck Boss)", type: "text" },
      { key: "lucky_draw_number", label: "หมายเลขสุ่ม (Lucky #)", type: "number" },
      { key: "is_dropped", label: "ดรอปออก (Is Dropped)", type: "boolean" },
      { key: "has_received_bye", label: "เคยได้ BYE หรือไม่", type: "boolean" },
      { key: "custom_boss_name", label: "ชื่อบอสการ์ดเพิ่มเติม", type: "text" },
    ],
  },
  matches: {
    name: "matches",
    label: "แมตช์การแข่งขัน (Matches)",
    icon: "⚔️",
    primaryKey: "id",
    columns: [
      { key: "id", label: "ID (UUID)", type: "text" },
      { key: "tournament_id", label: "Tournament ID", type: "text" },
      { key: "round_number", label: "รอบที่ (Round)", type: "number" },
      { key: "table_number", label: "โต๊ะที่ (Table)", type: "number" },
      { key: "player1_id", label: "Player 1 ID", type: "text" },
      { key: "player2_id", label: "Player 2 ID (Null=BYE)", type: "text" },
      { key: "winner_id", label: "Winner ID", type: "text" },
      { key: "is_bye", label: "เป็นรอบ BYE", type: "boolean" },
      { key: "is_double_loss", label: "แพ้ทั้งคู่ (Double Loss)", type: "boolean" },
      {
        key: "status",
        label: "สถานะ",
        type: "select",
        options: ["pending", "completed"],
      },
    ],
  },
  nations: {
    name: "nations",
    label: "สังกัดเนชั่น (Nations)",
    icon: "🛡️",
    primaryKey: "id",
    columns: [
      { key: "id", label: "ID (UUID)", type: "text" },
      { key: "name_en", label: "ชื่ออังกฤษ (Name EN)", type: "text" },
      { key: "name_th", label: "ชื่อไทย (Name TH)", type: "text" },
      { key: "color_code", label: "รหัสสี (#HEX)", type: "text" },
      { key: "logo_url", label: "URL โลโก้", type: "text" },
    ],
  },
  bosses: {
    name: "bosses",
    label: "แวนการ์ดหลัก (Bosses)",
    icon: "👑",
    primaryKey: "id",
    columns: [
      { key: "id", label: "ID (UUID)", type: "text" },
      { key: "nation_id", label: "Nation ID", type: "text" },
      { key: "name_en", label: "ชื่ออังกฤษ (Name EN)", type: "text" },
      { key: "name_th", label: "ชื่อไทย (Name TH)", type: "text" },
      { key: "image_url", label: "URL รูปภาพ", type: "text" },
      { key: "is_active", label: "เปิดใช้งาน (Is Active)", type: "boolean" },
    ],
  },
};

export const SuperAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTable, setActiveTable] = useState<TableName>("tournaments");
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [tableCounts, setTableCounts] = useState<Record<TableName, number>>({
    tournaments: 0,
    players: 0,
    matches: 0,
    nations: 0,
    bosses: 0,
  });

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Record<string, any> | null>(null);
  const [deletingRow, setDeletingRow] = useState<Record<string, any> | null>(null);
  const [jsonRowView, setJsonRowView] = useState<Record<string, any> | null>(null);
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show Toast
  const notifySuccess = (msg: string) => {
    sounds.tick();
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Fetch Table Counts
  const fetchCounts = useCallback(async () => {
    try {
      const counts: Record<TableName, number> = {
        tournaments: 0,
        players: 0,
        matches: 0,
        nations: 0,
        bosses: 0,
      };

      await Promise.all(
        (Object.keys(TABLE_CONFIGS) as TableName[]).map(async (tbl) => {
          const { count } = await supabase
            .from(tbl)
            .select("*", { count: "exact", head: true });
          counts[tbl] = count || 0;
        })
      );
      setTableCounts(counts);
    } catch (e) {
      console.error("Count fetch failed:", e);
    }
  }, []);

  // Fetch Active Table Data
  const fetchTableData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data: rows, error } = await supabase
        .from(activeTable)
        .select("*")
        .order(sortKey || "created_at", { ascending: sortOrder === "asc" });

      if (error) throw error;
      setData(rows || []);
      fetchCounts();
    } catch (err: any) {
      console.error("Fetch error:", err);
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลตาราง");
    } finally {
      setLoading(false);
    }
  }, [activeTable, sortKey, sortOrder, fetchCounts]);

  useEffect(() => {
    setPage(1);
    fetchTableData();
  }, [activeTable, fetchTableData]);

  // Handle Sort
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // Lock Console
  const handleLockConsole = () => {
    sessionStorage.removeItem("cb_superadmin_unlocked");
    navigate("/login");
  };

  // Filtered & Paginated Rows
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase().trim();
    return data.filter((row) =>
      Object.values(row).some((val) =>
        val !== null && val !== undefined && String(val).toLowerCase().includes(q)
      )
    );
  }, [data, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  // Table columns definition
  const currentConfig = TABLE_CONFIGS[activeTable];
  const allColumns = useMemo(() => {
    const definedKeys = currentConfig.columns.map((c) => c.key);
    // Include any dynamic fields from actual rows not in predefined list
    const dynamicKeys = new Set<string>();
    data.slice(0, 10).forEach((row) => {
      Object.keys(row).forEach((k) => {
        if (!definedKeys.includes(k)) dynamicKeys.add(k);
      });
    });
    return [
      ...currentConfig.columns,
      ...Array.from(dynamicKeys).map((k) => ({
        key: k,
        label: k,
        type: "text" as const,
      })),
    ];
  }, [currentConfig, data]);

  // Handle Open Add Modal
  const openAddModal = () => {
    const defaults: Record<string, any> = {};
    currentConfig.columns.forEach((col) => {
      if (col.key === "id") return; // Let database generate UUID
      if (col.type === "number") defaults[col.key] = 0;
      else if (col.type === "boolean") defaults[col.key] = false;
      else if (col.options) defaults[col.key] = col.options[0];
      else defaults[col.key] = "";
    });
    setFormState(defaults);
    setIsAddOpen(true);
  };

  // Handle Open Edit Modal
  const openEditModal = (row: Record<string, any>) => {
    setEditingRow(row);
    setFormState({ ...row });
  };

  // Submit Insert
  const handleInsertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Clean empty string IDs to let DB assign UUID
      const payload: Record<string, any> = { ...formState };
      if (!payload.id) delete payload.id;

      // Type sanitization
      currentConfig.columns.forEach((c) => {
        if (c.type === "number" && payload[c.key] !== undefined && payload[c.key] !== "") {
          payload[c.key] = Number(payload[c.key]);
        } else if (payload[c.key] === "") {
          payload[c.key] = null;
        }
      });

      const { error } = await supabase.from(activeTable).insert([payload]);
      if (error) throw error;

      notifySuccess(`เพิ่มข้อมูลลงใน ${activeTable} เรียบร้อยแล้ว`);
      setIsAddOpen(false);
      fetchTableData();
    } catch (err: any) {
      alert("ไม่สามารถเพิ่มข้อมูลได้: " + (err.message || ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Update
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;
    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = { ...formState };
      delete payload.id; // Do not update primary key

      // Type sanitization
      currentConfig.columns.forEach((c) => {
        if (c.type === "number" && payload[c.key] !== undefined && payload[c.key] !== "") {
          payload[c.key] = Number(payload[c.key]);
        } else if (payload[c.key] === "") {
          payload[c.key] = null;
        }
      });

      const { error } = await supabase
        .from(activeTable)
        .update(payload)
        .eq("id", editingRow.id);

      if (error) throw error;

      notifySuccess(`แก้ไขข้อมูลใน ${activeTable} สำเร็จ`);
      setEditingRow(null);
      fetchTableData();
    } catch (err: any) {
      alert("ไม่สามารถแก้ไขข้อมูลได้: " + (err.message || ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleDeleteRow = async () => {
    if (!deletingRow) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from(activeTable)
        .delete()
        .eq("id", deletingRow.id);

      if (error) throw error;

      notifySuccess(`ลบแถวข้อมูลจาก ${activeTable} เรียบร้อยแล้ว`);
      setDeletingRow(null);
      fetchTableData();
    } catch (err: any) {
      alert("ไม่สามารถลบข้อมูลได้: " + (err.message || ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `supabase_${activeTable}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    sounds.tick();
  };

  return (
    <div className="min-h-screen bg-[#05070c] text-gray-100 flex flex-col font-sans">
      {/* Top Super Admin Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-amber-500/20 bg-[#080d18]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-transparent border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Database className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-wider gold-gradient-text uppercase">
                  Super Admin
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-bold uppercase tracking-wider">
                  Direct DB Studio
                </span>
              </div>
              <span className="text-[11px] text-gray-400 font-mono">
                {user?.email} • สิทธิ์ระดับสูงสุด
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Home className="w-3.5 h-3.5 text-gray-400" />
              <span className="hidden sm:inline">หน้าแรก</span>
            </Link>

            <button
              type="button"
              onClick={handleLockConsole}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="ล็อคหน้าจอ Super Admin"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">ล็อคระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-6 pb-16 flex-1 space-y-6">
        {/* Table Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.08]">
          {(Object.keys(TABLE_CONFIGS) as TableName[]).map((tbl) => {
            const conf = TABLE_CONFIGS[tbl];
            const isSelected = activeTable === tbl;
            const count = tableCounts[tbl];
            return (
              <button
                key={tbl}
                type="button"
                onClick={() => {
                  sounds.tick();
                  setActiveTable(tbl);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.3)] border border-amber-400/40"
                    : "bg-[#0b101c] hover:bg-white/[0.06] text-gray-300 hover:text-white border border-white/[0.06]"
                }`}
              >
                <span>{conf.icon}</span>
                <span>{conf.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isSelected
                      ? "bg-black/30 text-gray-950"
                      : "bg-white/[0.08] text-amber-300"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Header & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#090e18] border border-white/[0.08] shadow-lg">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(52,211,153,0.3)] transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>เพิ่มข้อมูล ({activeTable})</span>
            </button>

            <button
              type="button"
              onClick={fetchTableData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-gray-200 border border-white/10 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors active:scale-95 disabled:opacity-50"
              title="ดึงข้อมูลล่าสุดจาก Supabase"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? "animate-spin" : ""}`} />
              <span>รีเฟรช</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-gray-200 border border-white/10 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors active:scale-95"
              title="ส่งออกเป็นไฟล์ JSON"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>ส่งออก JSON</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder={`ค้นหาในตาราง ${activeTable}...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/60 border border-white/15 focus:border-amber-400 text-white text-xs outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Toast */}
        {successToast && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-bold shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-3 animate-bounce">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Data Table Container */}
        <div className="rounded-3xl bg-[#090e18]/90 border border-white/[0.08] shadow-[0_15px_35px_rgba(0,0,0,0.8)] overflow-hidden sleeve-frame">
          <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#0e1424] text-gray-300 border-b border-white/[0.08] sticky top-0 z-20 backdrop-blur-md">
                <tr>
                  <th className="py-3 px-4 font-bold text-center w-24">การจัดการ</th>
                  {allColumns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="py-3 px-4 font-bold tracking-wider hover:text-amber-300 cursor-pointer select-none transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.label}</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-500" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.04]">
                {loading ? (
                  <tr>
                    <td colSpan={allColumns.length + 1} className="py-16 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                        <span>กำลังโหลดข้อมูลตาราง {activeTable}...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={allColumns.length + 1} className="py-16 text-center text-gray-500">
                      {searchQuery ? "ไม่พบข้อมูลที่ตรงกับคำค้นหา" : "ไม่มีข้อมูลในตารางนี้"}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, idx) => (
                    <tr
                      key={row.id || idx}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Action Buttons Column */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(row)}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all active:scale-95"
                            title="แก้ไขข้อมูลแถวนี้"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setJsonRowView(row)}
                            className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all active:scale-95"
                            title="ดูข้อมูลดิบ (JSON)"
                          >
                            <Code className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingRow(row)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all active:scale-95"
                            title="ลบแถวนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Data Columns */}
                      {allColumns.map((col) => {
                        const val = row[col.key];

                        if (typeof val === "boolean") {
                          return (
                            <td key={col.key} className="py-2.5 px-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  val
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : "bg-white/[0.06] text-gray-400 border border-white/10"
                                }`}
                              >
                                {val ? "TRUE" : "FALSE"}
                              </span>
                            </td>
                          );
                        }

                        if (col.key === "id" || col.key.endsWith("_id")) {
                          return (
                            <td key={col.key} className="py-2.5 px-4 whitespace-nowrap font-mono text-[11px] text-gray-400">
                              {val ? (
                                <span title={String(val)}>
                                  {String(val).slice(0, 8)}...
                                </span>
                              ) : (
                                <span className="text-gray-600">-</span>
                              )}
                            </td>
                          );
                        }

                        return (
                          <td
                            key={col.key}
                            className="py-2.5 px-4 max-w-xs truncate text-gray-200"
                            title={String(val ?? "")}
                          >
                            {val !== null && val !== undefined ? String(val) : <span className="text-gray-600">-</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 bg-[#080d16] border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span>แสดงแถวข้อมูล:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-white text-xs outline-none"
              >
                <option value={15}>15 แถว</option>
                <option value={25}>25 แถว</option>
                <option value={50}>50 แถว</option>
                <option value={100}>100 แถว</option>
              </select>
              <span>จากทั้งหมด {filteredData.length} รายการ</span>
            </div>

            <div className="flex items-center gap-2">
              <span>
                หน้า {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal: เพิ่มข้อมูล (Insert Row) */}
      {isAddOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setIsAddOpen(false);
          }}
        >
          <div className="relative w-full max-w-2xl bg-[#0c121e] border border-white/10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden sleeve-frame flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  เพิ่มข้อมูลใหม่ลงในตาราง: <span className="text-amber-400">{activeTable}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInsertSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentConfig.columns
                  .filter((col) => col.key !== "id")
                  .map((col) => (
                    <div
                      key={col.key}
                      className={col.type === "textarea" ? "sm:col-span-2" : ""}
                    >
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        {col.label}{" "}
                        <span className="text-gray-500 font-mono text-[10px]">({col.key})</span>
                      </label>

                      {col.type === "boolean" ? (
                        <select
                          value={String(formState[col.key] ?? false)}
                          onChange={(e) =>
                            setFormState({ ...formState, [col.key]: e.target.value === "true" })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs outline-none focus:border-amber-400"
                        >
                          <option value="false">FALSE (ปิด)</option>
                          <option value="true">TRUE (เปิด)</option>
                        </select>
                      ) : col.type === "select" && col.options ? (
                        <select
                          value={formState[col.key] ?? col.options[0]}
                          onChange={(e) =>
                            setFormState({ ...formState, [col.key]: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs outline-none focus:border-amber-400"
                        >
                          {col.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : col.type === "textarea" ? (
                        <textarea
                          rows={3}
                          value={formState[col.key] ?? ""}
                          onChange={(e) =>
                            setFormState({ ...formState, [col.key]: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs outline-none focus:border-amber-400 font-mono"
                        />
                      ) : (
                        <input
                          type={col.type === "number" ? "number" : "text"}
                          value={formState[col.key] ?? ""}
                          onChange={(e) =>
                            setFormState({ ...formState, [col.key]: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs outline-none focus:border-amber-400 font-mono"
                        />
                      )}
                    </div>
                  ))}
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/10 text-gray-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: แก้ไขข้อมูล (Edit Row) */}
      {editingRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setEditingRow(null);
          }}
        >
          <div className="relative w-full max-w-2xl bg-[#0c121e] border border-white/10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden sleeve-frame flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  แก้ไขข้อมูล: <span className="text-amber-400 font-mono">{editingRow.id}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allColumns.map((col) => {
                  const isPrimaryKey = col.key === "id";
                  return (
                    <div
                      key={col.key}
                      className={col.type === "textarea" ? "sm:col-span-2" : ""}
                    >
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        {col.label}{" "}
                        <span className="text-gray-500 font-mono text-[10px]">({col.key})</span>
                      </label>

                      {isPrimaryKey ? (
                        <input
                          type="text"
                          readOnly
                          value={formState[col.key] ?? ""}
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-gray-400 text-xs font-mono cursor-not-allowed select-all"
                        />
                      ) : col.type === "boolean" ? (
                        <select
                          value={String(formState[col.key] ?? false)}
                          onChange={(e) =>
                            setFormState({ ...formState, [col.key]: e.target.value === "true" })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs outline-none focus:border-amber-400"
                        >
                          <option value="false">FALSE (ปิด)</option>
                          <option value="true">TRUE (เปิด)</option>
                        </select>
                      ) : col.type === "select" && col.options ? (
                        <select
                          value={formState[col.key] ?? col.options[0]}
                          onChange={(e) =>
                            setFormState({ ...formState, [col.key]: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs outline-none focus:border-amber-400"
                        >
                          {col.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : col.type === "textarea" ? (
                        <textarea
                          rows={3}
                          value={formState[col.key] ?? ""}
                          onChange={(e) =>
                            setFormState({ ...formState, [col.key]: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs outline-none focus:border-amber-400 font-mono"
                        />
                      ) : (
                        <input
                          type={col.type === "number" ? "number" : "text"}
                          value={formState[col.key] ?? ""}
                          onChange={(e) =>
                            setFormState({ ...formState, [col.key]: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs outline-none focus:border-amber-400 font-mono"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/10 text-gray-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "อัปเดตข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: ยืนยันการลบ (Delete Confirm) */}
      {deletingRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setDeletingRow(null);
          }}
        >
          <div className="relative w-full max-w-md bg-[#0c121e] border border-rose-500/30 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] sleeve-frame">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">ยืนยันการลบข้อมูล</h3>
                <span className="text-xs text-rose-300 font-mono">ตาราง: {activeTable}</span>
              </div>
            </div>

            <p className="text-xs text-gray-300 mb-4">
              คุณแน่ใจหรือไม่ว่าต้องการลบแถวข้อมูล ID:{" "}
              <code className="text-amber-300 font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
                {deletingRow.id}
              </code>{" "}
              การกระทำนี้จะลบข้อมูลออกจากฐานข้อมูล Supabase ทันทีและไม่สามารถกู้คืนได้
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setDeletingRow(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/10 text-gray-300"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteRow}
                className="px-5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)] disabled:opacity-50"
              >
                {isSubmitting ? "กำลังลบ..." : "ยืนยันลบถาวร"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: ดูข้อมูลดิบ JSON */}
      {jsonRowView && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setJsonRowView(null);
          }}
        >
          <div className="relative w-full max-w-xl bg-[#0c121e] border border-white/15 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden sleeve-frame flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  JSON Raw Record Viewer: <span className="font-mono text-amber-300">{jsonRowView.id}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setJsonRowView(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              <pre className="p-4 rounded-xl bg-black/80 border border-white/10 text-emerald-300 font-mono text-xs overflow-x-auto">
                {JSON.stringify(jsonRowView, null, 2)}
              </pre>
            </div>

            <div className="p-4 border-t border-white/[0.08] flex justify-end">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(jsonRowView, null, 2));
                  notifySuccess("คัดลอก JSON แล้ว!");
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-xs shadow-md"
              >
                คัดลอก JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
