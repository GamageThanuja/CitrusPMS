import { axiosInstance } from "@/config/axiosConfig";
import { AxiosError } from "axios";

// Define the payload type based on the API response
export interface FolioAttachmentPayload {
  recordID: number;
  folioID: number;
  fileName: string;
  url: string;
  fileType: string;
  resNo: string;
  base64File: string | null;
  bucketName: string | null;
}

/** ---- Get all folio attachments ---- */
export const getFolioAttachments = async (): Promise<FolioAttachmentPayload[]> => {
  try {
    const response = await axiosInstance.get<FolioAttachmentPayload[]>(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/FolioAttachment`
    );

    // Optional, Axios usually throws on non-2xx
    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};

/** ---- Create a folio attachment ---- */
export const createFolioAttachment = async ({
  payload,
}: {
  payload: FolioAttachmentPayload;
}): Promise<void> => {
  try {
    const response = await axiosInstance.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/FolioAttachment`,
      payload,
      {
        headers: {
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
