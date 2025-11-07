import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";
import {  NameMasterPayload } from "@/types/nameMaster";

/**
 * NameMaster type
 */

/**
 * Fetch all NameMaster records
 */
export const getNameMasters = async ({
  token,
}: {
  token: string;
}): Promise<NameMasterPayload[]> => {
  try {
    // Fix the endpoint URL - add 'api/' prefix
    const response = await axiosInstance.get<NameMasterPayload[]>(`NameMaster`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching name masters:", error);
    // Return an empty array instead of throwing to avoid breaking the UI
    return [];
  }
};


/**
 * Create a NameMaster record (Supplier, Customer, etc.)
 */
export const createNameMaster = async ({
  token,
  payload,
}: {
  token: string;
  payload: NameMasterPayload;
}): Promise<void> => {
  try {
    // Fix the endpoint URL - add 'api/' prefix
    const response = await axiosInstance.post(`NameMaster`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error creating name master:", error);
    // Re-throw the error since the caller needs to know if creation failed
    throw error as AxiosError;
  }
};

/**
 * Update a NameMaster record by ID
 */
export const updateNameMaster = async ({
  token,
  id,
  payload,
}: {
  token: string;
  id: number;
  payload: NameMasterPayload;
}): Promise<void> => {
  try {
    const response = await axiosInstance.put(`NameMaster/${id}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error updating name master:", error);
    throw error as AxiosError;
  }
};
