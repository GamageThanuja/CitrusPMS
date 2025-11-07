import { axiosInstance, HotelRoomType } from "@/config/axiosConfig";
import { AxiosError } from "axios";
import { HotelRoomType as PutHotelRoomType } from "@/types/hotelRoomType";

/**
 * Updates an existing Hotel Room Type by ID.
 *
 * @param token - Bearer authorization token
 * @param id - ID of the HotelRoomType to update
 * @param payload - The updated data to send
 * @returns The updated HotelRoomType object
 */
export const updateHotelRoomType = async ({
  token,
  id,
  payload,
}: {
  token: string;
  id: number;
  payload: PutHotelRoomType;
}): Promise<PutHotelRoomType> => {
  try {
    const response = await axiosInstance.put<PutHotelRoomType>(
      `${HotelRoomType}/${id}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
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
