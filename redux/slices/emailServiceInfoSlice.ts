import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface EmailServiceInfo {
  version?: string;
  status?: string;
  uptime?: string;
  lastUpdated?: string;
  features?: string[];
  supportedFormats?: string[];
  rateLimits?: {
    perMinute?: number;
    perHour?: number;
    perDay?: number;
  };
  providers?: string[];
  defaultSender?: string;
  maxAttachmentSize?: string;
  maxRecipients?: number;
  // Allow for dynamic properties since API returns plain text
  rawInfo?: string;
}

export interface EmailServiceInfoState {
  loading: boolean;
  error: string | null;
  info: EmailServiceInfo | null;
  lastFetched: string | null;
}

const initialState: EmailServiceInfoState = {
  loading: false,
  error: null,
  info: null,
  lastFetched: null,
};

/** ---- Thunk: GET /info ---- */
export const fetchEmailServiceInfo = createAsyncThunk<
  EmailServiceInfo | string,
  void,
  { rejectValue: string }
>("emailService/fetchInfo", async (_, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/info`;
    const res = await axios.get(url, {
      headers: {
        'Accept': 'application/json, text/plain, */*'
      }
    });
    
    // Handle different response formats
    const contentType = res.headers['content-type'] || '';
    
    if (contentType.includes('application/json')) {
      return res.data as EmailServiceInfo;
    } else if (contentType.includes('text/plain')) {
      // Parse plain text response
      const rawText = res.data as string;
      return {
        rawInfo: rawText,
        // Try to extract structured data from plain text
        ...parsePlainTextInfo(rawText)
      };
    }
    
    // Fallback: return as-is
    return res.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to fetch email service info.";
    return rejectWithValue(msg);
  }
});

/** ---- Helper function to parse plain text info ---- */
const parsePlainTextInfo = (text: string): Partial<EmailServiceInfo> => {
  const info: Partial<EmailServiceInfo> = {};
  
  // Simple parsing logic - adjust based on your actual API response format
  const lines = text.split('\n');
  
  lines.forEach(line => {
    if (line.includes('Version:')) {
      info.version = line.split('Version:')[1]?.trim();
    } else if (line.includes('Status:')) {
      info.status = line.split('Status:')[1]?.trim();
    } else if (line.includes('Uptime:')) {
      info.uptime = line.split('Uptime:')[1]?.trim();
    } else if (line.toLowerCase().includes('features:')) {
      const featuresMatch = line.match(/\[(.*?)\]/);
      if (featuresMatch) {
        info.features = featuresMatch[1].split(',').map(f => f.trim());
      }
    }
  });
  
  return info;
};

/** ---- Slice ---- */
const emailServiceInfoSlice = createSlice({
  name: "emailServiceInfo",
  initialState,
  reducers: {
    clearEmailServiceInfo(state) {
      state.loading = false;
      state.error = null;
      state.info = null;
      state.lastFetched = null;
    },
    resetEmailServiceInfoState(state) {
      Object.assign(state, initialState);
    },
    updateEmailServiceInfo(
      state,
      action: PayloadAction<Partial<EmailServiceInfo>>
    ) {
      if (state.info) {
        state.info = { ...state.info, ...action.payload };
      } else {
        state.info = action.payload as EmailServiceInfo;
      }
      state.lastFetched = new Date().toISOString();
    },
    setEmailServiceInfoLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmailServiceInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchEmailServiceInfo.fulfilled,
        (state, action: PayloadAction<EmailServiceInfo | string>) => {
          state.loading = false;
          state.lastFetched = new Date().toISOString();
          
          // Handle different response types
          if (typeof action.payload === 'string') {
            state.info = {
              rawInfo: action.payload,
              ...parsePlainTextInfo(action.payload)
            };
          } else {
            state.info = action.payload as EmailServiceInfo;
          }
        }
      )
      .addCase(fetchEmailServiceInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch email service info.";
      });
  },
});

export const { 
  clearEmailServiceInfo, 
  resetEmailServiceInfoState, 
  updateEmailServiceInfo,
  setEmailServiceInfoLoading 
} = emailServiceInfoSlice.actions;
export default emailServiceInfoSlice.reducer;

/** ---- Selectors ---- */
export const selectEmailServiceInfoLoading = (s: any) =>
  (s.emailServiceInfo?.loading as boolean) ?? false;

export const selectEmailServiceInfoError = (s: any) =>
  (s.emailServiceInfo?.error as string | null) ?? null;

export const selectEmailServiceInfo = (s: any) =>
  s.emailServiceInfo?.info ?? null;

export const selectEmailServiceLastFetched = (s: any) =>
  s.emailServiceInfo?.lastFetched ?? null;

export const selectEmailServiceRawInfo = (s: any) =>
  s.emailServiceInfo?.info?.rawInfo ?? null;

export const selectEmailServiceVersion = (s: any) =>
  s.emailServiceInfo?.info?.version ?? null;

export const selectEmailServiceStatus = (s: any) =>
  s.emailServiceInfo?.info?.status ?? null;

export const selectEmailServiceUptime = (s: any) =>
  s.emailServiceInfo?.info?.uptime ?? null;

export const selectEmailServiceFeatures = (s: any) =>
  s.emailServiceInfo?.info?.features ?? [];

export const selectIsEmailServiceHealthy = (s: any) => {
  const status = s.emailServiceInfo?.info?.status;
  return status === 'healthy' || status === 'operational' || status === 'running';
};

export const selectEmailServiceInfoAsText = (s: any) => {
  const info = s.emailServiceInfo?.info;
  if (!info) return '';
  
  if (info.rawInfo) {
    return info.rawInfo;
  }
  
  // Convert structured info to text
  const lines: string[] = [];
  if (info.version) lines.push(`Version: ${info.version}`);
  if (info.status) lines.push(`Status: ${info.status}`);
  if (info.uptime) lines.push(`Uptime: ${info.uptime}`);
  if (info.lastUpdated) lines.push(`Last Updated: ${info.lastUpdated}`);
  if (info.features?.length) lines.push(`Features: [${info.features.join(', ')}]`);
  if (info.defaultSender) lines.push(`Default Sender: ${info.defaultSender}`);
  
  return lines.join('\n');
};

/** ---- Helper Functions ---- */
export const formatUptime = (uptimeString?: string): string => {
  if (!uptimeString) return 'Unknown';
  
  // Try to parse common uptime formats
  if (uptimeString.includes('d') || uptimeString.includes('h') || uptimeString.includes('m')) {
    return uptimeString; // Already formatted
  }
  
  // Try to parse seconds
  const seconds = parseInt(uptimeString);
  if (!isNaN(seconds)) {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    return parts.join(' ') || `${seconds}s`;
  }
  
  return uptimeString;
};

export const shouldRefreshInfo = (lastFetched: string | null, cacheDurationMs: number = 60000): boolean => {
  if (!lastFetched) return true;
  
  const lastFetchedTime = new Date(lastFetched).getTime();
  const currentTime = new Date().getTime();
  
  return currentTime - lastFetchedTime > cacheDurationMs;
};