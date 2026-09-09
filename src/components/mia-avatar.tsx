import miaImage from "@/assets/mia.png";
import { cn } from "@/lib/utils";

export function MiaAvatar({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <img
      src={miaImage}
      alt="Mia, a assistente da Prelúdia"
      width={size}
      height={size}
      loading="lazy"
      className={cn("object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
