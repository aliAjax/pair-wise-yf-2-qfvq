import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Volume2, Sun, Armchair } from 'lucide-react';
import type { Bench } from '@/types';
import { MATERIAL_LABELS, SHADE_LABELS, NOISE_LABELS, STAY_DURATION_LABELS } from '@/types';
import Rating from '@/components/Rating/Rating';
import ScheduleStatusBadge from '@/components/ScheduleStatusBadge/ScheduleStatusBadge';
import { useNow } from '@/hooks/useNow';
import { calculateComfortScore, getComfortLevel, getComfortColor } from '@/utils/comfort';
import { getScheduleStatus } from '@/utils/schedule';

interface BenchCardProps {
  bench: Bench;
  index?: number;
}

export default function BenchCard({ bench, index = 0 }: BenchCardProps) {
  const navigate = useNavigate();
  const now = useNow();
  const comfortScore = calculateComfortScore(bench);
  const comfortLevel = getComfortLevel(comfortScore);
  const comfortColor = getComfortColor(comfortScore);
  const { isOpen } = getScheduleStatus(bench, now);

  const staggerClass = `stagger-${(index % 6) + 1}`;

  return (
    <div
      onClick={() => navigate(`/bench/${bench.id}`)}
      className={`paper-texture rounded-xl shadow-card card-hover cursor-pointer overflow-hidden fade-in opacity-0 border ${
        isOpen
          ? 'border-moss-green/40 ring-1 ring-moss-green/20'
          : 'border-deep-brown/5 opacity-70 hover:opacity-100'
      } ${staggerClass}`}
    >
      <div
        className={`h-36 bg-gradient-to-br from-warm-cream to-warm-beige relative overflow-hidden ${
          isOpen ? '' : 'grayscale-[40%]'
        }`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            isOpen ? 'bg-moss-green/10' : 'bg-ink-light/10'
          }`}>
            <Armchair className={`w-10 h-10 ${isOpen ? 'text-moss-green/50' : 'text-ink-light/40'}`} />
          </div>
        </div>

        {isOpen && (
          <div className="absolute inset-0 ring-2 ring-inset ring-moss-green/20 rounded-t-xl pointer-events-none" />
        )}

        <div className="absolute top-3 right-3 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-medium">
          <span className={comfortColor}>{comfortLevel}</span>
          <span className="text-ink-light ml-1">{comfortScore}</span>
        </div>

        <div className="absolute top-3 left-3 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs text-ink-light">
          {MATERIAL_LABELS[bench.material]}
        </div>

        <div className="absolute bottom-3 left-3">
          <ScheduleStatusBadge bench={bench} now={now} />
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-serif text-lg font-semibold text-deep-brown mb-1 line-clamp-1">
          {bench.name}
        </h3>

        <div className="flex items-center gap-1 text-ink-light text-sm mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{bench.location}</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-moss-green/10 text-moss-green text-xs rounded-md">
            <Sun className="w-3 h-3" />
            {SHADE_LABELS[bench.shadeLevel]}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-ochre/10 text-ochre text-xs rounded-md">
            <Volume2 className="w-3 h-3" />
            {NOISE_LABELS[bench.noiseLevel]}
          </span>
          {bench.hasBackrest && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-moss-green/10 text-moss-green text-xs rounded-md">
              有靠背
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Rating value={bench.rating} readOnly size="sm" />
          <div className="flex items-center gap-1 text-xs text-ink-light">
            <Clock className="w-3.5 h-3.5" />
            <span>{STAY_DURATION_LABELS[bench.stayDuration]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
