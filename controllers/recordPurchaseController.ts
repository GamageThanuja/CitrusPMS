import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";

export interface RecordPurchasePayload {
  accountIdDebit: number;
  accountIdCredit: number;
  hotelCode: string;
  finAct: boolean;
  tranTypeId: number;
  tranDate: string;
  effectiveDate: string;
  docNo: string;
  createdOn: string;
  tranValue: number;
  nameId: number;
  chequeNo: string;
  paymentMethod: string;
  chequeDate: string;
  exchangeRate: number;
  debit: number;
  amount: number;
  comment: string;
  createdBy: string;
  currAmount: number;
  currencyCode: string;
  convRate: string;
  credit: number;
  paymentReceiptRef: string;
  remarks: string;
  dueDate: string;
  refInvNo: string;
}

/**
 * Record a purchase transaction
 */
export const recordPurchase = async ({
  token,
  payload,
}: {
  token: string;
  payload: RecordPurchasePayload;
}): Promise<void> => {
  try {
    const response = await axiosInstance.post(
      `Purchase/record-purchase`,
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
