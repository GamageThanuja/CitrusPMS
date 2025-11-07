// src/api/hotelRatePlanApi.ts

import { AxiosError } from "axios";
import { axiosInstance, HotelRatePlans } from "@/config/axiosConfig";
import { HotelRatePlanAvailability } from "@/types/hotelRatePlan";

export const getHotelRatePlansAvailability = async ({
  token,
  hotelId,
  startDate,
  endDate,
}: {
  token: string;
  hotelId: number;
  startDate: string;
  endDate: string;
}): Promise<HotelRatePlanAvailability[]> => {
  try {
    const response = await axiosInstance.get<HotelRatePlanAvailability[]>(
      `${HotelRatePlans}/availability/${hotelId}`,
      {
        params: { startDate, endDate },
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
