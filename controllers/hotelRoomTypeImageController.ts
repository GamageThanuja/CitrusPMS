import { axiosInstance } from "@/config/axiosConfig";
import { HotelRoomTypeImagePayload } from "@/types/hotelRoomTypeImage";
import { AxiosError } from "axios";


export const getHotelRoomTypeImages = async ({
  token,
  hotelId,
}: {
  token: string;
  hotelId: number;
}): Promise<HotelRoomTypeImagePayload[]> => {
  try {
    const response = await axiosInstance.get<HotelRoomTypeImagePayload[]>(
      `HotelRoomTypeImage/hotel/${hotelId}`,
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

export const createHotelRoomTypeImage = async ({
  token,
  payload,
}: {
  token: string;
  payload: HotelRoomTypeImagePayload;
}): Promise<void> => {
  try {
    const response = await axiosInstance.post(`HotelRoomTypeImage`, payload, {
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
