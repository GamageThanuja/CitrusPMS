// src/store/tutorialsByModuleSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

/* ---------- Types ---------- */
export interface Tutorial {
  tutorialId: number;
  tutorialName: string;
  description: string;
  module: string;
  videoURL: string;
  createdOn: string; // ISO date like "2025-10-21"
  createdBy: string;
  finAct: boolean;
}

type LoadStatus = "idle" | "loading" | "succeeded" | "failed";

interface ModuleBucket {
  items: Tutorial[];
  status: LoadStatus;
  error?: string | null;
  lastFetched?: number; // epoch ms
}

export interface TutorialsByModuleState {
  byModule: Record<string, ModuleBucket>;
}

const initialState: TutorialsByModuleState = {
  byModule: {},
};

/* ---------- Helpers ---------- */
const getAuthAndHotel = () => {
  const storedToken = localStorage.getItem("hotelmateTokens");
  const parsedToken = storedToken ? JSON.parse(storedToken) : null;
  const accessToken: string | undefined = parsedToken?.accessToken;

  const selectedProperty = localStorage.getItem("selectedProperty");
  const property = selectedProperty ? JSON.parse(selectedProperty) : {};
  const hotelId: number | string | undefined = property?.id;

  return { accessToken, hotelId };
};

// Change this if you have a central place for API base
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/* ---------- Thunk ---------- */
export const fetchTutorialsByModule = createAsyncThunk<
  { module: string; data: Tutorial[] },
  { module: string; force?: boolean },
  { rejectValue: string }
>(
  "tutorialsByModule/fetch",
  async ({ module }, { rejectWithValue, signal }) => {
    const { accessToken, hotelId } = getAuthAndHotel();
    if (!accessToken) {
      return rejectWithValue("Missing access token");
    }

    const controller = new AbortController();
    const onAbort = () => controller.abort();
    signal.addEventListener("abort", onAbort, { once: true });

    try {
      const encoded = encodeURIComponent(module);
      // Some backends expect hotelId as header, some as query. We send both, harmlessly.
      const url =
        `${API_BASE}/api/Tutorial/module/${encoded}` +
        (hotelId != null
          ? `?hotelId=${encodeURIComponent(String(hotelId))}`
          : "");

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json, text/plain;q=0.9,*/*;q=0.8",
          Authorization: `Bearer ${accessToken}`,
          ...(hotelId != null ? { "x-hotel-id": String(hotelId) } : {}),
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return rejectWithValue(
          `Request failed (${res.status}) ${res.statusText}${
            text ? `: ${text}` : ""
          }`
        );
      }

      // Swagger shows media type text/plain, but body is JSON per schema.
      const data = (await res.json()) as Tutorial[];
      return { module, data };
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return rejectWithValue("Request aborted");
      }
      return rejectWithValue(err?.message ?? "Network error");
    } finally {
      signal.removeEventListener("abort", onAbort);
    }
  },
  {
    condition: ({ module, force }, { getState }) => {
      if (force) return true;
      const state = getState() as { tutorialsByModule: TutorialsByModuleState };
      const bucket = state.tutorialsByModule?.byModule?.[module];
      // Prevent duplicate in-flight requests
      if (bucket?.status === "loading") return false;
      // Simple stale-while-revalidate: refetch if older than 2 minutes
      const STALE_MS = 2 * 60 * 1000;
      if (bucket?.lastFetched && Date.now() - bucket.lastFetched < STALE_MS) {
        return false;
      }
      return true;
    },
  }
);

/* ---------- Slice ---------- */
const tutorialsByModuleSlice = createSlice({
  name: "tutorialsByModule",
  initialState,
  reducers: {
    clearTutorialsForModule(state, action: PayloadAction<string>) {
      delete state.byModule[action.payload];
    },
    clearAllTutorials(state) {
      state.byModule = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTutorialsByModule.pending, (state, action) => {
        const module = action.meta.arg.module;
        const bucket = state.byModule[module] ?? {
          items: [],
          status: "idle" as LoadStatus,
        };
        bucket.status = "loading";
        bucket.error = null;
        state.byModule[module] = bucket;
      })
      .addCase(fetchTutorialsByModule.fulfilled, (state, action) => {
        const { module, data } = action.payload;
        state.byModule[module] = {
          items: data,
          status: "succeeded",
          error: null,
          lastFetched: Date.now(),
        };
      })
      .addCase(fetchTutorialsByModule.rejected, (state, action) => {
        const module = action.meta.arg.module;
        const bucket = state.byModule[module] ?? {
          items: [],
          status: "idle" as LoadStatus,
        };
        bucket.status = "failed";
        bucket.error =
          action.payload ?? action.error.message ?? "Request failed";
        state.byModule[module] = bucket;
      });
  },
});

export const { clearTutorialsForModule, clearAllTutorials } =
  tutorialsByModuleSlice.actions;

export default tutorialsByModuleSlice.reducer;

/* ---------- Selectors ---------- */
export const selectTutorialsBucket = (
  s: { tutorialsByModule: TutorialsByModuleState },
  module: string
) => s.tutorialsByModule.byModule[module];

export const selectTutorials = (
  s: { tutorialsByModule: TutorialsByModuleState },
  module: string
) => s.tutorialsByModule.byModule[module]?.items ?? [];

export const selectTutorialsStatus = (
  s: { tutorialsByModule: TutorialsByModuleState },
  module: string
) => s.tutorialsByModule.byModule[module]?.status ?? "idle";

export const selectTutorialsError = (
  s: { tutorialsByModule: TutorialsByModuleState },
  module: string
) => s.tutorialsByModule.byModule[module]?.error ?? null;

/* ---------- New: tolerant name lookup ---------- */
const norm = (s?: string) =>
  (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");

export const selectTutorialByName = (
  s: { tutorialsByModule: TutorialsByModuleState },
  module: string,
  tutorialName?: string
) => {
  const items = s.tutorialsByModule.byModule[module]?.items ?? [];
  if (!tutorialName) return undefined;
  const needle = norm(tutorialName);
  return items.find((t) => norm(t.tutorialName) === needle);
};

/* ---------- (Optional) convenience selectors ---------- */
export const selectTutorialVideoURLByName = (
  s: { tutorialsByModule: TutorialsByModuleState },
  module: string,
  tutorialName: string
) => selectTutorialByName(s, module, tutorialName)?.videoURL ?? null;

export const selectTutorialDescriptionByName = (
  s: { tutorialsByModule: TutorialsByModuleState },
  module: string,
  tutorialName: string
) => selectTutorialByName(s, module, tutorialName)?.description ?? null;
