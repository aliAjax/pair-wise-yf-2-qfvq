import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Volume2, Sun, Armchair } from 'lucide-react';
import type { Bench } from '@/types';
import { MATERIAL_LABELS, SHADE_LABELS, NOISE_LABELS, STAY_DURATION_LABELS } from '@/types';
import Rating from '@/components/Rating/Rating';
import { calculateComfortScore, getComfortLevel, getComfortColor } from '@/utils/comfort';
import { getOpenStatus, formatNextOpen, formatTime } from '@/utils/openHours';
import { useNow } from '@/hooks/useNow';

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
  const openStatus = getOpenStatus(bench, now);

  const staggerClass = `stagger-${(index % 6) + 1}`;

  return (
    <div
      onClick={() => navigate(`/bench/${bench.id}`)}
      className={`paper-texture rounded-xl shadow-card card-hover cursor-pointer overflow-hidden fade-in opacity-0 ${staggerClass} ${
        openStatus.isOpen ? '' : 'grayscale-[0.4] opacity-75'
      }`}
    >
      <div className="h-36 bg-gradient-to-br from-warm-cream to-warm-beige relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-moss-green/10 flex items-center justify-center">
            <Armchair className="w-10 h-10 text-moss-green/50" />
          </div>
        </div>

        <div className="absolute top-3 right-3 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-medium">
          <span className={comfortColor}>{comfortLevel}</span>
          <span className="text-ink-light ml-1">{comfortScore}</span>
        </div>

        <div className="absolute top-3 left-3 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs text-ink-light">
          {MATERIAL_LABELS[bench.material]}
        </div>

        <div
          className={`absolute bottom-3 left-3 px-2 py-1 backdrop-blur-sm rounded-full text-xs font-medium ${
            openStatus.isOpen
              ? 'bg-moss-green/90 text-white'
              : 'bg-ink-light/80 text-white'
          }`}
        >
          {openStatus.isOpen ? '开放中' : '已关闭'}
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

        {!openStatus.isAllDay && (
          <div className={`flex items-center gap-1 text-xs mb-3 ${
            openStatus.isOpen ? 'text-moss-green' : 'text-ink-light'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>
              {openStatus.isOpen
                ? openStatus.closesAt
                  ? `现在可坐，开放至 ${formatTime(openStatus.closesAt)}`
                  : '现在可坐'
                : openStatus.nextOpen
                  ? `现在已关闭，${formatNextOpen(openStatus.nextOpen, now)}开放`
                  : '现在已关闭'}
            </span>
          </div>
        )}

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
