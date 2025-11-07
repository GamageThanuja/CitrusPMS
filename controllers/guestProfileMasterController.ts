// src/api/guestProfile.ts

import { axiosInstance } from "@/config/axiosConfig";
import { AxiosError } from "axios";
import {  GuestProfilePayload } from "@/types/guestProfileMaster";

export const getGuestProfileById = async ({
  token,
  profileId,
}: {
  token: string;
  profileId: number;
}): Promise<GuestProfilePayload> => {
  try {
    const response = await axiosInstance.get<GuestProfilePayload>(
      `GuestProfileMaster/${profileId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};

export const createGuestProfile = async ({
  token,
  payload,
}: {
  token: string;
  payload: GuestProfilePayload;
}): Promise<GuestProfilePayload> => {
  try {
    const response = await axiosInstance.post<GuestProfilePayload>(
      `GuestProfileMaster`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};

export const updateGuestProfile = async ({
  token,
  profileId,
  payload,
}: {
  token: string;
  profileId: number;
  payload: GuestProfilePayload;
}): Promise<GuestProfilePayload> => {
  try {
    const response = await axiosInstance.put<GuestProfilePayload>(
      `GuestProfileMaster/${profileId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};

export const getAllGuestProfiles = async ({
  token,
}: {
  token: string;
}): Promise<GuestProfilePayload[]> => {
  try {
    const response = await axiosInstance.get<GuestProfilePayload[]>(
      `GuestProfileMaster`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};
