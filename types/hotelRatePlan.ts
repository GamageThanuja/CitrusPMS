export interface HotelRatePlan {
  hotelID: number;
  hotelMaster: HotelMaster;
  rateCodeID: number;
  rateCode: RateCode;
  title: string;
  hotelRoomType: HotelRoomType;
  mealPlanID: number;
  mealPlanMaster: MealPlanMaster;
  currencyCode: string;
  childRate: number;
  createdOn: string | null;
  createdBy: string | null;
  hotelRates: HotelRate[];
}

export interface HotelMaster {
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
  hotelImage: string | null;
  lowestRate: number | null;
}

export interface RateCode {
  rateCodeID: number;
  rateCode: string;
  description: string;
  createdOn: string | null;
  createdBy: string | null;
}

export interface HotelRoomType {
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

export interface MealPlanMaster {
  mealPlanID: number;
  mealPlan: string;
  breakFast: boolean;
  lunch: boolean;
  dinner: boolean;
  ai: boolean;
  shortCode: string;
}

export interface HotelRate {
  recordID: number;
  hotelRatePlanID: number;
  rateDate: string;
  defaultRate: number;
  pax1: number | null;
  pax2: number | null;
  pax3: number | null;
  pax4: number | null;
  pax5: number | null;
  pax6: number | null;
  pax7: number | null;
  pax8: number | null;
  pax9: number | null;
  pax10: number | null;
  pax11: number | null;
  pax12: number | null;
  pax13: number | null;
  pax14: number | null;
  pax15: number | null;
  pax16: number | null;
  pax17: number | null;
  pax18: number | null;
  child: number;
  dateFrom: string | null;
  dateTo: string | null;
  sellMode: string;
  rateMode: string | null;
  roomTypeID: number | null;
  primaryOccupancy: number | null;
  increaseBy: number | null;
  decreaseBy: number | null;
}

// src/types/hotelRatePlan.ts

export interface RoomAvailability {
  date: string; // e.g., "2025-03-03T00:00:00"
  count: number;
}

export interface HotelRatePlanAvailability {
  roomTypeId: number;
  roomType: string;
  roomCmId: string | null;
  roomCount: number;
  availability: RoomAvailability[];
}
