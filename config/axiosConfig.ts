import axios from "axios";

export const Admin = "Admin";
export const GuestProfileMaster = "GuestProfileMaster";
export const CategoryMaster = "CategoryMaster";
export const HotelPosCenter = "HotelPosCenter";
export const ItemByPosCenter = "ItemByPosCenter";
export const ItemMaster = "ItemMaster";
export const HotelRatePlans = "HotelRatePlans";
export const HotelRoomType = "HotelRoomType";
export const HotelRoomFeature = "HotelRoomFeature";
export const HotelRoomTypeImage = "HotelRoomTypeImage";
export const HotelRoomNumber = "HotelRoomNumber";
export const Reservation = "Reservation";
export const NameMaster = "NameMaster";
export const Country = "Country";
export const ReservationActivityLog = "ReservationActivityLog";
export const Dashboard = "Dashboard";
export const Pos = "Pos";
export const ReasonsMaster = "ReasonsMaster";
export const GuestProfileByRoomMaster = "GuestProfileByRoomMaster";
export const HotelIPG = "HotelIPG";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/api/`,
});
