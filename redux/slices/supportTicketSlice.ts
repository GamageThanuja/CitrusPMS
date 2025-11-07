import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Types
export interface TicketMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  isStaff: boolean;
  attachmentUrl?: string;
}

export interface TicketListItem {
  ticketID: number;
  subject: string;
  description: string;
  priority: "Low" | "Medium" | "High" | string;
  status:
    | "Open"
    | "Closed"
    | "Pending"
    | "Answered"
    | "Customer-Reply"
    | string;
  department: "Technical" | "Billing" | "Customer" | "ChannelManager" | string;
  ticketType?: string;
  hotelCode?: string | number;
  hotelName?: string;
  hotelId?: number;
  isClosed?: boolean;
  createdOn?: string;
  createdDate: string;
  lastUpdated?: string;
  details?: {
    attachmentURL?: string;
  }[];
}

export interface TicketDetails {
  ticketID: number;
  hotelId: number;
  subject: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  department: string;
  ticketType: string;
  hotelCode: string;
  createdDate: string;
  lastUpdated: string;
  attachmentUrl?: string;
  messages: TicketMessage[];
  assignedTo?: string;
  createdBy?: string;
  isClosed: boolean;
  closedBy?: string | null;
  closedOn?: string | null;
  conclusion?: string | null;
}

export interface CreateSupportTicketRequest {
  hotelId: number;
  subject: string;
  createdBy: string;
  ticketType: string;
  priority: string;
  assignedTo: string;
  supportTicketDetail: {
    supportTicketId: number;
    ticketUpdateText: string;
    attachmentUrl: string;
    createBy: string;
  };
  createdOn: string;
}

interface SupportTicketState {
  // List state
  tickets: TicketListItem[];
  listLoading: boolean;
  listError: string | null;

  // Detail state
  currentTicket: TicketDetails | null;
  loading: boolean;
  updating: boolean;
  error: string | null;
}

const initialState: SupportTicketState = {
  // List state
  tickets: [],
  listLoading: false,
  listError: null,

  // Detail state
  currentTicket: null,
  loading: false,
  updating: false,
  error: null,
};

// Helper function to get auth token
const getAuthToken = (): string | null => {
  const tokenString = localStorage.getItem("hotelmateTokens");
  return tokenString ? JSON.parse(tokenString).accessToken : null;
};

// Convert File to base64
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const res = String(reader.result || "");
        const base64 = res.includes(",") ? res.split(",")[1] : res;
        resolve(base64);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Async thunks for ticket list
export const fetchSupportTickets = createAsyncThunk(
  "supportTicket/fetchSupportTickets",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${BASE_URL}/api/SupportTicket`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tickets: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch support tickets"
      );
    }
  }
);

export const fetchSupportTicketsByHotel = createAsyncThunk(
  "supportTicket/fetchSupportTicketsByHotel",
  async (hotelId: number, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      if (hotelId === undefined || hotelId === null) {
        throw new Error("hotelId is required");
      }

      const response = await fetch(
        `${BASE_URL}/api/SupportTicket/hotel/${hotelId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch tickets for hotel ${hotelId}: ${response.status}`
        );
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch support tickets by hotel"
      );
    }
  }
);

// Async thunks for ticket details
export const fetchTicketDetails = createAsyncThunk(
  "supportTicket/fetchTicketDetails",
  async (ticketId: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(
        `${BASE_URL}/api/SupportTicketDetail?supportTicketId=${ticketId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch ticket details");
      }

      const data = await response.json();

      // Some backends ignore the query filter; enforce client-side filtering by ticketID
      const arr = Array.isArray(data) ? data : [data];
      const filtered = arr.filter(
        (t: any) => Number(t.ticketID) === Number(ticketId)
      );
      const ticketData = filtered.length > 0 ? filtered[0] : arr[0];

      // Normalize description and avoid duplicating first detail as a message
      const detailsArr = Array.isArray(ticketData.details)
        ? ticketData.details
        : [];
      const firstDetail = detailsArr[0];
      const baseDescription =
        ticketData.description ||
        firstDetail?.ticketUpdateText ||
        "No description provided";
      const mappedMessages =
        detailsArr.length > 1
          ? detailsArr.slice(1).map((d: any) => ({
              id: String(d.supportTicketDetailId ?? ""),
              sender: d.createdBy || ticketData.assignedTo || "Staff",
              message: d.ticketUpdateText || "",
              timestamp: d.createdOn || "",
              isStaff: true,
              attachmentUrl: d.attachmentURL || "",
            }))
          : [];

      const transformedTicketData: TicketDetails = {
        ticketID:
          ticketData.ticketID ||
          ticketData.supportTicketId ||
          parseInt(ticketId),
        hotelId: ticketData.hotelId,
        subject: ticketData.subject || "No Subject",
        description: baseDescription,
        priority: ticketData.priority || "Low",
        department: ticketData.ticketType || "--",
        ticketType: ticketData.ticketType || "--",
        hotelCode:
          ticketData.hotelCode || ticketData.hotelId?.toString() || "--",
        createdDate: ticketData.createdOn
          ? new Date(ticketData.createdOn).toLocaleDateString()
          : "",
        lastUpdated:
          ticketData.closedOn || ticketData.createdOn
            ? new Date(
                ticketData.closedOn || ticketData.createdOn
              ).toLocaleDateString()
            : "",
        attachmentUrl: ticketData.details?.[0]?.attachmentURL || "",
        assignedTo:
          ticketData.assignedTo && ticketData.assignedTo.trim() !== ""
            ? ticketData.assignedTo
            : "Unassigned",
        messages: mappedMessages,
        createdBy: ticketData.createdBy || "Unknown",
        isClosed: Boolean(ticketData.isClosed),
        closedBy: ticketData.closedBy,
        closedOn: ticketData.closedOn,
        conclusion: ticketData.conclusion,
      };

      return transformedTicketData;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch ticket details"
      );
    }
  }
);

