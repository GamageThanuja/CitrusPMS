"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme as useNextTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ThemeId = "light" | "dark" | "system";

const THEMES: {
  id: ThemeId;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "light", icon: Sun },
  { id: "dark", icon: Moon },
  { id: "system", icon: Monitor },
];

export function ThemeSelector() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const activeThemeId: ThemeId = mounted
    ? ((theme === "system" ? resolvedTheme : theme) as ThemeId) ?? "system"
    : "system";
  const ActiveIcon =
    THEMES.find((t) => t.id === activeThemeId)?.icon ?? Monitor;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 rounded-full"
          aria-label="Change theme"
        >
          <ActiveIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={6} className="w-auto p-2">
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(({ id, icon: Icon }) => {
            const isActive =
              mounted &&
              (theme === id || (theme === "system" && resolvedTheme === id));
            return (
              <DropdownMenuItem
                key={id}
                className="p-0"
                onClick={() => {
                  setTheme(id);
                  setOpen(false);
                }}
                aria-label={id}
              >
                <div
                  className={[
                    "relative h-9 w-9 inline-flex items-center justify-center rounded-md",
                    "transition-all hover:bg-muted",
                    isActive
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" />
                  {isActive && (
                    <Check className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-background" />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
