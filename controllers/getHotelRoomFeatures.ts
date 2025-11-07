import { axiosInstance, HotelRoomFeature } from "@/config/axiosConfig";
import { AxiosError } from "axios";
import { HotelRoomFeature as HotelRoomFeatureType } from "@/types/hotelRoomFeature";

export const getHotelRoomFeatures = async ({
  token,
  hotelId,
}: {
  token: string;
  hotelId: number;
}): Promise<HotelRoomFeatureType[]> => {
  try {
    const response = await axiosInstance.get<HotelRoomFeatureType[]>(
      `${HotelRoomFeature}/hotel-id/${hotelId}`,
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
