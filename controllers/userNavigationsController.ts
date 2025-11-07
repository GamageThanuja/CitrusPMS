import { axiosInstance } from "@/config/axiosConfig";
import { AxiosError } from "axios";

export interface UserNavigation {
  userGUID: string;
  hotelId: number;
  moduleID: number;
  moduleName: string;
  m_Icon: string;
  w_Icon: string;
  finAct: boolean;
  m_Route: string;
  w_Route: string;
  navigator: string;
  m_NavIcon: string;
  w_NavIcon: string;
  m_NavRoute: string;
  w_NavRoute: string;
  isPermited: boolean;
  subModules: string[];
}

export const getUserNavigationsByHotelId = async ({
  token,
  hotelId,
}: {
  token: string;
  hotelId: number;
}): Promise<UserNavigation[]> => {
  try {
    const response = await axiosInstance.get<UserNavigation[]>(
      `Admin/user-navigations/hotel-id/${hotelId}`,
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
