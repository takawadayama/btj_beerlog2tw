import axios from "axios";
import { ECSetItem } from "../../types/purchase_types";

export const getEcSets = async (category: string): Promise<ECSetItem[]> => {
  try {
    const response = await axios.get<ECSetItem[]>(process.env.NEXT_PUBLIC_API_ENDPOINT + `/ec_sets`, {
      params: { category }, // クエリパラメータを指定
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching EC sets:", error);
    throw error;
  }
};
