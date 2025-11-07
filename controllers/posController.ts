import { axiosInstance, Pos } from "@/config/axiosConfig";
import { PosTransactionList } from "@/types/pos";

export interface GetPosTableParams {
  tableNo?: string;
  hotelCode?: string;
  hotelPosCenterId?: number;
  isFinished?: boolean;
  token: string;
}

export const getPosTable = async (params: GetPosTableParams): Promise<PosTransactionList> => {
  try {
    const { token, ...queryParams } = params;
    
    const response = await axiosInstance.get(`${Pos}/table`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params: queryParams,
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching POS table data:', error);
    throw error;
  }
};