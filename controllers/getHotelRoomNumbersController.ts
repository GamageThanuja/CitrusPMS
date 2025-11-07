import { axiosInstance } from "@/config/axiosConfig";
import { AxiosError } from "axios";
import { HotelRoomNumber } from "@/types/hotelRoomNumber";

export const getHotelRoomNumbers = async ({
  token,
}: {
  token: string;
}): Promise<HotelRoomNumber[]> => {
  try {
    const response = await axiosInstance.get<HotelRoomNumber[]>(
      `HotelRoomNumber`,
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
