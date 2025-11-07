

import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";
import { RateCode } from "@/types/rateCode";

// Get all rate codes
export const getRateCodes = async ({
  token,
}: {
  token: string;
}): Promise<RateCode[]> => {
  try {
    const response = await axiosInstance.get<RateCode[]>("/RateCode", {
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

// Get a single rate code by ID
export const getRateCodeById = async ({
  token,
  id,
}: {
  token: string;
  id: number;
}): Promise<RateCode> => {
  try {
    const response = await axiosInstance.get<RateCode>(`/RateCode/${id}`, {
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