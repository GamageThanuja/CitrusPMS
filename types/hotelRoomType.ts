export type HotelRoomType = {
  hotelRoomTypeID: number;
  hotelID: number;
  roomType: string;
  adultSpace: number;
  childSpace: number;
  noOfRooms: number;
  cmid: string | null;
  createdTimeStamp: string;
  createdBy: string;
  updatedBy: string | null;
  finAct: boolean;
  updatedTimeStamp: string | null;
  roomDescription: string | null;
}
