import { HotelRoomType } from "./hotelRoomType";

export type HotelMaster = {
  hotelID: number;
  hotelGUID: string;
  finAct: boolean;
  hotelName: string;
  hotelCode: number;
  userGUID_HotelOwner: string;
  hotelType: string;
  hotelAddress: string;
  city: string;
  zipCode: string;
  country: string;
  hotelPhone: string;
  hotelEmail: string;
  hotelWeb: string;
  noOfRooms: number;
  latitude: string;
  longitude: string;
  currencyCode: string;
  languageCode: string;
  createdOn: string;
  createdTimeStamp: string;
  lastUpdatedOn: string | null;
  lastUpdatedTimeStamp: string | null;
  lastUpdatedBy_UserGUID: string;
  starCatgeory: number;
  cM_PropertyID: string;
  isCMActive: boolean;
  hotelDate: string;
  isOnTrial: boolean | null;
  planId: number | null;
  hotelImage?: {
    url: string;
    altText?: string;
    width?: number;
    height?: number;
  } | null;
  lowestRate: number;
}

export type HotelRoomNumber = {
  roomID: number;
  hotelID: number;
  hotelMaster: HotelMaster;
  roomTypeID: number;
  hotelRoomType: HotelRoomType;
  roomNo: string;
  finAct: boolean;
  createdOn: string;
  createdBy: string;
}
