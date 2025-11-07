import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";
import { GlAccount } from "@/types/glAccounts";


/**
 * Fetch all GL accounts.
 */
export const getGlAccounts = async ({
  token,
}: {
  token: string;
}): Promise<GlAccount[]> => {
  try {
    const response = await axiosInstance.get<GlAccount[]>("GlAccount", {
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
