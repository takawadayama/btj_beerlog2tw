import axios from "axios";
import { RecommendQueryParams, RecommendResponseItem } from "../../types/purchase_types";

export const getRecommendations = async (params: RecommendQueryParams, jwt: string): Promise<RecommendResponseItem[]> => {
  try {
    const response = await axios.get<RecommendResponseItem[]>(process.env.NEXT_PUBLIC_API_ENDPOINT + `/recommend`, {
      params: params,
      paramsSerializer: { indexes: null }, // リスト渡す時に、[]が付かない通常の繰り返し形式にするのに必要
      headers: {
        Authorization: `Bearer ${jwt}`, // JWTトークンをヘッダーに追加
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    throw error;
  }
};
