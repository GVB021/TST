import { Moon, Sun } from "lucide-react";
import { useMemo } from "react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggleButton({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const resolvedTheme = useMemo(() => {
    if (theme === "system") {
      if (typeof window === "undefined") return "light";
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return theme;
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "h-9 w-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors inline-flex items-center justify-center",
        className
      )}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}
