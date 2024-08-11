import axios from "axios";
import { EcBrandItem } from "../../types/purchase_types";

export const fetchEcSearchResults = async (search_term: string): Promise<EcBrandItem[]> => {
  try {
    const response = await axios.get<EcBrandItem[]>(`http://localhost:8000/search_ec_brands`, {
      params: { search_term },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch search results:", error);
    throw error;
  }
};
