import { AxiosError } from "axios";
import {
  axiosInstance,
  ItemMaster as ItemMasterEndpoint,
} from "@/config/axiosConfig";
import { ItemMaster } from "@/types/ItemMaster";

export const getItemMaster = async ({
  token,
  hotelId,
}: {
  token: string;
  hotelId: number;
}): Promise<ItemMaster[]> => {
  try {
    const response = await axiosInstance.get<ItemMaster[]>(
      `${ItemMasterEndpoint}/hotel/${hotelId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};

export interface ItemMasterPayload {
  categoryID: number | null;
  itemID: number;
  hotelID: number;
  itemCode: string;
  itemName: string;
  description: string;
  salesAccountID: number;
  price: number;
  imageURL: string;
  finAct: boolean;
  createdBy: string;
  createdOn: string;
  updatedBy: string;
  updatedOn: string;
}

/**
 * Create ItemMaster
 */
export const createItemMaster = async ({
  token,
  payload,
}: {
  token: string;
  payload: ItemMasterPayload;
}): Promise<void> => {
  try {
    const response = await axiosInstance.post(`ItemMaster`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    throw error as AxiosError;
  }
};
