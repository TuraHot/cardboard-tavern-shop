import React from 'react';
import { getNationConfig } from '../utils/nations';

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

  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1.5',
    md: 'text-xs px-3 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  return (
    <div className="inline-flex items-center flex-wrap gap-1.5">
      <span
        className={`inline-flex items-center font-semibold rounded-md border tracking-wide transition-all backdrop-blur-md ${config.badgeClass} ${sizeClasses}`}
        title={`${config.name} (${config.thaiName})`}
      >
        <span className="text-xs opacity-90">{config.iconSymbol}</span>
        <span>{config.thaiName}</span>
      </span>

      {showDeckBoss && deckBoss && (
        <span className={`text-[11px] px-2.5 py-0.5 rounded-md bg-black/40 border border-white/10 text-amber-200/90 font-mono flex items-center gap-1 shadow-inner ${config.badgeClass} ${sizeClasses}`}>
          <span className="tracking-tight">{deckBoss}</span>
        </span>
      )}
    </div>
  );
};
