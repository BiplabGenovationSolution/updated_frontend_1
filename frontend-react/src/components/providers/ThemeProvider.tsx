'use client'

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "@/context/ThemeProvider"
import { type ThemeProviderProps } from "@/context/ThemeProvider"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}