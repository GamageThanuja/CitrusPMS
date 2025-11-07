import { HotelIPG } from "@/types/hotelIPG";
import {
  HotelIPG as HotelIPGEndpoint,
  axiosInstance,
} from "@/config/axiosConfig";
import { AxiosError } from "axios";

export const getAllHotelIPG = async ({ token }: { token: string }) => {
  try {
    const response = await axiosInstance.get<HotelIPG[]>(
      `${HotelIPGEndpoint}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status !== 200)
      throw new Error(`HTTP error! Status: ${response.status}`);

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};

export const getHotelIPGByHotelId = async ({
  token,
  hotelId,
}: {
  token: string;
  hotelId: number;
}) => {
  try {
    const response = await axiosInstance.get<HotelIPG[]>(
      `${HotelIPGEndpoint}/by-hotel/${hotelId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status !== 200)
      throw new Error(`HTTP error! Status: ${response.status}`);

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};
