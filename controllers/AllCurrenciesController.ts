import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";

export interface Currency {
  currencyId: number;
  currencyCode: string;
  currencyName: string;
}

/**
 * Get all currencies
 */
export const getAllCurrencies = async (): Promise<Currency[]> => {
  try {
    const response = await axiosInstance.get<Currency[]>(
      "SignUp/get-all-currencies"
    );

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};
