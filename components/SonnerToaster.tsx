"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

export function SonnerToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme as "light" | "dark"}
      position="bottom-right"
      richColors
      toastOptions={{
        style: { fontFamily: "inherit", fontSize: "13px" },
      }}
    />
  );
}
