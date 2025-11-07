export interface ReservationAttachment {
  attachmentID: number;
  reservationID: number;
  reservationDetailID: number;
  attachmentURL: string;
  fileName: string;
  fileType: string;
  description: string;
  createdOn: string;
  createdBy: string;
  updatedOn: string | null;
  updatedBy: string | null;
  finAct: boolean;
}
