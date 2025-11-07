

import { axiosInstance , Country } from "../config/axiosConfig";
import { CountryPayload } from "@/types/country";


export const getAllCountries = async (token: string): Promise<CountryPayload[]> => {
  try {
    const response = await axiosInstance.get<CountryPayload[]>(`${Country}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      return response.data;
    }

    throw new Error("Failed to fetch currencies.");
  } catch (error: any) {
    throw error?.response?.data || error;
  }
};