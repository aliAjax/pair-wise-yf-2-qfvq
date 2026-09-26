import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Armchair, Info } from 'lucide-react';
import { useBenchStore } from '@/store/useBenchStore';
import { calculateComfortScore, getComfortColor } from '@/utils/comfort';
import { useNow } from '@/hooks/useNow';
import { getScheduleStatus } from '@/utils/schedule';
import type { Bench } from '@/types';

export default function MapPage() {
  const { benches, initialize, initialized } = useBenchStore();
  const navigate = useNavigate();
  const now = useNow();
  const [hoveredBench, setHoveredBench] = useState<Bench | null>(null);

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  const getPositionStyle = (bench: Bench) => {
    const latRange = { min: 31.22, max: 31.25 };
    const lngRange = { min: 121.46, max: 121.495 };

    const normalizedLat = (bench.lat - latRange.min) / (latRange.max - latRange.min);
    const normalizedLng = (bench.lng - lngRange.min) / (lngRange.max - lngRange.min);

    return {
      left: `${10 + normalizedLng * 80}%`,
      top: `${85 - normalizedLat * 70}%`,
    };
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-semibold text-deep-brown mb-1">
          地图分布
        </h2>
        <p className="text-ink-light text-sm">
          查看长椅在城市中的分布位置，当前开放的标记会高亮显示
        </p>
      </div>

      <div className="paper-texture rounded-xl shadow-paper overflow-hidden">
        <div className="relative w-full h-[600px] bg-gradient-to-br from-moss-green/5 via-warm-beige to-ochre/5">
          <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6B8E5A" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-32 h-20 rounded-full bg-moss-green/10 blur-xl" />
            <div className="absolute bottom-1/3 right-1/4 w-40 h-24 rounded-full bg-ochre/10 blur-xl" />
            <div className="absolute top-1/2 left-1/2 w-24 h-16 rounded-full bg-moss-green/5 blur-lg" />
          </div>

          {benches.map((bench) => {
            const position = getPositionStyle(bench);
            const comfortScore = calculateComfortScore(bench);
            const colorClass = getComfortColor(comfortScore);
            const { isOpen } = getScheduleStatus(bench, now);
            const markerColor = isOpen ? colorClass : 'text-ink-light/50';

            return (
              <button
                key={bench.id}
                onClick={() => navigate(`/bench/${bench.id}`)}
                onMouseEnter={() => setHoveredBench(bench)}
                onMouseLeave={() => setHoveredBench(null)}
                className="absolute -translate-x-1/2 -translate-y-full group"
                style={position}
              >
                <div className={`relative ${
                  hoveredBench?.id === bench.id ? 'scale-125 z-10' : 'z-0'
                } transition-transform duration-200`}>
                  {isOpen && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="absolute w-8 h-8 rounded-full bg-moss-green/30 animate-ping" />
                    </span>
                  )}
                  <MapPin
                    className={`relative w-8 h-8 ${markerColor} drop-shadow-md group-hover:drop-shadow-lg transition-all ${
                      isOpen ? '' : 'grayscale'
                    }`}
                    fill="currentColor"
                  />
                  <div className="absolute top-1 left-1/2 -translate-x-1/2">
                    <Armchair className="w-3 h-3 text-white" />
                  </div>
                </div>

                {hoveredBench?.id === bench.id && (
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 translate-y-full w-48 paper-texture rounded-lg shadow-paper-hover p-3 z-20 pointer-events-none">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-serif font-medium text-deep-brown text-sm line-clamp-1">
                        {bench.name}
                      </h4>
                      <span
                        className={`flex-shrink-0 ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          isOpen
                            ? 'bg-moss-green/10 text-moss-green'
                            : 'bg-ink-light/10 text-ink-light'
                        }`}
                      >
                        {isOpen ? '开放中' : '已关闭'}
                      </span>
                    </div>
                    <p className="text-xs text-ink-light line-clamp-1 mb-2">
                      {bench.location}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-ink-light">舒适度</span>
                      <span className={`text-sm font-medium ${isOpen ? colorClass : 'text-ink-light'}`}>
                        {comfortScore}
                      </span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}

          <div className="absolute bottom-4 left-4 paper-texture rounded-lg shadow-paper p-3">
            <div className="flex items-center gap-2 text-xs text-ink-light">
              <Info className="w-3.5 h-3.5" />
              <span>点击标记查看详情</span>
            </div>
          </div>

          <div className="absolute top-4 right-4 paper-texture rounded-lg shadow-paper p-3">
            <h4 className="text-xs font-medium text-deep-brown mb-2">图例</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-moss-green opacity-60" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-moss-green" />
                </span>
                <span className="text-xs text-ink-light">当前开放</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-full h-2.5 w-2.5 bg-ink-light/50" />
                <span className="text-xs text-ink-light">当前关闭</span>
              </div>
              <div className="pt-1 mt-1 border-t border-deep-brown/10 space-y-1.5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-moss-green" fill="currentColor" />
                  <span className="text-xs text-ink-light">极佳/优秀</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-ochre" fill="currentColor" />
                  <span className="text-xs text-ink-light">良好</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-ink-light" fill="currentColor" />
                  <span className="text-xs text-ink-light">一般/较差</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-ink-light">
          共 <span className="font-medium text-deep-brown">{benches.length}</span> 张长椅，其中{' '}
          <span className="font-medium text-moss-green">
            {benches.filter((bench) => getScheduleStatus(bench, now).isOpen).length}
          </span>{' '}
          张当前可坐
        </p>
      </div>
    </div>
  );
}
