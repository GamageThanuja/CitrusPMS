export interface RoomFeature {
  roomFeatureID: number;
  featureCategory: string;
  featureName: string;
}

export interface HotelRoomTypeImage {
  imageID: number;
  hotelID: number;
  hotelRoomTypeID: number;
  imageURL: string;
  description: string;
  isMain: boolean;
  finAct: boolean;
  createdOn: string;
  createdBy: string;
  updatedOn: string | null;
  updatedBy: string | null;
  base64Image: string | null;
  imageFileName: string | null;
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

export interface HotelRoomFeature {
  hotelRoomFeatureID: number;
  hotelID: number;
  hotelMaster: null;
  roomFeatureID: number;
  roomFeature: RoomFeature;
  hotelRoomTypeID: number;
  hotelRoomType: HotelRoomType;
  isTrue: boolean;
  hotelRoomTypeImage: HotelRoomTypeImage[];
}
