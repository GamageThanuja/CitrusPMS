import { axiosInstance } from "@/config/axiosConfig";
import { AxiosError } from "axios";

export interface HotelRoomFeaturePayload {
  hotelRoomFeatureID: number;
  hotelID: number;
  hotelMaster: {
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
    lastUpdatedOn: string;
    lastUpdatedTimeStamp: string;
    lastUpdatedBy_UserGUID: string;
    starCatgeory: number;
    cM_PropertyID: string;
    isCMActive: boolean;
    hotelDate: string;
    isOnTrial: boolean;
    planId: number;
    hotelImage: {
      imageID: number;
      hotelID: number;
      imageFileName: string;
      description: string;
      isMain: boolean;
      finAct: boolean;
      createdOn: string;
      createdBy: string;
      updatedOn: string;
      updatedBy: string;
      base64Image: string;
    };
    lowestRate: number;
  };
  roomFeatureID: number;
  roomFeature: {
    roomFeatureID: number;
    featureCategory: string;
    featureName: string;
  };
  hotelRoomTypeID: number;
  hotelRoomType: {
    hotelRoomTypeID: number;
    hotelID: number;
    roomType: string;
    adultSpace: number;
    childSpace: number;
    noOfRooms: number;
    cmid: string;
    createdTimeStamp: string;
    createdBy: string;
    updatedBy: string;
    finAct: boolean;
    updatedTimeStamp: string;
    roomDescription: string;
  };
  isTrue: boolean;
  hotelRoomTypeImage: Array<{
    imageID: number;
    hotelID: number;
    hotelRoomTypeID: number;
    imageURL: string;
    description: string;
    isMain: boolean;
    finAct: boolean;
    createdOn: string;
    createdBy: string;
    updatedOn: string;
    updatedBy: string;
    base64Image: string;
    imageFileName: string;
  }>;
}

export const createHotelRoomFeature = async ({
  token,
  payload,
}: {
  token: string;
  payload: HotelRoomFeaturePayload;
}): Promise<void> => {
  try {
    const response = await axiosInstance.post(`HotelRoomFeature`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    throw error as AxiosError;
  }
};

export interface RoomFeature {
  roomFeatureID: number;
  featureCategory: string;
  featureName: string;
}

export const getRoomFeatures = async (): Promise<RoomFeature[]> => {
  try {
    const response = await axiosInstance.get<RoomFeature[]>("RoomFeature");

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};
