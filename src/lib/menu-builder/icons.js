import { Star, Flame, Gift, Tag, Percent, Heart, Truck, Sparkles, LayoutGrid, Folder, ExternalLink, Home, Phone, Crown, Bookmark, Bell } from "lucide-react";

/** Small curated icon set for menu items, backed by lucide-react. */
export const MENU_ICONS = {
  star: Star,
  fire: Flame,
  gift: Gift,
  tag: Tag,
  percent: Percent,
  heart: Heart,
  truck: Truck,
  sparkle: Sparkles,
  grid: LayoutGrid,
  folder: Folder,
  external: ExternalLink,
  home: Home,
  phone: Phone,
  crown: Crown,
  bookmark: Bookmark,
  bell: Bell,
};

export const MENU_ICON_KEYS = Object.keys(MENU_ICONS);

export function isUploadedIcon(icon) {
  return !!icon && (icon.startsWith("http://") || icon.startsWith("https://") || icon.startsWith("/"));
}

/** Renders `icon` whether it's a known registry key, an uploaded image URL, an emoji, or empty. */
export function ResolvedIcon({ icon, size = 18, className }) {
  if (!icon) return null;
  const Comp = MENU_ICONS[icon];
  if (Comp) return <Comp size={size} className={className} strokeWidth={1.6} />;
  if (isUploadedIcon(icon)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={icon} alt="" width={size} height={size} className={className} style={{ objectFit: "contain", borderRadius: 3 }} />;
  }
  return (
    <span className={className} style={{ fontSize: size, lineHeight: 1 }} aria-hidden="true">
      {icon}
    </span>
  );
}
