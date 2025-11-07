import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";

export interface RateCode {
  rateCodeID: number;
  rateCode: string;
  description: string;
  createdOn: string | null;
  createdBy: string | null;
}

/**
 * Fetch all rate codes.
 */
export const getAllRateCodes = async ({
  token,
}: {
  token: string;
}): Promise<RateCode[]> => {
  try {
    const response = await axiosInstance.get<RateCode[]>("RateCode", {
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
