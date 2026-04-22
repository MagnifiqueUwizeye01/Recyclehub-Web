import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutGrid,
  Settings,
  Scissors,
  Cpu,
  Recycle,
  FileText,
  Wind,
  Factory,
} from 'lucide-react';

const ITEMS = [
  { label: 'All Materials', value: null, icon: LayoutGrid },
  { label: 'Metal & Alloys', value: 'Metal', icon: Settings },
  { label: 'Textile & Fabric', value: 'Textile', icon: Scissors },
  { label: 'Electronics & E-Waste', value: 'Electronics', icon: Cpu },
  { label: 'Plastic & Polymers', value: 'Plastic', icon: Recycle },
  { label: 'Paper & Cardboard', value: 'Paper', icon: FileText },
  { label: 'Glass & Ceramic', value: 'Glass', icon: Wind },
  { label: 'Other Industrial', value: 'Other', icon: Factory },
];

export default function CategorySidebar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const active = searchParams.get('type') || '';

  const select = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('type', value);
    else next.delete('type');
    navigate({ pathname: '/', search: next.toString() });
  };

  return (
    <aside className="hidden lg:flex w-[220px] shrink-0 flex-col border-r border-hub-border bg-white sticky top-24 lg:top-[106px] self-start max-h-[calc(100vh-7rem)] lg:max-h-[calc(100vh-106px)] overflow-y-auto">
      <p className="px-5 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-widest text-hub-muted">
        Material Types
      </p>
      <nav className="pb-6 px-2" aria-label="Material categories">
        {ITEMS.map(({ label, value, icon: Icon }) => {
          const isActive = (value === null && !active) || (value && active === value);
          return (
            <button
              key={label}
              type="button"
              onClick={() => select(value)}
              className={`sidebar-item w-full text-left rounded-r-lg ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} className="shrink-0 opacity-80" aria-hidden />
              {label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
