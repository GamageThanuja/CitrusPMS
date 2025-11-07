import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";

export interface CancelReservationPayload {
  reservationDetailId: number;
  reservationStatusId: number;

  status: string;
  cancelReason: string;
  cancelledBy: string;
  cancelledOn: string;
}

/**
 * Cancel a reservation room by reservationDetailId
 */
export const cancelReservationRoom = async ({
  token,
  reservationDetailId,
  payload,
}: {
  token: string;
  reservationDetailId: number;
  payload: CancelReservationPayload;
}): Promise<void> => {
  try {
    const response = await axiosInstance.put(
      `/Reservation/Cancel/room/${reservationDetailId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    throw error as AxiosError;
  }
};

export interface CancelReservationPayload {
  reservationDetailId: number;
  reservationStatusId: number;
  status: string;
  cancelReason: string;
  cancelledBy: string;
  cancelledOn: string;
}

export const cancelReservation = async ({
  token,
  reservationDetailId,
  payload,
}: {
  token: string;
  reservationDetailId: number;
  payload: CancelReservationPayload;
}): Promise<void> => {
  try {
    const response = await axiosInstance.put(
      `Reservation/Cancel/reservation/${reservationDetailId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    throw error as AxiosError;
  }
};
