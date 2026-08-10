"use client";
// beui.dev/components/motion/theme-toggle

import { Moon, Sun } from "lucide-react";
import { useSettingsStore } from "@workspace/studio-core";
import { useReducedMotion } from "motion/react";
import { useEffect, useState, type ComponentPropsWithoutRef } from "react";
import { ActionSwapIcon } from "./action-swap";
import { EASE_OUT_CSS } from "../../lib/ease";
import { cn } from "../../lib/utils";


export type ThemeVariant = "rectangle" | "circle" | "circle-blur" | "blinds";

export type RectStart =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center"
  | "bottom-up";

export interface ThemeToggleProps
  extends Omit<ComponentPropsWithoutRef<"button">, "children" | "onClick"> {
  /** Animation variant. Default: "rectangle". */
  variant?: ThemeVariant;
  /** Origin direction for the reveal. Default: "bottom-up". */
  start?: RectStart;
  iconClassName?: string;
}

export function useThemeToggle({
  variant = "rectangle",
  start = "bottom-up",
}: { variant?: ThemeVariant; start?: RectStart } = {}) {
  const theme = useSettingsStore((s) => s.settings.theme);
  const amoledMode = useSettingsStore((s) => s.settings.amoledMode);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const resolvedTheme = theme === "light" ? "light" : "dark";
  const reduce = useReducedMotion() ?? false;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && (resolvedTheme === "dark" || amoledMode);

  const cycleTheme = () => {
    let nextTheme: "light" | "dark" = "light";
    let nextAmoled = false;

    if (theme === "light") {
      nextTheme = "dark";
      nextAmoled = false;
    } else if (theme === "dark" && !amoledMode) {
      nextTheme = "dark";
      nextAmoled = true;
    } else {
      nextTheme = "light";
      nextAmoled = false;
    }

    updateSettings({ theme: nextTheme, amoledMode: nextAmoled });
  };

  const toggle = () => {
    if (reduce || !("startViewTransition" in document)) {
      cycleTheme();
      return;
    }

    (
      document as Document & {
        startViewTransition(cb: () => void): { finished: Promise<void> };
      }
    ).startViewTransition(() => cycleTheme());
  };

  return { isDark, mounted, toggle };
}

export function ThemeToggle({
  variant = "rectangle",
  start = "bottom-up",
  className,
  iconClassName,
  ...rest
}: ThemeToggleProps) {
  const { isDark, mounted, toggle } = useThemeToggle({ variant, start });

  return (
    <button
      type="button"
      aria-label={mounted && isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className={cn("flex items-center justify-center", className)}
      {...rest}
    >
      {mounted ? (
        <ActionSwapIcon
          value={isDark ? "dark" : "light"}
          animation="blur"
          className={iconClassName}
        >
          {isDark ? (
            <Sun className={iconClassName} />
          ) : (
            <Moon className={iconClassName} />
          )}
        </ActionSwapIcon>
      ) : (
        <span className={iconClassName} aria-hidden="true" />
      )}
    </button>
  );
}
