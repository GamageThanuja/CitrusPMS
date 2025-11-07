import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";
import { RateDetailPayload } from "@/types/rateDetails";


/**
 * Fetch reservation rate details by Reservation Detail ID
 */
export const getRateDetailsByReservationDetailId = async ({
  token,
  reservationDetailId,
}: {
  token: string;
  reservationDetailId: number;
}): Promise<RateDetailPayload[]> => {
  try {
    const response = await axiosInstance.get<RateDetailPayload[]>(
      `Reservation/RateDetails/${reservationDetailId}`,
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
