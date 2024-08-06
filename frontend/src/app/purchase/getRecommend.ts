import axios from "axios";

import { RecommendQueryParams, RecommendResponseItem } from "../../types/purchase_types";

const API_URL = "http://127.0.0.1:8000"; // FastAPIサーバーのURLを指定

export const getRecommendations = async (params: RecommendQueryParams): Promise<RecommendResponseItem[]> => {
  try {
    const response = await axios.get<RecommendResponseItem[]>(`${API_URL}/recommend`, {
      params: params,
      paramsSerializer: { indexes: null }, //リスト渡す時に、[]が付かない通常の繰り返し形式にするのに必要
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    throw error;
  }
};
