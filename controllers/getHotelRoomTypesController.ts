import {
  axiosInstance,
  HotelRoomType as GetHotelRoomType,
} from "@/config/axiosConfig";
import { AxiosError } from "axios";
import { HotelRoomType } from "@/types/hotelRoomType";

export const getHotelRoomTypes = async ({
  token,
  hotelId,
  isCmActive = false,
}: {
  token: string;
  hotelId: number;
  isCmActive?: boolean;
}): Promise<HotelRoomType[]> => {
  try {
    const response = await axiosInstance.get<HotelRoomType[]>(
      `${GetHotelRoomType}/hotel/${hotelId}`,
      {
        params: { isCmActive },
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

export const getAllHotelRoomTypes = async ({
  token,
  isCmActive = false,
}: {
  token: string;
  isCmActive?: boolean;
}): Promise<HotelRoomType[]> => {
  try {
    const response = await axiosInstance.get<HotelRoomType[]>(
      `${GetHotelRoomType}`,
      {
        params: { isCmActive },
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
