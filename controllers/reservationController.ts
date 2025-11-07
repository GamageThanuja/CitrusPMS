import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";
import {
  Reservation,
  BookingFeedPayload,
  BookingFeedResponse,
  ReservationStatus,
  ReservationCashPayout,
  UpdateRoomRate,
} from "@/types/reservation";

export const getReservationById = async ({
  token,
  reservationId,
}: {
  token: string;
  reservationId: number;
}): Promise<Reservation> => {
  try {
    const response = await axiosInstance.get<Reservation>(
      `Reservation/${reservationId}`,
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

export const checkInReservationDetail = async ({
  token,
  reservationDetailId,
  payload,
}: {
  token: string;
  reservationDetailId: number;
  payload: {
    reservationDetailId: number;
    reservationStatusId: number;
    checkINat: string;
    checkedInBy: string;
    guestProfileId: number;
    isRepeatGuest: boolean;
  };
}): Promise<any> => {
  try {
    const response = await axiosInstance.put(
      `Reservation/CheckIn/${reservationDetailId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error during check-in:", error);
    throw error as AxiosError;
  }
};

/**
 * Creates a new booking via the booking feed API
 */
export const createBookingViaFeed = async ({
  token,
  payload,
}: {
  token: string;
  payload: BookingFeedPayload;
}): Promise<BookingFeedResponse> => {
  try {
    const response = await axiosInstance.post(
      `Reservation/booking-feed`,
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

    return response.data;
  } catch (error) {
    console.error("Error creating booking via feed:", error);
    throw error as AxiosError;
  }
};

export const getAllReservations = async ({
  token,
  hotelId,
}: {
  token: string;
}): Promise<Reservation[]> => {
  try {
    const response = await axiosInstance.get<Reservation[]>(`Reservation`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        hotelId,
      },
    });

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching all reservations:", error);
    throw error as AxiosError;
  }
};

export const getReservationStatusCodes = async ({
  token,
}: {
  token: string;
}): Promise<ReservationStatus[]> => {
  try {
    const response = await axiosInstance.get<ReservationStatus[]>(
      `Reservation/status-codes`,
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
    console.error("Error fetching all reservations:", error);
    throw error as AxiosError;
  }
};

export const createReservationCashPayout = async ({
  token,
  payload,
}: {
  token: string;
  payload: ReservationCashPayout;
}): Promise<void> => {
  try {
    const response = await axiosInstance.post(
      `Reservation/cash-payout`,
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
    console.error("Error posting reservation cash payout:", error);
    throw error as AxiosError;
  }
};

export const updateRoomRates = async ({
  token,
  payload,
}: {
  token: string;
  payload: UpdateRoomRate[];
}): Promise<{ message: string }> => {
  try {
    const response = await axiosInstance.put(
      `Reservation/UpdateRoomRates`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error updating room rates:", error);
    throw error as AxiosError;
  }
};

export const checkOutReservation = async ({
  token,
  reservationDetailId,
  reservationStatusId,
  checkOutAt,
  checkedOutBy,
}: {
  token: string;
  reservationDetailId: number;
  reservationStatusId: number;
  checkOutAt: string;
  checkedOutBy: string;
}): Promise<{ message: string }> => {
  try {
    const response = await axiosInstance.put(
      `Reservation/CheckOut/${reservationDetailId}`,
      {
        reservationDetailId,
        reservationStatusId,
        checkOutAt,
        checkedOutBy,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error during check-out:", error);
    throw error as AxiosError;
  }
};

export const changeRoomForReservation = async ({
  token,
  reservationDetailId,
  newRoomId,
}: {
  token: string;
  reservationDetailId: number;
  newRoomId: number;
}): Promise<{ message: string }> => {
  try {
    const response = await axiosInstance.put(
      `Reservation/change-room`,
      {
        reservationDetailId,
        newRoomId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return { message: "Room changed successfully" };
  } catch (error) {
    console.error("Error changing room for reservation:", error);
    throw error as AxiosError;
  }
};

export const updateReservationNameCurrency = async ({
  token,
  reservationId,
  payload,
}: {
  token: string;
  reservationId: number;
  payload: {
    property_id: string;
    hotel_id: number;
    ota_name: string;
    currency: string;
  };
}): Promise<any> => {
  try {
    const response = await axiosInstance.put(
      `Reservation/${reservationId}/update-name-currency`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error updating reservation name and currency:", error);
    throw error as AxiosError;
  }
};
