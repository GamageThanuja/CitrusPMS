

export interface GuestProfileByRoomMasterPayload {
  recordId: number | null;
  finAct: boolean | null;
  guestProfileId: number | null;
  reservationDetailId: number | null;
  createdOn: string; // ISO date string
  createdBy: string;
}