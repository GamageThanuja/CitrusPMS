import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";
import { HotelRoomType } from "@/types/hotelRoomType";


export const getHotelRoomTypes = async ({
  token,
  hotelId,
  isCmActive,
}: {
  token: string;
  hotelId: number;
  isCmActive?: boolean;
}): Promise<HotelRoomType[]> => {
  try {
    const response = await axiosInstance.get<HotelRoomType[]>(
      `HotelRoomType/hotel/${hotelId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: isCmActive !== undefined ? { isCmActive } : {},
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


export const createHotelRoomType = async ({
  token,
  payload,
}: {
  token: string;
  payload: HotelRoomType;
}): Promise<void> => {
  try {
    const response = await axiosInstance.post(`HotelRoomType`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    throw error as AxiosError;
  }
};
