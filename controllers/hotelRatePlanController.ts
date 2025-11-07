import { AxiosError } from "axios";
import { axiosInstance, HotelRatePlans } from "@/config/axiosConfig";
import { HotelRatePlan } from "@/types/hotelRatePlan";

export const getHotelRatePlans = async ({
  token,
  hotelId,
  isCmActive = false,
}: {
  token: string;
  hotelId: number;
  isCmActive?: boolean;
}): Promise<HotelRatePlan[]> => {
  try {
    const response = await axiosInstance.get<HotelRatePlan[]>(
      `${HotelRatePlans}/hotel/${hotelId}`,
      {
        params: {
          isCmActive,
        },
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

export const createHotelRatePlan = async ({
  token,
  payload,
}: {
  token: string;
  payload: HotelRatePlan;
}): Promise<void> => {
  try {
    const response = await axiosInstance.post(`${HotelRatePlans}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    throw error as AxiosError;
  }
};
