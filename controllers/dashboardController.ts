import { AxiosError } from "axios";

import { AgentPerformance } from "@/types/dashboard";
import { Dashboard, axiosInstance } from "@/config/axiosConfig";

export const getAgentPerformance = async ({
  token,
  hotelId,
  startDate,
  endDate,
}: {
  token: string;
  hotelId: number;
  startDate: string;
  endDate: string;
}) => {
  try {
    const response = await axiosInstance.get<AgentPerformance[]>(
      `${Dashboard}/performance-by-agent`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          hotelId,
          startDate,
          endDate,
        },
      }
    );

    if (response.status !== 200)
      throw new Error(`HTTP error! Status: ${response.status}`);

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};