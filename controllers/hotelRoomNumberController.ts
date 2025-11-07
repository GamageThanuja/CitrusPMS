import { axiosInstance } from "@/config/axiosConfig";
import { HotelRoomNumber } from "@/types/hotelRoomNumber";
import { AxiosError } from "axios";

export const createHotelRoomNumber = async ({
  token,
  payload,
}: {
  token: string;
  payload: HotelRoomNumber;
}): Promise<void> => {
  try {
    const response = await axiosInstance.post("HotelRoomNumber", payload, {
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

export const getHotelRoomNumbersByHotelId = async ({
  token,
  hotelId,
}: {
  token: string;
  hotelId: number;
}): Promise<HotelRoomNumber[]> => {
  try {
    const response = await axiosInstance.get<HotelRoomNumber[]>(
      `HotelRoomNumber/hotel-id/${hotelId}`,
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
