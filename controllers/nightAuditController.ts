import { axiosInstance } from "@/config/axiosConfig";
import { CreateNightAuditPayload } from "@/types/nightAudit";
import { AxiosError } from "axios";


export const createNightAudit = async ({
  token,
  payload,
}: {
  token: string;
  payload: CreateNightAuditPayload;
}): Promise<void> => {
  try {
    const response = await axiosInstance.post("NightAudit", payload, {
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
