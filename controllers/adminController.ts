import { AxiosError } from "axios";

import { AllUsersResponse } from "@/types/admin";
import { Admin, axiosInstance } from "@/config/axiosConfig";

export const getAllUsers = async ({ token }: { token: string }) => {
  try {
    const response = await axiosInstance.get<AllUsersResponse[]>(
      `${Admin}/all-users`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status != 200)
      throw new Error(`HTTP error! Status: ${response.status}`);

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};
