import { createReservationActivityLog } from "@/redux/slices/reservationActivityLogSlice";
import type { ReservationActivityLogPayload } from "@/redux/slices/reservationActivityLogSlice";
import store from "@/redux/store";

export function logReservationActivity(params: {
  reservationId?: number;
  reservationDetailId?: number;
  reservationNo?: string;
  roomNumber?: string;
  resLog: string;
}) {
  const storedToken = localStorage.getItem("hotelmateTokens");
  const parsedToken = storedToken ? JSON.parse(storedToken) : null;
  const username = parsedToken?.fullName || "Unknown";

  const selectedProperty = localStorage.getItem("selectedProperty");
  const property = selectedProperty ? JSON.parse(selectedProperty) : {};

  const hotel: ReservationActivityLogPayload["hotel"] = {
    hotelID: property.id || 0,
    hotelGUID: property.guid || "",
    finAct: true,
    hotelName: property.name || "",
    hotelCode: property.hotelCode || 0,
    userGUID_HotelOwner: property.userGUID || "",
    hotelType: property.hotelType || "",
    hotelAddress: property.hotelAddress || "",
    city: property.city || "",
    zipCode: property.zipCode || "",
    country: property.country || "",
    hotelPhone: property.hotelPhone || "",
    hotelEmail: property.hotelEmail || "",
    hotelWeb: property.hotelWeb || "",
    noOfRooms: property.noOfRooms || 0,
    latitude: property.latitude || "",
    longitude: property.longitude || "",
    currencyCode: property.currencyCode || "",
    languageCode: property.languageCode || "",
    createdOn: new Date().toISOString(),
    createdTimeStamp: new Date().toISOString(),
    lastUpdatedOn: new Date().toISOString(),
    lastUpdatedTimeStamp: new Date().toISOString(),
    lastUpdatedBy_UserGUID: property.userGUID || "",
    starCatgeory: property.starCatgeory || 0,
    cM_PropertyID: property.cM_PropertyID || "",
    isCMActive: true,
    hotelDate: new Date().toISOString(),
    isOnTrial: true,
    planId: property.planId || 0,
    hotelImage: {
      imageID: 0,
      hotelID: property.id || 0,
      imageFileName: "",
      description: "",
      isMain: true,
      finAct: true,
      createdOn: new Date().toISOString(),
      createdBy: username,
      updatedOn: new Date().toISOString(),
      updatedBy: username,
      base64Image: "",
    },
    lowestRate: 0,
  };

  const payload: ReservationActivityLogPayload = {
    logId: 0,
    username,
    hotelId: property.id || 0,
    reservationId: params.reservationId || 0,
    reservationDetailId: params.reservationDetailId || 0,
    resLog: params.resLog,
    createdOn: new Date().toISOString(),
    platform: "Web",
    hotel,
    reservationNo: params.reservationNo || "",
    roomNumber: params.roomNumber || "",
  };

  store.dispatch(createReservationActivityLog(payload));
}
