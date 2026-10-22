import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, ChevronDown, X, Check, Sparkles, Plus } from "lucide-react";
import { BossRow } from "../types";

interface DeckBossAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  bosses: BossRow[];
  disabled?: boolean;
  disabledPlaceholder?: string;
  placeholder?: string;
  className?: string;
}

export const DeckBossAutocomplete: React.FC<DeckBossAutocompleteProps> = ({
  value,
  onChange,
  bosses,
  disabled = false,
  disabledPlaceholder = "-- กรุณาเลือกประเทศก่อน --",
  placeholder = "พิมพ์ค้นหา หรือเลือกแวนการ์ดหลัก...",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // If the current value is not in bosses (e.g. custom or legacy), include it
  const effectiveBosses = useMemo(() => {
    if (
      value &&
      !bosses.some((b) => b.name_en.toLowerCase() === value.toLowerCase())
    ) {
      const customBoss: BossRow = {
        id: "custom-" + value,
        nation_id: "",
        name_en: value,
        name_th: null,
        is_active: true,
      };
      return [customBoss, ...bosses];
    }
    return bosses;
  }, [bosses, value]);

  // Find currently selected boss object
  const selectedBoss = useMemo(() => {
    if (!value) return null;
    return (
      effectiveBosses.find(
        (b) => b.name_en.toLowerCase() === value.toLowerCase()
      ) || null
    );
  }, [effectiveBosses, value]);

  // Format label for a boss
  const getBossLabel = (boss: BossRow | null, rawValue: string) => {
    if (!rawValue) return "";
    if (boss) {
      return boss.name_en + (boss.name_th ? ` (${boss.name_th})` : "");
    }
    return rawValue;
  };

  // Filter bosses based on query if user is actively searching
  const filteredBosses = useMemo(() => {
    if (!isSearching || !query.trim()) {
      return effectiveBosses;
    }

    const q = query.trim().toLowerCase();
    return effectiveBosses.filter((b) => {
      const matchEn = b.name_en.toLowerCase().includes(q);
      const matchTh = b.name_th ? b.name_th.toLowerCase().includes(q) : false;
      return matchEn || matchTh;
    });
  }, [effectiveBosses, isSearching, query]);

  // Check if query exactly matches an existing option
  const hasExactMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return effectiveBosses.some(
      (b) =>
        b.name_en.toLowerCase() === q ||
        (b.name_th && b.name_th.toLowerCase() === q)
    );
  }, [effectiveBosses, query]);

  // When value changes from outside, sync input text if not currently searching
  useEffect(() => {
    if (!isSearching) {
      setQuery(getBossLabel(selectedBoss, value));
    }
  }, [value, selectedBoss, isSearching]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setIsSearching(false);
        setQuery(getBossLabel(selectedBoss, value));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedBoss, value]);

  // Reset highlight index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredBosses.length]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.children[
        highlightedIndex
      ] as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (bossNameEn: string) => {
    onChange(bossNameEn);
    setIsSearching(false);
    setIsOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange("");
    setQuery("");
    setIsSearching(false);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
    }

    const showCustomOption = isSearching && !hasExactMatch && query.trim();
    const totalItems = filteredBosses.length + (showCustomOption ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % Math.max(1, totalItems));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev <= 0 ? Math.max(0, totalItems - 1) : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!isOpen) return;

      if (highlightedIndex < filteredBosses.length) {
        const item = filteredBosses[highlightedIndex];
        if (item) handleSelect(item.name_en);
      } else if (showCustomOption) {
        handleSelect(query.trim());
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setIsSearching(false);
      setQuery(getBossLabel(selectedBoss, value));
    }
  };

  const showCustomOption = isSearching && !hasExactMatch && query.trim();

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input container */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />

        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          placeholder={disabled ? disabledPlaceholder : placeholder}
          onFocus={(e) => {
            if (!disabled) {
              setIsOpen(true);
              e.target.select();
            }
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsSearching(true);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full pl-9 pr-16 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500 shadow-inner transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            isOpen ? "border-amber-500/60 ring-1 ring-amber-500/30" : ""
          }`}
        />

        {/* Action icons inside input */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="ล้างค่า"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              if (isOpen) {
                setIsOpen(false);
                setIsSearching(false);
                setQuery(getBossLabel(selectedBoss, value));
              } else {
                setIsOpen(true);
                inputRef.current?.focus();
              }
            }}
            className="p-1 rounded-md text-gray-400 hover:text-white transition-colors disabled:opacity-40"
            title="เปิด/ปิด รายการ"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? "rotate-180 text-amber-400" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 mt-1.5 z-50 bg-[#0d131f] border border-amber-500/25 rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header count info */}
          <div className="px-3.5 py-2 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between text-[11px] text-gray-400">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400/80" />
              <span>
                {filteredBosses.length > 0 ? (
                  <span>
                    พบ{" "}
                    <span className="text-amber-400 font-bold">
                      {filteredBosses.length}
                    </span>{" "}
                    แวนการ์ดหลัก
                  </span>
                ) : (
                  <span>ไม่พบข้อมูลที่ตรงกับคำค้นหา</span>
                )}
              </span>
            </div>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-amber-400/80 hover:text-amber-300 hover:underline"
              >
                ล้างการเลือก
              </button>
            )}
          </div>

          <ul
            ref={listRef}
            className="max-h-60 overflow-y-auto divide-y divide-white/[0.03] py-1 text-sm focus:outline-none"
            role="listbox"
          >
            {filteredBosses.map((boss, idx) => {
              const isSelected = Boolean(
                value && boss.name_en.toLowerCase() === value.toLowerCase()
              );
              const isHighlighted = idx === highlightedIndex;

              return (
                <li
                  key={boss.id}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => handleSelect(boss.name_en)}
                  className={`px-3.5 py-2 cursor-pointer flex items-center justify-between gap-2 transition-all ${
                    isHighlighted
                      ? "bg-amber-500/20 text-white pl-4"
                      : isSelected
                      ? "bg-amber-500/10 text-amber-200"
                      : "text-gray-200 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span
                      className={`font-medium truncate ${
                        isSelected ? "text-amber-300 font-semibold" : ""
                      }`}
                    >
                      {boss.name_en}
                    </span>
                    {boss.name_th && (
                      <span className="text-xs text-amber-400/70 truncate">
                        {boss.name_th}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <span className="flex items-center gap-1 text-xs text-amber-400 font-medium shrink-0 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                      <Check className="w-3.5 h-3.5" />
                      เลือกอยู่
                    </span>
                  )}
                </li>
              );
            })}

            {/* Custom option when query has no exact match */}
            {showCustomOption && (
              <li
                role="option"
                onMouseEnter={() => setHighlightedIndex(filteredBosses.length)}
                onClick={() => handleSelect(query.trim())}
                className={`px-3.5 py-2.5 cursor-pointer flex items-center gap-2 border-t border-amber-500/20 text-amber-300 text-xs transition-all ${
                  highlightedIndex === filteredBosses.length
                    ? "bg-amber-500/25 pl-4"
                    : "hover:bg-amber-500/10"
                }`}
              >
                <Plus className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span className="truncate">
                  ใช้ชื่อนี้:{" "}
                  <strong className="text-white font-semibold">
                    "{query.trim()}"
                  </strong>
                </span>
              </li>
            )}

            {filteredBosses.length === 0 && !showCustomOption && (
              <li className="px-3.5 py-4 text-center text-xs text-gray-400">
                ไม่มีข้อมูลแวนการ์ดหลัก
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
