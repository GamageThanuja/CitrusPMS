import { axiosInstance } from "@/config/axiosConfig";
import { AxiosError } from "axios";
import { Hotel } from "@/types/admin";

export const getHotelByGuid = async ({
  token,
  hotelGuid,
}: {
  token: string;
  hotelGuid: string;
}): Promise<Hotel> => {
  try {
    const response = await axiosInstance.get<Hotel[]>(
      `Hotel/hotel-guid/${hotelGuid}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // This endpoint returns an array
    if (!response.data || response.data.length === 0) {
      throw new Error(`No hotel found for GUID: ${hotelGuid}`);
    }

    return response.data[0];
  } catch (error) {
    throw error as AxiosError;
  }
};
