import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";

/**
 * User model
 */
export interface HotelUser {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  status: number;
  lastActive: string;
  registeredDate: string;
}

/**
 * Get users by hotel ID
 */
export const getUsersByHotel = async ({
  token,
  hotelId,
}: {
  token: string;
  hotelId: number;
}): Promise<HotelUser[]> => {
  try {
    const response = await axiosInstance.get<HotelUser[]>(
      `User/get-users-by-hotel/${hotelId}`,
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
