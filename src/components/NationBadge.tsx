import React, { useState, useEffect } from 'react';
import { getNationConfig, hexToRgba } from '../utils/nations';
import { getBossThaiName, getBossEnName, isJpFormat } from '../utils/bosses';

interface NationBadgeProps {
  nation: string;
  deckBoss?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showDeckBoss?: boolean;
  format?: string | null;
}

export const NationBadge: React.FC<NationBadgeProps> = ({
  nation,
  deckBoss,
  size = 'md',
  showDeckBoss = true,
  format,
}) => {
  const config = getNationConfig(nation);
  const [currentImgSrc, setCurrentImgSrc] = useState<string | undefined>(
    config.iconUrl || config.fallbackIconUrl
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentImgSrc(config.iconUrl || config.fallbackIconUrl);
    setHasError(false);
  }, [config.iconUrl, config.fallbackIconUrl]);

  const handleImgError = () => {
    if (currentImgSrc !== config.fallbackIconUrl && config.fallbackIconUrl) {
      setCurrentImgSrc(config.fallbackIconUrl);
    } else {
      setHasError(true);
    }
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1.5',
    md: 'text-xs px-3 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  const badgeStyle: React.CSSProperties = config.colorCode
    ? {
        backgroundColor: hexToRgba(config.colorCode, 0.2),
        borderColor: hexToRgba(config.colorCode, 0.4),
        boxShadow: `0 0 12px ${hexToRgba(config.colorCode, 0.2)}`,
      }
    : {};

  const isJP = isJpFormat(format);
  const nationDisplayName = isJP ? config.name : (config.thaiName || config.name);
  const bossDisplayName = deckBoss
    ? isJP
      ? getBossEnName(deckBoss) || deckBoss
      : getBossThaiName(deckBoss) || deckBoss
    : '';

  const secondaryBoss = deckBoss
    ? isJP
      ? getBossThaiName(deckBoss)
      : getBossEnName(deckBoss)
    : '';

  if (!nation && !deckBoss) {
    return <span className="text-xs text-gray-500 font-light">-</span>;
  }

  if (!nation) {
    return (
      <span
        className={`text-[11px] px-2.5 py-0.5 rounded-md bg-black/40 border border-white/10 text-amber-200/90 font-mono flex items-center gap-1 shadow-inner ${sizeClasses}`}
        title={secondaryBoss && secondaryBoss !== bossDisplayName ? `${bossDisplayName} (${secondaryBoss})` : bossDisplayName || undefined}
      >
        <span className="tracking-tight">{bossDisplayName}</span>
      </span>
    );
  }

  return (
    <div className="inline-flex items-center flex-wrap gap-1.5">
      <span
        style={badgeStyle}
        className={`inline-flex items-center font-semibold rounded-md border tracking-wide transition-all backdrop-blur-md ${config.badgeClass} ${sizeClasses}`}
        title={isJP ? `${config.name} (${config.thaiName})` : `${config.thaiName} (${config.name})`}
      >
        {currentImgSrc && !hasError ? (
          <img
            src={currentImgSrc}
            alt={config.name}
            className={`${iconSizes} object-contain shrink-0`}
            loading="eager"
            onError={handleImgError}
          />
        ) : (
          <span className="text-xs opacity-90">{config.iconSymbol}</span>
        )}
        <span>{nationDisplayName}</span>
      </span>

      {showDeckBoss && deckBoss && (
        <span
          className={`text-[11px] px-2.5 py-0.5 rounded-md bg-black/40 border border-white/10 text-amber-200/90 font-mono flex items-center gap-1 shadow-inner ${config.badgeClass} ${sizeClasses}`}
          title={secondaryBoss && secondaryBoss !== bossDisplayName ? `${bossDisplayName} (${secondaryBoss})` : bossDisplayName}
        >
          <span className="tracking-tight">{bossDisplayName}</span>
        </span>
      )}
    </div>
  );
};
