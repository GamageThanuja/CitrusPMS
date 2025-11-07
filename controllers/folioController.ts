import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";

export interface FolioTransaction {
  accountsTranID: number;
  finAct: boolean;
  tranMasId: number;
  hotelCode: number;
  tranTypeId: number;
  tranType: string;
  reservationId: number;
  reservationDetailId: number;
  accountCode: string;
  accountName: string;
  tranDate: string;
  docNo: string;
  effectiveDate: string;
  comment: string;
  amount: number;
  debit: number;
  credit: number;
  invoiceType: string;
}

/**
 * Fetch Folio transactions by reservation detail ID
 */
export const getFolioByReservationDetailId = async ({
  token,
  reservationDetailId,
}: {
  token: string;
  reservationDetailId: number;
}): Promise<FolioTransaction[]> => {
  try {
    const response = await axiosInstance.get<FolioTransaction[]>(
      `Reservation/Folio/${reservationDetailId}`,
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
