"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export function useTheme() {
  const { theme, setTheme, systemTheme } = React.useContext(
    // @ts-ignore - The context does exist but TypeScript doesn't know about it
    React.createContext({ theme: "", setTheme: (theme: string) => {}, systemTheme: "" }),
  )

  return {
    theme: theme === "system" ? systemTheme : theme,
    setTheme,
    systemTheme,
  }
}

