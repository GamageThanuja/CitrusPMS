import * as signalR from "@microsoft/signalr";

export let signalRConnection: signalR.HubConnection;

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const startSignalRConnection = async (
  callback: (data: any) => void,
  onStatusChange?: (status: "connected" | "disconnected" | "error") => void
) => {
  try {
    signalRConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}/hubs/reservation`)
      .withAutomaticReconnect()
      .build();

    signalRConnection.on("ReceiveReservationNotification", callback);

    signalRConnection.onclose(() => {
      console.log("SignalR disconnected");
      if (onStatusChange) onStatusChange("disconnected");
    });

    await signalRConnection.start();
    console.log("✅ SignalR connected");
    if (onStatusChange) onStatusChange("connected");
  } catch (error) {
    console.error("❌ SignalR error", error);
    if (onStatusChange) onStatusChange("error");
  }
};

export const stopSignalRConnection = async () => {
  if (signalRConnection) {
    await signalRConnection.stop();
  }
};