export const uploadAttachment = createAsyncThunk(
  "supportTicket/uploadAttachment",
  async (
    {
      file,
      hotelID,
      createdBy,
      ticketId,
    }: {
      file: File;
      hotelID: number;
      createdBy: string;
      ticketId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const base64 = await fileToBase64(file);
      const nowIso = new Date().toISOString();

      const body = {
        hotelID: hotelID,
        imageFileName: file.name,
        description: `SupportTicket_${ticketId}`,
        isMain: false,
        finAct: true,
        createdOn: nowIso,
        createdBy: createdBy || "system",
        updatedOn: nowIso,
        updatedBy: createdBy || "system",
        base64Image: base64,
      };

      const response = await fetch(`${BASE_URL}/api/HotelImage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Attachment upload failed");
      }

      // Prefer the API's imageFileName (which is a full signed S3 URL),
      // then fall back to other URL-like fields.
      let parsed: any = null;
      try {
        parsed = await response.json();
      } catch {}

      // Prefer the API's imageFileName (which is a full signed S3 URL),
      // then fall back to other URL-like fields.
      const primaryUrl: string | undefined =
        parsed?.imageFileName ||
        parsed?.attachmentUrl ||
        parsed?.imageUrl ||
        parsed?.url ||
        parsed?.s3Url ||
        parsed?.Location ||
        parsed?.fileUrl ||
        undefined;

      // Helpers (env-free)
      const S3_BASE = "https://hotelmate.s3.us-east-1.amazonaws.com/";
      const stripQuery = (u: string) =>
        typeof u === "string" && u.includes("?") ? u.split("?")[0] : u;
      const isAbsolute = (u: string) => /^https?:\/\//i.test(u);

      if (primaryUrl) {
        // Use as-is (absolute) and remove any signed query params to satisfy AttachmentUrl max length
        const cleaned = stripQuery(primaryUrl);
        return cleaned;
      }

      // If no URL-like field, fall back to a key/filename and build a public URL
      const candidateKey: string | undefined =
        parsed?.key ||
        parsed?.objectKey ||
        parsed?.fileName ||
        parsed?.imageFileName ||
        body.imageFileName ||
        undefined;

      if (candidateKey) {
        // If backend returned an absolute URL in imageFileName/fileName, use it directly (after trimming)
        if (isAbsolute(candidateKey)) {
          return stripQuery(candidateKey);
        }
        const built = `${S3_BASE}${String(candidateKey).replace(/^\//, "")}`;
        return stripQuery(built);
      }

      // Final fallback: return the original upload name
      return body.imageFileName;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to upload attachment"
      );
    }
  }
);

export const updateSupportTicket = createAsyncThunk(
  "supportTicket/updateSupportTicket",
  async (
    {
      ticketId,
      updateText,
      attachmentFile,
      createdBy,
      hotelId,
      assignedTo,
      assignedToEmail,
    }: {
      ticketId: number;
      updateText: string;
      attachmentFile?: File;
      createdBy: string;
      hotelId: number;
      assignedTo?: string;
      assignedToEmail?: string;
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Upload attachment if provided
      let uploadedUrl = "";
      if (attachmentFile) {
        try {
          const result = await dispatch(
            uploadAttachment({
              file: attachmentFile,
              hotelID: hotelId,
              createdBy,
              ticketId: ticketId.toString(),
            })
          ).unwrap();
          uploadedUrl = result;
        } catch (error) {
          // Continue without attachment if upload fails
          console.error("Attachment upload failed:", error);
        }
      }

      // Post support ticket detail
      const updateRequest: any = {
        supportTicketId: ticketId,
        ticketUpdateText: updateText,
        attachmentUrl: uploadedUrl,
        createBy: createdBy,
        isReplied: true,
      };
      if (assignedTo && assignedTo.trim() !== "") {
        updateRequest.assignedTo = assignedTo;
      }

      // Optional debug log
      console.log("POST /SupportTicketDetail payload", updateRequest);

      const response = await fetch(`${BASE_URL}/api/SupportTicketDetail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateRequest),
      });

      if (!response.ok) {
        throw new Error("Failed to update support ticket");
      }

      const result = await response.json();

      // Create new message object
      const newMessage: TicketMessage = {
        id:
          result && result.supportTicketDetailId
            ? String(result.supportTicketDetailId)
            : typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : String(Date.now()),
        sender: createdBy,
        message: updateText.trim(),
        timestamp: new Date().toISOString(),
        isStaff: true,
        attachmentUrl: uploadedUrl || "",
      };

      return { newMessage, uploadedUrl };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to update support ticket"
      );
    }
  }
);

export const closeSupportTicket = createAsyncThunk(
  "supportTicket/closeSupportTicket",
  async (ticketId: number, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(
        `${BASE_URL}/api/SupportTicket/${ticketId}/isClosed?isClosed=true`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to close support ticket");
      }

      const result = await response.json();
      if (result === true) {
        return ticketId;
      } else {
        throw new Error("Failed to close ticket");
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to close support ticket"
      );
    }
  }
);

export const createSupportTicket = createAsyncThunk(
  "supportTicket/createSupportTicket",
  async (
    {
      hotelId,
      subject,
      createdBy,
      ticketType,
      priority,
      assignedTo,
      description,
      attachmentFile,
    }: {
      hotelId: number;
      subject: string;
      createdBy: string;
      ticketType: string;
      priority: string;
      assignedTo: string;
      description: string;
      attachmentFile?: File;
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Upload attachment if provided
      let uploadedUrl = "";
      if (attachmentFile) {
        try {
          const result = await dispatch(
            uploadAttachment({
              file: attachmentFile,
              hotelID: hotelId,
              createdBy,
              ticketId: "0", // Temporary ID for new ticket
            })
          ).unwrap();
          uploadedUrl = result;
        } catch (error) {
          // Continue without attachment if upload fails
          console.error("Attachment upload failed:", error);
        }
      }

      // Create the support ticket request
      const createRequest: CreateSupportTicketRequest = {
        hotelId,
        subject,
        createdBy,
        ticketType,
        priority,
        assignedTo,
        supportTicketDetail: {
          supportTicketId: 0, // Will be set by the server
          ticketUpdateText: description,
          attachmentUrl: uploadedUrl,
          createBy: createdBy,
        },
        createdOn: new Date().toISOString(),
      };

      console.log("POST /api/SupportTicket payload", createRequest);

      const response = await fetch(`${BASE_URL}/api/SupportTicket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createRequest),
      });

      if (!response.ok) {
        throw new Error(`Failed to create support ticket: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to create support ticket"
      );
    }
  }
);

// Slice
const supportTicketSlice = createSlice({
  name: "supportTicket",
  initialState,
  reducers: {
    clearCurrentTicket: (state) => {
      state.currentTicket = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
      state.listError = null;
    },
    clearListError: (state) => {
      state.listError = null;
    },
    updateTicketInList: (
      state,
      action: PayloadAction<{
        ticketID: number;
        updates: Partial<TicketListItem>;
      }>
    ) => {
      const { ticketID, updates } = action.payload;
      const ticketIndex = state.tickets.findIndex(
        (ticket) => ticket.ticketID === ticketID
      );
      if (ticketIndex !== -1) {
        state.tickets[ticketIndex] = {
          ...state.tickets[ticketIndex],
          ...updates,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch support tickets list
      .addCase(fetchSupportTickets.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(
        fetchSupportTickets.fulfilled,
        (state, action: PayloadAction<TicketListItem[]>) => {
          state.listLoading = false;
          state.tickets = action.payload;
        }
      )
      .addCase(fetchSupportTickets.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload as string;
      })

      // Fetch support tickets list by hotel
      .addCase(fetchSupportTicketsByHotel.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(
        fetchSupportTicketsByHotel.fulfilled,
        (state, action: PayloadAction<TicketListItem[]>) => {
          state.listLoading = false;
          state.tickets = action.payload;
        }
      )
      .addCase(fetchSupportTicketsByHotel.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload as string;
      })

      // Fetch ticket details
      .addCase(fetchTicketDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchTicketDetails.fulfilled,
        (state, action: PayloadAction<TicketDetails>) => {
          state.loading = false;
          state.currentTicket = action.payload;
        }
      )
      .addCase(fetchTicketDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update support ticket
      .addCase(updateSupportTicket.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateSupportTicket.fulfilled, (state, action) => {
        state.updating = false;
        if (state.currentTicket) {
          state.currentTicket.messages.push(action.payload.newMessage);
          // Also update lastUpdated timestamp
          state.currentTicket.lastUpdated = new Date().toISOString();
          const chosenAssignee = (action as any)?.meta?.arg?.assignedTo;
          if (chosenAssignee && chosenAssignee.trim() !== "") {
            state.currentTicket.assignedTo = chosenAssignee;
          }
        }
        // Update ticket in list with new lastUpdated timestamp
        const ticketId = state.currentTicket?.ticketID;
        if (ticketId) {
          const ticketIndex = state.tickets.findIndex(
            (ticket) => ticket.ticketID === ticketId
          );
          if (ticketIndex !== -1) {
            state.tickets[ticketIndex] = {
              ...state.tickets[ticketIndex],
              lastUpdated: new Date().toISOString(),
            };
          }
        }
      })
      .addCase(updateSupportTicket.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      })

      // Close support ticket
      .addCase(closeSupportTicket.fulfilled, (state, action) => {
        const ticketId = action.payload;
        // Update current ticket if it matches
        if (state.currentTicket && state.currentTicket.ticketID === ticketId) {
          state.currentTicket.isClosed = true;
        }
        // Update ticket in list
        const ticketIndex = state.tickets.findIndex(
          (ticket) => ticket.ticketID === ticketId
        );
        if (ticketIndex !== -1) {
          state.tickets[ticketIndex] = {
            ...state.tickets[ticketIndex],
            isClosed: true,
            status: "Closed",
          };
        }
      })
      .addCase(closeSupportTicket.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Upload attachment
      .addCase(uploadAttachment.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Create support ticket
      .addCase(createSupportTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSupportTicket.fulfilled, (state, action) => {
        state.loading = false;
        // Transform the response to match TicketListItem format and add to the beginning of the list
        const newTicketData = action.payload;
        if (newTicketData && newTicketData.ticketID) {
          const newTicket: TicketListItem = {
            ticketID: newTicketData.ticketID,
            subject: newTicketData.subject || "No Subject",
            description:
              newTicketData.supportTicketDetail?.ticketUpdateText ||
              newTicketData.description ||
              "",
            priority: newTicketData.priority || "Low",
            status: newTicketData.isClosed ? "Closed" : "Open",
            department: newTicketData.ticketType || "Customer",
            ticketType: newTicketData.ticketType,
            hotelId: newTicketData.hotelId,
            isClosed: newTicketData.isClosed || false,
            createdOn: newTicketData.createdOn,
            createdDate: newTicketData.createdOn
              ? new Date(newTicketData.createdOn).toLocaleDateString()
              : "",
            lastUpdated: newTicketData.createdOn,
            details: newTicketData.supportTicketDetail?.attachmentUrl
              ? [
                  {
                    attachmentURL:
                      newTicketData.supportTicketDetail.attachmentUrl,
                  },
                ]
              : undefined,
          };
          // Add the new ticket to the beginning of the list
          state.tickets.unshift(newTicket);
        }
      })
      .addCase(createSupportTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearCurrentTicket,
  clearError,
  clearListError,
  updateTicketInList,
} = supportTicketSlice.actions;
export default supportTicketSlice.reducer;
