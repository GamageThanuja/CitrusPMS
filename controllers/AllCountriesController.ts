import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";

export interface Country {
  countryId: number;
  country: string;
  dialCode: string;
  flagCode: string;
}

/**
 * Get all countries
 */
export const getAllCountries = async (): Promise<Country[]> => {
  try {
    // Get the access token for authorization
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const accessToken = tokens.accessToken;
    
    // Use the correct API endpoint with proper authorization
    const response = await axiosInstance.get<Country[]>("Country", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching countries:", error);
    // Return fallback countries instead of throwing
    return [
      { countryId: 1, country: "United States", dialCode: "+1", flagCode: "US" },
      { countryId: 2, country: "United Kingdom", dialCode: "+44", flagCode: "GB" },
      { countryId: 3, country: "Canada", dialCode: "+1", flagCode: "CA" },
      { countryId: 4, country: "Australia", dialCode: "+61", flagCode: "AU" },
      { countryId: 5, country: "India", dialCode: "+91", flagCode: "IN" },
      { countryId: 6, country: "Germany", dialCode: "+49", flagCode: "DE" },
      { countryId: 7, country: "France", dialCode: "+33", flagCode: "FR" },
      { countryId: 8, country: "Japan", dialCode: "+81", flagCode: "JP" },
      { countryId: 9, country: "China", dialCode: "+86", flagCode: "CN" },
      { countryId: 10, country: "Brazil", dialCode: "+55", flagCode: "BR" }
    ];
  }
};
