import { axiosInstance } from "@/config/axiosConfig";
import { AxiosError } from "axios";

export interface InviteUserPayload {
  fullName: string;
  email: string;
  password: string;
  role: string;
  hotelId: number;
  modules: number[];
}

export const inviteUser = async ({
  token,
  payload,
}: {
  token: string;
  payload: InviteUserPayload;
}): Promise<void> => {
  try {
    const response = await axiosInstance.post(`User/invite-user`, payload, {
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
