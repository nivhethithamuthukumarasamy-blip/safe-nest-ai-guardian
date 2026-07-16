import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { trustLevel } from "@/lib/scoring";

export function TrustBadge({ score, className }: { score: number; className?: string }) {
  const level = trustLevel(score);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-sm",
        level.color,
        className,
      )}
      title={`Trust score: ${score}/100`}
    >
      <ShieldCheck className="h-3 w-3" />
      {level.label}
      <span className="opacity-80">· {score}</span>
    </span>
  );
}
