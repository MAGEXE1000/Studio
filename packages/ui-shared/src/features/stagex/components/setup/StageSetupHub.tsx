import React from 'react';
import { motion } from 'motion/react';
import { useStagexStore, type StagexSubView } from '../../state/useStagexStore';

interface StageSetupHubProps {
  onSelectSubView: (view: StagexSubView) => void;
  isLight?: boolean;
}

export const StageSetupHub: React.FC<StageSetupHubProps> = ({
  onSelectSubView,
  isLight = false,
}) => {
  const { riderNeeds, riderChannels, setlist, gear, members } = useStagexStore();

  const cards = [
    {
      id: 'rider' as StagexSubView,
      title: 'Technical Rider',
      desc: 'Hospitality, sound & power specs for production',
      icon: 'description',
      badge: `${riderNeeds.length + riderChannels.length} Items`,
    },
    {
      id: 'setlist' as StagexSubView,
      title: 'Setlist',
      desc: 'Song order, timing & performance flow',
      icon: 'format_list_numbered',
      badge: `${setlist.length} Songs`,
    },
    {
      id: 'gear' as StagexSubView,
      title: 'Gear',
      desc: 'Instruments, amps & load-in checklist',
      icon: 'tune',
      badge: `${gear.length} Items`,
    },
    {
      id: 'members' as StagexSubView,
      title: 'Members',
      desc: 'Band and crew information',
      icon: 'badge',
      badge: members.length > 0 ? `${members.length} Members` : '0 Members',
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-32">
      <div className="flex flex-col gap-4">
        {cards.map((card) => (
          <motion.button
            key={card.id}
            data-testid={`setup-card-${card.id}`}
            onClick={() => onSelectSubView(card.id)}
            whileTap={{ scale: 0.988 }}
            whileHover={{ y: -1 }}
            className="w-full text-left p-5 sm:p-6 rounded-[22px] border transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: isLight ? '#ffffff' : 'var(--c-bg-card, #0a0a0c)',
              borderColor: isLight
                ? 'rgba(0, 0, 0, 0.08)'
                : 'var(--c-border, rgba(255, 255, 255, 0.08))',
            }}
          >
            {/* Top row: Icon container at upper-left & Chevron at upper-right */}
            <div className="flex items-center justify-between w-full">
              <div
                className="w-12 h-12 rounded-[16px] flex items-center justify-center border"
                style={{
                  backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
                  borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
                }}
              >
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={{
                    color: isLight ? 'var(--c-text-primary, #09090b)' : '#ffffff',
                  }}
                >
                  {card.icon}
                </span>
              </div>
              <span
                className="material-symbols-outlined text-[22px]"
                style={{
                  color: isLight ? '#a1a1aa' : 'rgba(255, 255, 255, 0.35)',
                }}
              >
                chevron_right
              </span>
            </div>

            {/* Middle row: Large Section Title & Muted Description */}
            <div className="mt-5 mb-5">
              <h3
                className="text-[20px] font-bold tracking-tight"
                style={{
                  color: isLight ? 'var(--c-text-primary, #09090b)' : '#ffffff',
                  fontFamily: 'Manrope, sans-serif',
                  lineHeight: 1.25,
                  margin: 0,
                }}
              >
                {card.title}
              </h3>
              <p
                className="text-[13px] font-normal leading-relaxed mt-1"
                style={{
                  color: isLight ? 'var(--c-text-secondary, #71717a)' : '#a1a1aa',
                  margin: '4px 0 0 0',
                }}
              >
                {card.desc}
              </p>
            </div>

            {/* Bottom row: Item Count / Status Badge */}
            <div className="flex items-center">
              <span
                className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border"
                style={{
                  backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
                  borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
                  color: isLight ? 'var(--c-text-secondary, #71717a)' : '#d4d4d8',
                }}
              >
                {card.badge}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
