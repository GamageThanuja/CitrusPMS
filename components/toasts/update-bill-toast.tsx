"use client";

import { toast } from "sonner";

/**
 * Hook for showing toasts with consistent styling
 * Global Sonner configuration in providers.tsx handles z-index for drawer visibility
 */
export function useDrawerToast() {
  const success = (title: string, description?: string) => {
    toast.success(title, {
      description,
    });
  };

  const error = (title: string, description?: string) => {
    toast.error(title, {
      description,
    });
  };

  const info = (title: string, description?: string) => {
    toast.info(title, {
      description,
    });
  };

  return { success, error, info };
}
