import axios from "axios";
import { ECSetItem } from "../../types/purchase_types";

const API_URL = "http://127.0.0.1:8000"; // FastAPIサーバーのURLを指定

export const getEcSets = async (category: string): Promise<ECSetItem[]> => {
  try {
    const response = await axios.get<ECSetItem[]>(`${API_URL}/ec_sets`, {
      params: { category }, // クエリパラメータを指定
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching EC sets:", error);
    throw error;
  }
};
