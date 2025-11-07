// redux/slices/signalRSlice.ts
import { createSlice } from "@reduxjs/toolkit";

interface SignalRState {
  connected: boolean;
  latestNotification: any | null;
}

const initialState: SignalRState = {
  connected: false,
  latestNotification: null,
};

const signalRSlice = createSlice({
  name: "signalR",
  initialState,
  reducers: {
    signalRConnected: (state) => {
      state.connected = true;
    },
    signalRDisconnected: (state) => {
      state.connected = false;
    },
    setLatestNotification: (state, action) => {
      state.latestNotification = action.payload;
    },
  },
});

export const { signalRConnected, signalRDisconnected, setLatestNotification } =
  signalRSlice.actions;
export default signalRSlice.reducer;
