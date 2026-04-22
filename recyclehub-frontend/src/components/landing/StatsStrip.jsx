import { useEffect, useRef, useState } from 'react';
import { Package, ShieldCheck, TrendingUp, Star } from 'lucide-react';

const STATS = [
  { icon: Package, value: 1200, suffix: '+', label: 'Active Listings' },
  { icon: ShieldCheck, value: 340, suffix: '+', label: 'Verified Sellers' },
  { icon: TrendingUp, value: 5800, suffix: '+', label: 'Tons Traded' },
  { icon: Star, value: 98, suffix: '%', label: 'Satisfaction Rate' },
];

function useCountUp(target, startWhen) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!startWhen) return;
    const duration = 1500;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      setN(Math.round(target * (0.2 + 0.8 * (1 - Math.pow(1 - p, 3)))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, startWhen]);
  return n;
}

export default function StatsStrip() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
      {STATS.map((s, idx) => (
        <StatCard key={s.label} stat={s} visible={visible} delayIdx={idx} />
      ))}
    </div>
  );
}

function StatCard({ stat, visible, delayIdx }) {
  const n = useCountUp(stat.value, visible);
  const Icon = stat.icon;
  return (
    <div
      className="bg-white border border-hub-border rounded-xl p-5 shadow-card hover:border-emerald-200 hover:shadow-card-hover transition-all border-t-[3px] border-t-transparent hover:border-t-emerald-500"
      style={{ animationDelay: `${delayIdx * 80}ms` }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-hub-muted">{stat.label}</span>
        <span className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Icon size={20} />
        </span>
      </div>
      <p className="text-3xl font-extrabold text-emerald-600 tabular-nums">
        {visible ? n : 0}
        {stat.suffix}
      </p>
    </div>
  );
}
