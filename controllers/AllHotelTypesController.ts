import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";

export interface HotelType {
  hotelTypeID: number;
  hotelType: string;
}

/**
 * Get all hotel types
 */
export const getAllHotelTypes = async (): Promise<HotelType[]> => {
  try {
    const response = await axiosInstance.get<HotelType[]>(
      "SignUp/get-all-hotel-types"
    );

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};
