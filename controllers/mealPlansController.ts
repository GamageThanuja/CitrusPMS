import { axiosInstance } from "@/config/axiosConfig";
import { AxiosError } from "axios";

export interface MealPlan {
  mealPlanID: number;
  mealPlan: string;
  breakFast: boolean;
  lunch: boolean;
  dinner: boolean;
  ai: boolean;
  shortCode: string;
}

export const getMealPlans = async ({
  token,
}: {
  token: string;
}): Promise<MealPlan[]> => {
  try {
    const response = await axiosInstance.get<MealPlan[]>("MealPlan", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};
