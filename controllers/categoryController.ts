import { AxiosError } from "axios";
import { axiosInstance, CategoryMaster } from "@/config/axiosConfig";
import { Category } from "@/types/category";

export const getCategory = async ({
  token,
  hotelId,
}: {
  token: string;
  hotelId: number;
}) => {
  try {
    const response = await axiosInstance.get<Category[]>(
      `${CategoryMaster}/get-all-categories`,
      {
        params: { hotelId },
        headers: {
          Authorization: `Bearer ${token}`,
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

export interface CreateCategoryPayload {
  categoryID: number;
  hotelID: number;
  categoryName: string;
  finAct: boolean;
}

/**
 * Create a new category
 */
export const createCategory = async ({
  token,
  payload,
}: {
  token: string;
  payload: CreateCategoryPayload;
}): Promise<void> => {
  try {
    const response = await axiosInstance.post(
      `CategoryMaster/create-category`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    throw error as AxiosError;
  }
};
