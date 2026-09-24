import { Baby, Car, CircleHelp, Dumbbell, Laptop, Shirt, Smartphone, Sofa, Sparkles, Star, Watch, Wrench, Briefcase, type LucideIcon } from 'lucide-react';

// ชื่อไอคอนที่เก็บใน categories.icon (ตั้งค่าได้จากหลังบ้านในอนาคต) → lucide icon
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  shirt: Shirt,
  briefcase: Briefcase,
  laptop: Laptop,
  car: Car,
  baby: Baby,
  dumbbell: Dumbbell,
  watch: Watch,
  smartphone: Smartphone,
  sparkles: Sparkles,
  wrench: Wrench,
  sofa: Sofa,
};

export function CategoryIcon({ name, size = 15, className = '' }: { name: string | null; size?: number; className?: string }) {
  const Icon = (name && CATEGORY_ICONS[name]) || CircleHelp;
  return <Icon size={size} strokeWidth={1.8} className={className} aria-hidden />;
}

/** ดาวเรตติ้ง 5 ดวง (เติมตามคะแนน) */
export function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  const full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-px" role="img" aria-label={`Rating ${rating.toFixed(1)} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} strokeWidth={1.5} className={n <= full ? 'fill-warning text-warning' : 'fill-line text-line'} aria-hidden />
      ))}
    </span>
  );
}
