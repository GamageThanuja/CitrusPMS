import { axiosInstance , GuestProfileByRoomMaster} from "../config/axiosConfig";
import { AxiosError} from "axios";
import { GuestProfileByRoomMasterPayload } from "@/types/guestProfileByRoomMaster";

export const getGuestRoomMasterProfilesByReservationDetailId = async (
  reservationDetailId: number,
  token: string
): Promise<GuestProfileByRoomMasterPayload[]> => {
  try {
    const response = await axiosInstance.get<GuestProfileByRoomMasterPayload[]>(
      `${GuestProfileByRoomMaster}/by-reservation-detail/${reservationDetailId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      return response.data;
    }

    throw new Error("Failed to fetch guest profiles.");
  } catch (error) {
    throw (error as AxiosError).response?.data || error;
  }
};
