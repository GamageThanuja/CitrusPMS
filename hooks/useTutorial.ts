// src/hooks/useTutorial.ts
"use client";

import { useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTutorialsByModule,
  selectTutorials,
  selectTutorialsStatus,
  selectTutorialsError,
  selectTutorialByName,
  type Tutorial,
} from "@/redux/slices/tutorialsByModuleSlice";
import type { AppDispatch, RootState } from "@/redux/store";

/**
 * useTutorial
 * - Always fetches a module (cached by slice)
 * - Optionally returns a single tutorial matched by name
 */
export function useTutorial(module: string, tutorialName?: string) {
  const dispatch = useDispatch<AppDispatch>();

  const status = useSelector((s: RootState) =>
    selectTutorialsStatus(s, module)
  );
  const error = useSelector((s: RootState) => selectTutorialsError(s, module));
  const all = useSelector((s: RootState) => selectTutorials(s, module));
  const tutorial = useSelector((s: RootState) =>
    selectTutorialByName(s, module, tutorialName)
  ) as Tutorial | undefined;

  useEffect(() => {
    if (!module) return;
    const p = dispatch(fetchTutorialsByModule({ module }));
    return () => p.abort();
  }, [dispatch, module]);

  const refetch = useCallback(
    () => dispatch(fetchTutorialsByModule({ module, force: true })),
    [dispatch, module]
  );

  return { status, error, all, tutorial, refetch };
}
