import { axiosInstance } from "@/config/axiosConfig";
import { AxiosError } from "axios";

/**
 * Define the type of a single Report.
 */
export interface ReportMaster {
  reportID: number;
  finAct: boolean;
  reportCategory: string;
  reportName: string;
  engine: string;
  reportURL: string;
}

export const getAllReports = async ({
  token,
}: {
  token: string;
}): Promise<ReportMaster[]> => {
  try {
    const response = await axiosInstance.get<ReportMaster[]>("ReportMaster", {
      headers: {
        Authorization: `Bearer ${token}`,
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
