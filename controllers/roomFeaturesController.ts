import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";

export interface RoomFeature {
  roomFeatureID: number;
  featureCategory: string;
  featureName: string;
}

/**
 * Fetch all room features
 */
export const getRoomFeatures = async ({
  token,
}: {
  token: string;
}): Promise<RoomFeature[]> => {
  try {
    const response = await axiosInstance.get<RoomFeature[]>("RoomFeature", {
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
