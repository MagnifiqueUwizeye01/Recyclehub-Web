import { ShieldCheck, Package, Lock } from 'lucide-react';

const ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Verified Suppliers',
    desc: 'All sellers undergo rigorous identity and compliance verification',
  },
  {
    icon: Package,
    title: 'Structured listings',
    desc: 'Materials listed with clear grades, quantities, and pricing in RWF',
  },
  {
    icon: Lock,
    title: 'Secure Payments',
    desc: 'MoMo mobile money integration with encrypted transactions',
  },
];

export default function TrustStrip() {
  return (
    <section className="border-t border-b border-hub-border bg-white py-10 mb-4">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
        {ITEMS.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex flex-col items-center text-center md:flex-row md:text-left md:items-start gap-4"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Icon size={28} />
            </div>
            <div>
              <h3 className="font-bold text-hub-text text-[15px] mb-1">{title}</h3>
              <p className="text-[13px] text-hub-muted leading-snug">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
