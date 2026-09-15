import {
  Sparkles,
  Code2,
  BookCheck,
  Flame,
  Mountain,
  Zap,
  Bug,
  Trophy,
  MessageCircle,
  Compass,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const map: Record<string, LucideIcon> = {
  Sparkles,
  Code2,
  BookCheck,
  Flame,
  Mountain,
  Zap,
  Bug,
  Trophy,
  MessageCircle,
  Compass,
};

export function AchievementIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = map[icon] ?? Sparkles;
  return <Icon className={cn("size-4", className)} />;
}
