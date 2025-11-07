import { axiosInstance } from "@/config/axiosConfig";
import { CreateReservationActivityLogPayload, ReservationActivityLog } from "@/types/reservationActivityLog";
import { AxiosError } from "axios";


export const createReservationActivityLog = async ({
  token,
  payload,
}: {
  token: string;
  payload: CreateReservationActivityLogPayload;
}): Promise<void> => {
  try {
    const response = await axiosInstance.post(
      `ReservationActivityLog`,
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
    console.error("Error creating reservation activity log:", error);
    throw error as AxiosError;
  }
};



export const getReservationActivityLog = async ({
  token,
  hotelId,
  reservationId,
  username,
  page = 1,
  pageSize = 10,
}: {
  token: string;
  hotelId: number;
  reservationId: number;
  username?: string;
  page?: number;
  pageSize?: number;
}): Promise<ReservationActivityLog> => {
  try {
    const response = await axiosInstance.get<ReservationActivityLog>(
      `ReservationActivityLog`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          hotelId,
          reservationId,
          ...(username ? { username } : {}),
          page,
          pageSize,
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
