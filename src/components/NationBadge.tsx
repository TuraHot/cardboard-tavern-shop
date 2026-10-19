import React, { useState, useEffect } from 'react';
import { getNationConfig, hexToRgba } from '../utils/nations';
import { getBossThaiName } from '../utils/bosses';

interface NationBadgeProps {
  nation: string;
  deckBoss?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showDeckBoss?: boolean;
}

export const NationBadge: React.FC<NationBadgeProps> = ({
  nation,
  deckBoss,
  size = 'md',
  showDeckBoss = true,
}) => {
  const config = getNationConfig(nation);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [config.iconUrl]);

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

  const thaiBoss = deckBoss ? getBossThaiName(deckBoss) : '';

  return (
    <div className="inline-flex items-center flex-wrap gap-1.5">
      <span
        style={badgeStyle}
        className={`inline-flex items-center font-semibold rounded-md border tracking-wide transition-all backdrop-blur-md ${config.badgeClass} ${sizeClasses}`}
        title={`${config.name} (${config.thaiName})`}
      >
        {config.iconUrl && !imgError ? (
          <img
            src={config.iconUrl}
            alt={config.name}
            className={`${iconSizes} object-contain shrink-0`}
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-xs opacity-90">{config.iconSymbol}</span>
        )}
        <span>{config.name}</span>
      </span>

      {showDeckBoss && deckBoss && (
        <span
          className={`text-[11px] px-2.5 py-0.5 rounded-md bg-black/40 border border-white/10 text-amber-200/90 font-mono flex items-center gap-1 shadow-inner ${config.badgeClass} ${sizeClasses}`}
          title={thaiBoss && thaiBoss !== deckBoss ? `${deckBoss} (${thaiBoss})` : deckBoss}
        >
          <span className="tracking-tight">{thaiBoss}</span>
        </span>
      )}
    </div>
  );
};
