import { AxiosError } from "axios";

import { Hotel } from "@/types/admin";
import { Admin, axiosInstance } from "@/config/axiosConfig";

export const getAdminAllHotels = async ({ token }: { token: string }) => {
  try {
    const response = await axiosInstance.get<Hotel[]>(`${Admin}/all-hotels`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status != 200)
      throw new Error(`HTTP error! Status: ${response.status}`);

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};
