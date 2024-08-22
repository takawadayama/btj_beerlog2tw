// api.ts
import axios from "axios";
import { PurchaseSetItem } from "../../types/purchase_types"; // 適切なパスに変更してください

// Axiosのデフォルト設定
axios.defaults.headers.post["Content-Type"] = "application/json";

export const createPurchase = async (purchaseSetItemAll: PurchaseSetItem[], jwt: string) => {
  try {
    console.log("Sending data:", purchaseSetItemAll); // データの確認
    const response = await axios.post(process.env.NEXT_PUBLIC_API_ENDPOINT + "/purchase", purchaseSetItemAll, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating purchase:", error);
    throw error;
  }
};
