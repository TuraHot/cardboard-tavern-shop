import React, { useState } from "react";
import { X, Plus, Trash2, Shield } from "lucide-react";
import { supabase } from "../lib/supabase";
import { NationRow, BossRow } from "../types";

interface BossManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  nations: NationRow[];
  bosses: BossRow[];
  onRefresh: () => void;
}

export const BossManagerModal: React.FC<BossManagerModalProps> = ({
  isOpen,
  onClose,
  nations,
  bosses,
  onRefresh,
}) => {
  const [selectedNationId, setSelectedNationId] = useState<string>(
    nations[0]?.id || ""
  );
  const [nameEn, setNameEn] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const currentNationId = selectedNationId || nations[0]?.id || "";
  const filteredBosses = bosses.filter((b) => b.nation_id === currentNationId);

  const handleAddBoss = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentNationId || !nameEn.trim()) return;
    setLoading(true);

    const { error } = await supabase.from("bosses").insert([
      {
        nation_id: currentNationId,
        name_en: nameEn.trim(),
        name_th: nameTh.trim() || null,
      },
    ]);

    setLoading(false);
    if (!error) {
      setNameEn("");
      setNameTh("");
      onRefresh();
    } else {
      alert("เกิดข้อผิดพลาดในการเพิ่มแวนการ์ดหลัก: " + error.message);
    }
  };

  const handleDeleteBoss = async (id: string) => {
    const { error } = await supabase.from("bosses").delete().eq("id", id);
    if (!error) onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              จัดการฐานข้อมูลแวนการ์ดหลัก
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form เพิ่มแวนการ์ดหลักใหม่ */}
        <form onSubmit={handleAddBoss} className="space-y-3 mb-5">
          <div>
            <label className="block text-xs text-gray-300 mb-1">
              เลือกเนชั่น
            </label>
            <select
              value={currentNationId}
              onChange={(e) => setSelectedNationId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#070a12] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
            >
              {nations.map((n) => (
                <option key={n.id} value={n.id} className="bg-gray-900">
                  {n.name_en} ({n.name_th})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              required
              placeholder="ชื่อแวนการ์ดหลัก (EN) เช่น Nirvana"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#070a12] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
            />
            <input
              type="text"
              placeholder="ชื่อเรียกไทย เช่น เนอร์วานา (ไม่บังคับ)"
              value={nameTh}
              onChange={(e) => setNameTh(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#070a12] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มแวนการ์ดหลักเข้าเนชั่นนี้</span>
          </button>
        </form>

        {/* รายชื่อแวนการ์ดหลักในเนชั่นที่เลือก */}
        <div className="border-t border-white/10 pt-3">
          <p className="text-xs text-gray-400 mb-2">
            รายชื่อแวนการ์ดหลักในเนชั่นนี้ ({filteredBosses.length} เด็ค)
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {filteredBosses.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">
                ยังไม่มีข้อมูลแวนการ์ดหลักในเนชั่นนี้ กดเพิ่มด้านบนได้เลย
              </p>
            ) : (
              filteredBosses.map((boss) => (
                <div
                  key={boss.id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-xs"
                >
                  <div>
                    <span className="font-bold text-white">{boss.name_en}</span>
                    {boss.name_th && (
                      <span className="text-gray-400 ml-1.5">
                        ({boss.name_th})
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteBoss(boss.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                    title="ลบแวนการ์ดหลัก"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};