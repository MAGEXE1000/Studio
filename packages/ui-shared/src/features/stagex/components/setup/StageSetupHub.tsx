import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { useT, useIsWebDesktop, useScrollHide } from '@workspace/studio-core';
import { StudioHeader } from '../../../../shared/layout/StudioHeader';
import { useStagexStore, type StagexSubView } from '../../state/useStagexStore';

interface StageSetupHubProps {
  onSelectSubView: (view: StagexSubView) => void;
  isLight?: boolean;
  isAmoled?: boolean;
}

export const StageSetupHub: React.FC<StageSetupHubProps> = ({
  onSelectSubView,
  isLight = false,
  isAmoled = false,
}) => {
  const { riderNeeds, riderChannels, setlist, gear, members } = useStagexStore();
  const t = useT();
  const tr = t as any;
  const isWebDesktop = useIsWebDesktop();

  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollHide(scrollRef);

  const isSpanish = tr.nav?.stagexStage === 'Escenario';

  const title = tr.stagex?.setupTitle || (isSpanish ? 'Configuración' : 'Setup');
  const subtitle =
    tr.stagex?.setupSubtitle ||
    (isSpanish
      ? 'Documentos de producción, rider técnico y listas de canciones'
      : 'Show production documents, technical rider & setlists');

  const totalRiderItems = riderNeeds.length + riderChannels.length;
  const cards = [
    {
      id: 'rider' as StagexSubView,
      title: tr.stagex?.techRiderTitle || (isSpanish ? 'Rider Técnico' : 'Technical Rider'),
      desc:
        tr.stagex?.techRiderDesc ||
        (isSpanish
          ? 'Especificaciones de sonido, energía y hospitalidad para producción'
          : 'Hospitality, sound & power specs for production'),
      icon: 'description',
      badge: isSpanish
        ? `${totalRiderItems} ${totalRiderItems === 1 ? 'elemento' : 'elementos'}`
        : `${totalRiderItems} ${totalRiderItems === 1 ? 'Item' : 'Items'}`,
    },
    {
      id: 'setlist' as StagexSubView,
      title: tr.stagex?.setlistTitle || (isSpanish ? 'Setlist' : 'Setlist'),
      desc:
        tr.stagex?.setlistDesc ||
        (isSpanish
          ? 'Orden de canciones, tiempos y dinámica del show'
          : 'Song order, timing & performance flow'),
      icon: 'format_list_numbered',
      badge: isSpanish
        ? `${setlist.length} ${setlist.length === 1 ? 'canción' : 'canciones'}`
        : `${setlist.length} ${setlist.length === 1 ? 'Song' : 'Songs'}`,
    },
    {
      id: 'gear' as StagexSubView,
      title: tr.stagex?.gearTitle || (isSpanish ? 'Equipamiento' : 'Gear'),
      desc:
        tr.stagex?.gearDesc ||
        (isSpanish
          ? 'Instrumentos, amplificadores y lista de carga'
          : 'Instruments, amps & load-in checklist'),
      icon: 'tune',
      badge: isSpanish
        ? `${gear.length} ${gear.length === 1 ? 'elemento' : 'elementos'}`
        : `${gear.length} ${gear.length === 1 ? 'Item' : 'Items'}`,
    },
    {
      id: 'members' as StagexSubView,
      title: tr.stagex?.bandCrewTitle || (isSpanish ? 'Banda y Equipo' : 'Band & Crew'),
      desc:
        tr.stagex?.bandCrewDesc ||
        (isSpanish ? 'Información de integrantes y equipo técnico' : 'Band and crew information'),
      icon: 'badge',
      badge: isSpanish
        ? `${members.length} ${members.length === 1 ? 'miembro' : 'miembros'}`
        : `${members.length} ${members.length === 1 ? 'Member' : 'Members'}`,
    },
  ];

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: isLight
          ? 'var(--app-bg, #f4f4f5)'
          : isAmoled
            ? '#000000'
            : 'var(--app-bg, #09090b)',
      }}
    >
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar px-0"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 88px)',
          paddingTop: isWebDesktop ? '20px' : '0',
        }}
      >
        <StudioHeader title={title} subtitle={subtitle} />

        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pb-12">
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
                  backgroundColor: isLight
                    ? '#ffffff'
                    : isAmoled
                      ? '#000000'
                      : 'var(--app-surface, #111115)',
                  borderColor: isLight
                    ? 'rgba(0, 0, 0, 0.08)'
                    : isAmoled
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'var(--c-border, rgba(255, 255, 255, 0.08))',
                }}
              >
                {/* Top row: Icon container at upper-left & Chevron at upper-right */}
                <div className="flex items-center justify-between w-full">
                  <div
                    className="w-12 h-12 rounded-[16px] flex items-center justify-center border"
                    style={{
                      backgroundColor: isLight
                        ? 'rgba(0, 0, 0, 0.04)'
                        : isAmoled
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(255, 255, 255, 0.05)',
                      borderColor: isLight
                        ? 'rgba(0, 0, 0, 0.06)'
                        : isAmoled
                          ? 'rgba(255, 255, 255, 0.10)'
                          : 'rgba(255, 255, 255, 0.06)',
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
                      backgroundColor: isLight
                        ? 'rgba(0, 0, 0, 0.04)'
                        : 'rgba(255, 255, 255, 0.06)',
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
      </div>
    </div>
  );
};
