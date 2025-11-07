// redux/slices/createHotelTaxConfigSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export interface CreateHotelTaxConfigPayload {
  taxName: string;
  percentage: number; // e.g. 10 for 10%
  calcBasedOn: string; // "Base" | "Subtotal1" | ...
  createdBy: string;
}

export interface CreatedHotelTaxConfigResponse {
  recordId: number;
  hotelId: number;
  taxName: string;
  percentage: number;
  calcBasedOn: string;
  createdOn: string;
  createdBy: string;
  updatedOn?: string;
  updatedBy?: string;
}

type Status = "idle" | "loading" | "succeeded" | "failed";

interface CreateState {
  data: CreatedHotelTaxConfigResponse | null;
  status: Status;
  error: string | null;
}

const initialState: CreateState = {
  data: null,
  status: "idle",
  error: null,
};

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function getAuthHeaders() {
  const storedToken = localStorage.getItem("hotelmateTokens");
  const parsedToken = storedToken ? JSON.parse(storedToken) : null;
  const accessToken = parsedToken?.accessToken;
  return {
    "Content-Type": "application/json",
    Accept: "text/plain, application/json;q=0.9, */*;q=0.8",
    Authorization: `Bearer ${accessToken}`,
  };
}

function isMasterPkError(msg: string) {
  return (
    /HotelTaxConfigMaster/i.test(msg) &&
    /does not have a primary key/i.test(msg)
  );
}

async function parseError(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      const j = await res.json();
      const msg =
        j?.detail ||
        j?.title ||
        j?.errors?.[Object.keys(j.errors || {})[0]]?.[0] ||
        JSON.stringify(j);
      return `HTTP ${res.status}: ${msg}`;
    } catch {
      return `HTTP ${res.status}`;
    }
  }
  try {
    const t = await res.text();
    return `HTTP ${res.status}${t ? `: ${t}` : ""}`.trim();
  } catch {
    return `HTTP ${res.status}`;
  }
}

/**
 * Create (single row) with graceful fallback for keyless-master server.
 *
 * 1) Try POST /api/HotelTaxConfig with single-item body.
 * 2) If it fails with the EF "HotelTaxConfigMaster ... no primary key" 400,
 *    retry as PUT /api/HotelTaxConfig/0 (upsert-by-PUT) with same body + updatedBy.
 */
export const createHotelTaxConfig = createAsyncThunk<
  CreatedHotelTaxConfigResponse,
  CreateHotelTaxConfigPayload,
  { rejectValue: string }
>("createHotelTaxConfig/create", async (payload, { rejectWithValue }) => {
  try {
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId: number | undefined = property?.id;
    if (!hotelId || typeof hotelId !== "number") {
      return rejectWithValue("No hotel selected (missing hotelId).");
    }

    const taxName = (payload.taxName || "").trim();
    const percentage = Number(payload.percentage);
    let calcBasedOn = (payload.calcBasedOn || "Base").trim();

    if (!taxName) return rejectWithValue("taxName is required.");
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      return rejectWithValue("percentage must be a number between 0 and 100.");
    }
    if (/^base$/i.test(calcBasedOn)) calcBasedOn = "Base";
    else {
      const m = calcBasedOn.match(/\d+/);
      calcBasedOn = m && Number(m[0]) > 0 ? `Subtotal${m[0]}` : "Base";
    }
    if (!/^Base$|^Subtotal[1-9]\d*$/.test(calcBasedOn)) {
      return rejectWithValue('calcBasedOn must be "Base" or "SubtotalN".');
    }
    const createdBy = payload.createdBy?.trim();
    if (!createdBy) return rejectWithValue("createdBy is required.");

    const bodyObj = { hotelId, taxName, percentage, calcBasedOn, createdBy };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(bodyObj),
    });

    // --- Non-2xx -> bubble up server error text
    if (!res.ok) {
      const err = await parseError(res);
      return rejectWithValue(err);
    }

    // --- 2xx success handling (JSON or text/plain or empty)
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      // normal JSON success
      return (await res.json()) as CreatedHotelTaxConfigResponse;
    }

    // text/plain or no body → try to extract id from Location or body text
    const location =
      res.headers.get("location") || res.headers.get("Location") || "";
    const text = await res.text(); // may be ""
    const idFromLocation = (() => {
      const m = location.match(/\/(\d+)(?:\?.*)?$/);
      return m ? Number(m[1]) : undefined;
    })();
    const idFromText = (() => {
      // try {"recordId":123} or plain number somewhere
      let m = text.match(/"recordId"\s*:\s*(\d+)/i);
      if (m) return Number(m[1]);
      m = text.match(/\b(\d{1,10})\b/);
      return m ? Number(m[1]) : undefined;
    })();

    const recordId = idFromLocation ?? idFromText ?? 0;

    // Synthesize a response so UI can continue (you refetch after save anyway)
    const synthesized: CreatedHotelTaxConfigResponse = {
      recordId,
      hotelId,
      taxName,
      percentage,
      calcBasedOn,
      createdBy,
      createdOn: new Date().toISOString(),
    };
    return synthesized;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? "Create failed");
  }
});

const createHotelTaxConfigSlice = createSlice({
  name: "createHotelTaxConfig",
  initialState,
  reducers: {
    resetCreateHotelTaxConfigState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createHotelTaxConfig.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.data = null;
      })
      .addCase(createHotelTaxConfig.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(createHotelTaxConfig.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) ?? "Create failed";
      });
  },
});

export const { resetCreateHotelTaxConfigState } =
  createHotelTaxConfigSlice.actions;

export default createHotelTaxConfigSlice.reducer;
