import { axiosInstance } from "@/config/axiosConfig";
import { AxiosError } from "axios";

/**
 * A single HotelRoomTypeImage record
 */
export interface HotelRoomTypeImage {
  imageID: number;
  hotelID: number;
  hotelRoomTypeID: number;
  imageURL: string;
  description: string;
  isMain: boolean;
  finAct: boolean;
  createdOn: string;
  createdBy: string;
  updatedOn: string | null;
  updatedBy: string | null;
  base64Image: string | null;
  imageFileName: string | null;
}

/**
 * Get all room type images for a given hotelId
 */
export const getHotelRoomTypeImages = async ({
  token,
  hotelId,
}: {
  token: string;
  hotelId: number;
}): Promise<HotelRoomTypeImage[]> => {
  try {
    const response = await axiosInstance.get<HotelRoomTypeImage[]>(
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
