import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useStagexStore, type StagexSubView } from '../../state/useStagexStore';

interface StageSetupHubProps {
  onSelectSubView: (view: StagexSubView) => void;
}

export const StageSetupHub: React.FC<StageSetupHubProps> = ({ onSelectSubView }) => {
  const { riderNeeds, riderChannels, setlist, gear, members } = useStagexStore();

  const totalDuration = useMemo(() => {
    let totalSecs = 0;
    for (const song of setlist) {
      if (!song.duration) continue;
      const parts = song.duration.split(':').map((p) => parseInt(p, 10));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        totalSecs += parts[0] * 60 + parts[1];
      }
    }
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, [setlist]);

  const cards = [
    {
      id: 'rider' as StagexSubView,
      title: 'Technical Rider',
      desc: 'Hospitality, sound & power specs for production',
      icon: 'description',
      iconBg: 'rgba(59, 130, 246, 0.15)',
      iconColor: '#60a5fa',
      stat: `${riderNeeds.length + riderChannels.length} items`,
    },
    {
      id: 'setlist' as StagexSubView,
      title: 'Setlist',
      desc: 'Show order, cues, BPM & calculated timings',
      icon: 'queue_music',
      iconBg: 'rgba(168, 85, 247, 0.15)',
      iconColor: '#c084fc',
      stat: `${setlist.length} songs ${setlist.length > 0 ? `• ${totalDuration}` : ''}`,
    },
    {
      id: 'gear' as StagexSubView,
      title: 'Gear Inventory',
      desc: 'Instruments, amps, microphones & DI boxes',
      icon: 'inventory_2',
      iconBg: 'rgba(234, 179, 8, 0.15)',
      iconColor: '#facc15',
      stat: `${gear.length} pieces`,
    },
    {
      id: 'members' as StagexSubView,
      title: 'Band & Crew',
      desc: 'Performer roles, color badges & contacts',
      icon: 'groups',
      iconBg: 'rgba(34, 197, 94, 0.15)',
      iconColor: '#4ade80',
      stat: `${members.length}/8 members`,
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card) => (
          <motion.button
            key={card.id}
            data-testid={`setup-card-${card.id}`}
            onClick={() => onSelectSubView(card.id)}
            whileTap={{ scale: 0.985 }}
            whileHover={{ y: -2 }}
            className="flex flex-col text-left p-5 rounded-2xl border transition-all duration-200"
            style={{
              backgroundColor: 'var(--c-bg-card, rgba(24, 24, 27, 0.75))',
              borderColor: 'var(--c-border, rgba(255, 255, 255, 0.08))',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: card.iconBg }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: card.iconColor, fontSize: 22 }}
                >
                  {card.icon}
                </span>
              </div>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: 'var(--c-text-secondary, #a1a1aa)',
                }}
              >
                {card.stat}
              </span>
            </div>

            <h3
              className="text-base font-bold tracking-tight mb-1"
              style={{ color: 'var(--c-text-primary, #ffffff)', fontFamily: 'Manrope, sans-serif' }}
            >
              {card.title}
            </h3>
            <p
              className="text-xs font-medium leading-relaxed"
              style={{ color: 'var(--c-text-secondary, #a1a1aa)' }}
            >
              {card.desc}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
