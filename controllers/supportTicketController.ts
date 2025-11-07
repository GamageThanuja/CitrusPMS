// src/api/supportTicket.ts
import { axiosInstance } from "@/config/axiosConfig";
import { SupportTicket } from "@/types/supportTicket";
import { AxiosError } from "axios";

/**
 * Define the payload type for creating a Support Ticket.
 */
export interface SupportTicketPayload {
  hotelId: number;
  subject: string;
  createdBy: string;
  ticketType: string;
  priority: string;
  assignedTo: string;
  createdOn: string;
  supportTicketDetail: {
    supportTicketId: number;
    ticketUpdateText: string;
    attachmentUrl: string;
    createBy: string;
  };
}

/**
 * Create a new Support Ticket.
 */
export const createSupportTicket = async ({
  token,
  payload,
}: {
  token: string;
  payload: SupportTicketPayload;
}): Promise<void> => {
  try {
    const response = await axiosInstance.post(`SupportTicket`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    throw error as AxiosError;
  }
};

export const getSupportTicketsForHotel = async ({
  token,
  hotelId,
}: {
  token: string;
  hotelId: number;
}): Promise<SupportTicket[]> => {
  try {
    const response = await axiosInstance.get<SupportTicket[]>(
      `/SupportTicket/hotel/${hotelId}`,
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
