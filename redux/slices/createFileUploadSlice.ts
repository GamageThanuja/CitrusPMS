// src/redux/slices/createFileUploadSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface FileUploadResponse {
  recordID: number;
  folioID: number;
  fileName: string;
  url: string;
  fileType: string;
  resNo: string;
  base64File?: string; // some APIs echo this back; keep optional
  bucketName: string;
}

export type Uploadable =
  | File
  | Blob
  | string; // supports dataURL/base64 string like "data:image/png;base64,...."

export interface CreateFileUploadPayload {
  file: Uploadable;
  fileName?: string; // used when file is Blob/string
  folioID?: number;
  fileType?: string;
  resNo?: string;
  bucketName?: string;
  // Allow unknown props safely (won’t be sent unless you add to form below)
  [k: string]: any;
}

export interface CreateFileUploadState {
  loading: boolean;
  error: string | null;
  data: FileUploadResponse | null;
  success: boolean;
  lastBody: Omit<CreateFileUploadPayload, "file"> | null; // avoid storing the file
}

const initialState: CreateFileUploadState = {
  loading: false,
  error: null,
  data: null,
  success: false,
  lastBody: null,
};

function normalizeResponse(res: any): FileUploadResponse | null {
  if (!res) return null;
  if (Array.isArray(res)) return res.length ? (res[0] as FileUploadResponse) : null;
  if (typeof res === "object") return res as FileUploadResponse;
  return null;
}

function dataURLtoBlob(dataUrl: string): Blob {
  // data:[<mediatype>][;base64],<data>
  const parts = dataUrl.split(",");
  const header = parts[0] || "";
  const base64 = parts[1] || "";
  const isBase64 = /;base64/i.test(header);
  const mimeMatch = header.match(/data:(.*?)(;|$)/i);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";

  const byteString = isBase64 ? atob(base64) : decodeURIComponent(base64);
  const len = byteString.length;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) u8[i] = byteString.charCodeAt(i);
  return new Blob([u8], { type: mime });
}

/** ---- Thunk: POST /api/FolioAttachment/file-upload ---- */
export const createFileUpload = createAsyncThunk<
  FileUploadResponse | null,
  CreateFileUploadPayload,
  { rejectValue: string }
>("folioAttachment/fileUpload", async (body, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/FolioAttachment/file-upload`;

    const { file, fileName, folioID, fileType, resNo, bucketName } = body;

    const form = new FormData();

    // Prepare file field
    let blobToSend: Blob | File;
    let nameToUse = fileName || "upload";

    if (typeof file === "string") {
      if (file.startsWith("data:")) {
        const blob = dataURLtoBlob(file);
        // try to infer extension from mime
        const ext = (blob.type.split("/")[1] || "bin").split("+")[0];
        if (!/\./.test(nameToUse)) nameToUse = `${nameToUse}.${ext}`;
        blobToSend = blob;
      } else {
        // raw base64 without data URL is uncommon for multipart; wrap as octet-stream
        const blob = dataURLtoBlob(`data:application/octet-stream;base64,${file}`);
        if (!/\./.test(nameToUse)) nameToUse = `${nameToUse}.bin`;
        blobToSend = blob;
      }
      form.append("file", blobToSend, nameToUse);
    } else {
      // File or Blob
      blobToSend = file;
      // for File, keep its own name if no override
      if (!fileName && (file as File).name) nameToUse = (file as File).name;
      form.append("file", blobToSend, nameToUse);
    }

    // Optional fields (append only if defined to avoid sending empty)
    if (typeof folioID !== "undefined") form.append("folioID", String(folioID));
    if (typeof fileType !== "undefined") form.append("fileType", fileType ?? "");
    if (typeof resNo !== "undefined") form.append("resNo", resNo ?? "");
    if (typeof bucketName !== "undefined") form.append("bucketName", bucketName ?? "");

    const res = await axios.post(url, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return normalizeResponse(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "File upload failed.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createFileUploadSlice = createSlice({
  name: "createFileUpload",
  initialState,
  reducers: {
    clearCreateFileUpload(state) {
      state.loading = false;
      state.error = null;
      state.data = null;
      state.success = false;
      state.lastBody = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createFileUpload.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        // store a safe snapshot without the binary
        const { file, ...rest } = action.meta.arg ?? ({} as CreateFileUploadPayload);
        state.lastBody = rest;
      })
      .addCase(
        createFileUpload.fulfilled,
        (state, action: PayloadAction<FileUploadResponse | null>) => {
          state.loading = false;
          state.data = action.payload;
          state.success = true;
        }
      )
      .addCase(createFileUpload.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "File upload failed.";
      });
  },
});

export const { clearCreateFileUpload } = createFileUploadSlice.actions;
export default createFileUploadSlice.reducer;

/** ---- Selectors ---- */
export const selectFileUploadData = (s: any) =>
  (s.createFileUpload?.data as FileUploadResponse | null) ?? null;
export const selectFileUploadLoading = (s: any) =>
  (s.createFileUpload?.loading as boolean) ?? false;
export const selectFileUploadError = (s: any) =>
  (s.createFileUpload?.error as string | null) ?? null;
export const selectFileUploadSuccess = (s: any) =>
  (s.createFileUpload?.success as boolean) ?? false;