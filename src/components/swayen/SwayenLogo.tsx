import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import logoLight from "@/assets/swayen-logo-light.png";
import logoDark from "@/assets/swayen-logo-dark.png";

export function SwayenLogo({ className }: { className?: string }) {
  const { theme } = useTheme();
  return (
    <img
      src={theme === "dark" ? logoDark : logoLight}
      alt="Swayen"
      className={cn("object-contain", className)}
    />
  );
}
