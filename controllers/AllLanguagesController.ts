import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";

export interface Language {
  languageID: number;
  languageCode: string;
  language: string;
}

/**
 * Get all languages
 */
export const getAllLanguages = async (): Promise<Language[]> => {
  try {
    const response = await axiosInstance.get<Language[]>(
      "SignUp/get-all-languages"
    );

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};
