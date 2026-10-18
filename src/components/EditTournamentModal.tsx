import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Tournament, TournamentFormat } from '../types';
import { compressImage } from '../utils/compressImage';
import {
  Shield,
  Upload,
  Trash2,
  Loader2,
  X,
  Save,
  Calendar,
  DollarSign,
  Users,
  Clock,
  MapPin,
  Store,
  Layers,
} from 'lucide-react';

interface EditTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament | null;
  onSaved: (updated: Tournament) => void;
}

export const EditTournamentModal: React.FC<EditTournamentModalProps> = ({
  isOpen,
  onClose,
  tournament,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [format, setFormat] = useState<TournamentFormat>('Standard TH');
  const [eventDate, setEventDate] = useState('');
  const [entryFee, setEntryFee] = useState<number>(70);
  const [maxPlayers, setMaxPlayers] = useState<number>(20);
  const [maxRounds, setMaxRounds] = useState<number>(4);
  const [roundDuration, setRoundDuration] = useState<number>(30);
  const [storeName, setStoreName] = useState('Cardboard Tavern');
  const [location, setLocation] = useState('Lotus หลักสี่ ชั้น 2 (BTS วัดพระศรี)');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('/images/vanguard_banner_1.jpg');

  // Banner image upload state
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressing, setCompressing] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tournament && isOpen) {
      setName(tournament.name || '');
      setFormat(tournament.format || 'Standard TH');
      setEventDate(tournament.event_date ? tournament.event_date.substring(0, 16) : '');
      setEntryFee(tournament.entry_fee ?? 70);
      setMaxPlayers(tournament.max_players ?? 20);
      setMaxRounds(tournament.max_rounds ?? 4);
      setRoundDuration(tournament.round_duration_minutes ?? 30);
      setStoreName(tournament.store_name || 'Cardboard Tavern');
      setLocation(tournament.location || 'Lotus หลักสี่ ชั้น 2 (BTS วัดพระศรี)');
      setDescription(tournament.description || '');
      setBannerUrl(tournament.banner_url || '/images/vanguard_banner_1.jpg');
      setBannerFile(null);
      setBannerPreview(null);
      setCompressedBlob(null);
    }
  }, [tournament, isOpen]);

  if (!isOpen || !tournament) return null;

  const handleFileChange = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WebP) เท่านั้นครับ');
      return;
    }

    setCompressing(true);
    try {
      const { blob } = await compressImage(file, 1200, 1200, 0.82);
      const previewUrl = URL.createObjectURL(blob);
      setBannerFile(file);
      setCompressedBlob(blob);
      setBannerPreview(previewUrl);
    } catch (err: any) {
      console.error('Compression error:', err);
      alert('ไม่สามารถบีบอัดรูปภาพได้: ' + (err.message || ''));
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament) return;

    try {
      setSubmitting(true);

      let finalBannerUrl = bannerUrl;

      // If user uploaded a new image, upload to Supabase Storage bucket 'banners'
      if (compressedBlob) {
        try {
          const fileName = `banner_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('banners')
            .upload(fileName, compressedBlob, {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (!uploadErr && uploadData) {
            const { data: urlData } = supabase.storage.from('banners').getPublicUrl(fileName);
            if (urlData?.publicUrl) {
              finalBannerUrl = urlData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn('Storage upload error (fallback to previous banner):', storageErr);
        }
      }

      const updatePayload = {
        name: name.trim(),
        format,
        event_date: eventDate ? new Date(eventDate).toISOString() : tournament.event_date,
        entry_fee: Number(entryFee),
        max_players: Number(maxPlayers),
        max_rounds: Number(maxRounds),
        round_duration_minutes: Number(roundDuration),
        store_name: storeName.trim(),
        location: location.trim(),
        description: description.trim(),
        banner_url: finalBannerUrl,
      };

      const { data, error } = await supabase
        .from('tournaments')
        .update(updatePayload)
        .eq('id', tournament.id)
        .select()
        .single();

      if (error) throw error;

      onSaved(data as Tournament);
      onClose();
    } catch (err: any) {
      console.error('Error updating tournament:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const displayBanner = bannerPreview || bannerUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-fade-in">
      <div className="bg-[#0e1422] border border-white/[0.12] w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl tcg-card overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0e1422] flex-shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span>แก้ไขข้อมูลการแข่งขัน</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Tournament Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                ชื่อการแข่งขัน<span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น แข่งแวนการ์ด D TH วันเสาร์"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
              />
            </div>

            {/* Format & Event Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                  รูปแบบการแข่งขัน<span className="text-amber-400">*</span>
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as TournamentFormat)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="Standard TH">Standard (TH) - การ์ดไทย</option>
                  <option value="Standard JP">Standard (JP) - การ์ดญี่ปุ่น</option>
                  <option value="Premium TH">Premium (TH) - การ์ดไทย</option>
                  <option value="V-Premium">V-Premium</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>วันและเวลาเริ่มแข่งขัน<span className="text-amber-400">*</span></span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Entry Fee & Max Players */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  <span>ค่าสมัคร (บาท)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  required
                  value={entryFee}
                  onChange={(e) => setEntryFee(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>จำนวนผู้เล่นสูงสุด (คน)</span>
                </label>
                <input
                  type="number"
                  min="4"
                  max="128"
                  required
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            {/* Max Rounds & Round Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>จำนวนรอบแข่งขันสูงสุด (Rounds)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={maxRounds}
                  onChange={(e) => setMaxRounds(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>เวลาต่อรอบ (นาที)</span>
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  required
                  value={roundDuration}
                  onChange={(e) => setRoundDuration(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            {/* Store Name & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-amber-400" />
                  <span>ชื่อร้าน</span>
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>สถานที่แข่งขัน</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Description & Prizes */}
            <div>
              <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                ของรางวัลและรายละเอียดการแข่งขัน
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ระบุของรางวัลและกติกาเพิ่มเติม..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-xs leading-relaxed focus:outline-none focus:border-amber-500 resize-y"
              />
            </div>

            {/* Banner Poster Upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-200 mb-1.5 flex items-center justify-between">
                <span>รูปภาพโปสเตอร์การแข่งขัน</span>
                <span className="text-[11px] text-gray-400 font-normal">
                  (ระบบจะบีบอัดภาพให้อัตโนมัติ)
                </span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChange(file);
                }}
              />

              <div className="relative rounded-2xl border border-white/10 overflow-hidden bg-black/60 group">
                <div className="relative aspect-[16/7] w-full overflow-hidden">
                  <img
                    src={displayBanner}
                    alt="Preview"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Actions overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={compressing || submitting}
                      className="px-3.5 py-2 rounded-xl bg-black/80 hover:bg-black text-white text-xs font-semibold border border-white/20 flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>{compressing ? 'กำลังบีบอัด...' : 'เปลี่ยนรูปภาพ'}</span>
                    </button>

                    {bannerPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setBannerFile(null);
                          setCompressedBlob(null);
                          setBannerPreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="px-3 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 shadow-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ยกเลิกรูปใหม่</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-2.5 bg-[#070a12] border-t border-white/[0.08] flex items-center justify-between text-xs text-gray-400">
                  <span className="truncate max-w-[320px] text-gray-300 font-medium">
                    📁 {bannerFile ? bannerFile.name : 'โปสเตอร์ปัจจุบัน'}
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-amber-400 hover:text-amber-300 text-xs font-semibold"
                  >
                    เลือกรูปภาพใหม่
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                disabled={submitting}
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-gray-300 text-sm font-medium transition-colors"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                disabled={submitting || compressing}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 text-sm font-black shadow-md transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>บันทึกการแก้ไข</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
