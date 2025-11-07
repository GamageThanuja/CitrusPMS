import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";
import { RoomType } from "@/types/roomType";



/**
 * Fetch all Room Types
 */
export const getRoomTypes = async ({
  token,
}: {
  token: string;
}): Promise<RoomType[]> => {
  try {
    const response = await axiosInstance.get<RoomType[]>(`RoomType`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};

export const getRoomTypeById = async ({
  token,
  roomTypeId,
}: {
  token: string;
  roomTypeId: number;

}): Promise<RoomType[]> => {
  try {
    const response = await axiosInstance.get<RoomType[]>(`RoomType"/${roomTypeId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};
