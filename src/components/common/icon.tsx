import {
  Dumbbell,
  Gift,
  Headset,
  House,
  Info,
  LayoutGrid,
  Laptop,
  Package,
  RefreshCw,
  Shirt,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tag,
  ToyBrick,
  Truck,
  type LucideIcon,
} from "lucide-react";

/**
 * Named icons that config and catalogue data may refer to by key (category icons, benefit icons,
 * announcement icons). Add new keys here; unknown keys fall back to a generic package icon.
 */
const icons: Record<string, LucideIcon> = {
  smartphone: Smartphone,
  laptop: Laptop,
  shirt: Shirt,
  home: House,
  sparkles: Sparkles,
  dumbbell: Dumbbell,
  toy: ToyBrick,
  truck: Truck,
  shield: ShieldCheck,
  headset: Headset,
  tag: Tag,
  info: Info,
  refresh: RefreshCw,
  gift: Gift,
  grid: LayoutGrid,
};

export function NamedIcon({
  name,
  className,
  strokeWidth = 1.5,
}: {
  name?: string | null;
  className?: string;
  strokeWidth?: number;
}) {
  const Cmp = (name && icons[name]) || Package;
  return <Cmp aria-hidden className={className} strokeWidth={strokeWidth} />;
}
