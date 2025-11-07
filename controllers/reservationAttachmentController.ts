import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";
import { ReservationAttachment } from "@/types/reservationAttachment";


/**
 * Get reservation attachments by Reservation Detail ID
 */
export const getReservationAttachments = async ({
  token,
  reservationDetailId,
}: {
  token: string;
  reservationDetailId: number;
}): Promise<ReservationAttachment[]> => {
  try {
    const response = await axiosInstance.get<ReservationAttachment[]>(
      `/ReservationAttachment/reservation-detail/${reservationDetailId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};

export interface ReservationAttachmentPayload {
  reservationID: number;
  reservationDetailID: number;
  description: string;
  createdBy: string;
  base64File: string;
  originalFileName: string;
}

/**
 * Create a reservation attachment.
 */
export const createReservationAttachment = async ({
  token,
  payload,
}: {
  token: string;
  payload: ReservationAttachmentPayload;
}): Promise<void> => {
  try {
    const response = await axiosInstance.post(
      `ReservationAttachment`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    throw error as AxiosError;
  }
};
