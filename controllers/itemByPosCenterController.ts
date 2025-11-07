import { AxiosError } from "axios";
import {
  axiosInstance,
  ItemByPosCenter as ItemByPosCenterEndpoint,
} from "@/config/axiosConfig";
import { ItemByPosCenter } from "@/types/ItemByPosCenter";

export const getItemsByPosCenter = async ({
  token,
  hotelId,
}: {
  token: string;
  hotelId: number;
}): Promise<ItemByPosCenter[]> => {
  try {
    const response = await axiosInstance.get<ItemByPosCenter[]>(
      `${ItemByPosCenterEndpoint}/hotel/${hotelId}`,
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

export interface ItemByPosCenterPayload {
  hotelId: number;
  itemId: number;
  hotelPosCenterId: number;
}

export const createItemByPosCenter = async ({
  token,
  payload,
}: {
  token: string;
  payload: ItemByPosCenterPayload;
}): Promise<void> => {
  try {
    const response = await axiosInstance.post(`ItemByPosCenter`, payload, {
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
