export interface PosCenter {
  hotelPosCenterId: number;
  hotelId: number;
  posCenter: string;
  serviceCharge: number;
  taxes: number;
  createdBy: string;
  createdOn: string;
}

export interface ItemByPosCenter {
  recordId: number;
  hotelId: number;
  itemId: number;
  hotelPosCenterId: number;
}
