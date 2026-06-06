import { Truck, ShieldCheck, RefreshCw, Headphones } from 'lucide-react';

const features = [
  {
    icon: <Truck size={22} className="text-primary" />,
    title: 'توصيل سريع',
    desc: 'لجميع المحافظات',
    bgClass: 'bg-primary/5 dark:bg-primary/10',
  },
  {
    icon: <ShieldCheck size={22} className="text-emerald-500" />,
    title: 'منتجات أصلية',
    desc: '100% مضمونة',
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/10',
  },
  {
    icon: <RefreshCw size={22} className="text-amber-500" />,
    title: 'استرجاع سهل',
    desc: 'خلال 14 يوم',
    bgClass: 'bg-amber-50 dark:bg-amber-900/10',
  },
  {
    icon: <Headphones size={22} className="text-purple-500" />,
    title: 'دعم 24/7',
    desc: 'نحن هنا لمساعدتك',
    bgClass: 'bg-purple-50 dark:bg-purple-900/10',
  },
];

export default function FeaturesStrip() {
  return (
    <section className="mt-6 px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {features.map((f, i) => (
          <div
            key={i}
            className="feature-card group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className={`w-10 h-10 rounded-xl ${f.bgClass} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
              {f.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
