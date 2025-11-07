import { axiosInstance } from "@/config/axiosConfig";
import { HotelImage } from "@/types/admin";
import { AxiosError } from "axios";

/**
 * Fetches all images for a specific hotel.
 * @param token Bearer token for authentication
 * @param hotelId The hotel ID
 * @returns Promise<HotelImage[]>
 */
export const getHotelImages = async ({
  token,
  hotelId,
}: {
  token: string;
  hotelId: number;
}): Promise<HotelImage[]> => {
  try {
    const response = await axiosInstance.get<HotelImage[]>(
      `/HotelImage/hotel/${hotelId}`,
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

export const createHotelImage = async ({
  token,
  payload,
}: {
  token: string;
  payload: HotelImage;
}): Promise<HotelImage> => {
  try {
    const response = await axiosInstance.post<HotelImage>(
      `HotelImage`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};

export const deleteHotelImage = async ({
  token,
  imageId,
}: {
  token: string;
  imageId: number;
}): Promise<void> => {
  try {
    const response = await axiosInstance.delete(`HotelImage/${imageId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    throw error as AxiosError;
  }
};
