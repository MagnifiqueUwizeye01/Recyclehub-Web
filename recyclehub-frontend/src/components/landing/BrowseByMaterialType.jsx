import { useNavigate } from 'react-router-dom';
import { Grid, Settings, Scissors, Cpu, Recycle, FileText, Wind, Factory } from 'lucide-react';

const TYPES = [
  { name: 'All Materials', value: null, icon: Grid },
  { name: 'Metal & Alloys', value: 'Metal', icon: Settings },
  { name: 'Textile', value: 'Textile', icon: Scissors },
  { name: 'Electronics', value: 'Electronics', icon: Cpu },
  { name: 'Plastic', value: 'Plastic', icon: Recycle },
  { name: 'Paper', value: 'Paper', icon: FileText },
  { name: 'Glass', value: 'Glass', icon: Wind },
  { name: 'Other Industrial', value: 'Other', icon: Factory },
];

export default function BrowseByMaterialType() {
  const navigate = useNavigate();

  return (
    <section className="mb-14">
      <div className="section-label">Categories</div>
      <h2 className="section-heading">Browse By Material Type</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {TYPES.map(({ name, value, icon: Icon }) => (
          <button
            key={name}
            type="button"
            onClick={() =>
              navigate(value ? `/?type=${encodeURIComponent(value)}` : '/')
            }
            className="group flex flex-col items-center justify-center min-w-[110px] h-[110px] rounded-xl border border-hub-border bg-white hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all shadow-card"
          >
            <Icon
              size={28}
              className="mb-2 text-emerald-600 group-hover:text-white"
              strokeWidth={1.75}
            />
            <span className="text-xs font-semibold text-center px-1 leading-tight text-hub-text group-hover:text-white">
              {name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
