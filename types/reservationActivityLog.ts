export type CreateReservationActivityLogPayload = {
  logId?: number;
  username: string;
  hotelId: number;
  reservationId: number;
  reservationDetailId: number;
  resLog: string;
  createdOn: string;
  platform: string;
  reservationNo?: string;
  roomNumber?: string;
  hotel?: any; // If you want, define a Hotel type instead of any
}

export type ReservationActivityLog = {
  logs: {
    activityLogID: number;
    reservationID: number;
    activity: string;
    createdOn: string;
    createdBy: string;
  }[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
}
