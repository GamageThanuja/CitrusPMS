

// redux/slices/fetchFileUploadByFolioIdSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types returned by API ----
 * GET /api/FolioAttachment/ByFolioId/{folioId}
 * Response: Array<FileUploadItem>
 */
export interface FileUploadItem {
  recordID: number;
  folioID: number;
  fileName: string;
  url: string;
  fileType: string;
  resNo: string;
  base64File: string;
  bucketName: string;
  // allow future-safe extras
  [k: string]: any;
}

export interface FetchFileUploadsParams {
  folioId: number;
}

interface FetchFileUploadsState {
  loading: boolean;
  error: string | null;
  items: FileUploadItem[];
  lastFolioId: number | null;
}

const initialState: FetchFileUploadsState = {
  loading: false,
  error: null,
  items: [],
  lastFolioId: null,
};

/** ---- Thunk: GET /api/FolioAttachment/ByFolioId/{folioId} ---- */
export const fetchFileUploadsByFolioId = createAsyncThunk<
  FileUploadItem[],
  FetchFileUploadsParams,
  { rejectValue: string }
>("folioAttachment/fetchByFolioId", async ({ folioId }, { rejectWithValue }) => {
  try {
    if (folioId == null || Number.isNaN(Number(folioId))) {
      throw new Error("Invalid folioId");
    }
    const url = `${API_BASE_URL}/api/FolioAttachment/ByFolioId/${encodeURIComponent(
      String(folioId)
    )}`;
    const res = await axios.get(url);
    const data = Array.isArray(res.data) ? (res.data as FileUploadItem[]) : [];
    return data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch folio attachments.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchFileUploadByFolioIdSlice = createSlice({
  name: "fetchFileUploadsByFolioId",
  initialState,
  reducers: {
    clearFileUploads(state) {
      state.items = [];
      state.error = null;
      state.lastFolioId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFileUploadsByFolioId.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.lastFolioId = action.meta.arg?.folioId ?? null;
      })
      .addCase(
        fetchFileUploadsByFolioId.fulfilled,
        (state, action: PayloadAction<FileUploadItem[]>) => {
          state.loading = false;
          state.items = action.payload;
        }
      )
      .addCase(fetchFileUploadsByFolioId.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch folio attachments.";
      });
  },
});

export const { clearFileUploads } = fetchFileUploadByFolioIdSlice.actions;
export default fetchFileUploadByFolioIdSlice.reducer;

/** ---- Selectors ---- */
export const selectFolioUploads = (s: any) =>
  (s.fetchFileUploadByFolioId?.items as FileUploadItem[]) ?? [];
export const selectFolioUploadsLoading = (s: any) =>
  (s.fetchFileUploadByFolioId?.loading as boolean) ?? false;
export const selectFolioUploadsError = (s: any) =>
  (s.fetchFileUploadByFolioId?.error as string | null) ?? null;
export const selectFolioUploadsLastFolioId = (s: any) =>
  (s.fetchFileUploadByFolioId?.lastFolioId as number | null) ?? null;