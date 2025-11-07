import { AxiosError } from "axios";
import { axiosInstance, ReasonsMaster } from "@/config/axiosConfig";
import { ReasonMasterPayload } from "@/types/reasonsMaster";

/**
 * Fetches all reason master records
 * @param token - Authentication token
 * @returns Promise with array of reasons
 */
export const getReasons = async ({
  token,
}: {
  token: string;
}): Promise<ReasonMasterPayload[]> => {
  try {
    const response = await axiosInstance.get(ReasonsMaster, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
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

/**
 * Creates a new reason master record
 * @param token - Authentication token
 * @param payload - The reason data to be created
 * @returns Promise with the created reason data
 */
export const createReason = async ({
  token,
  payload,
}: {
  token: string;
  payload: Omit<ReasonMasterPayload, 'reasonId'>;
}): Promise<ReasonMasterPayload> => {
  try {
    const response = await axiosInstance.post(ReasonsMaster, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};

