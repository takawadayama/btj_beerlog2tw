// api.ts
import axios from "axios";
import { PurchaseSetItem } from "../../types/purchase_types"; // 適切なパスに変更してください

// Axiosのデフォルト設定
axios.defaults.baseURL = "http://127.0.0.1:8000"; // エンドポイントのベースURLを設定
axios.defaults.headers.post["Content-Type"] = "application/json";

export const createPurchase = async (purchaseSetItemAll: PurchaseSetItem[], jwt: string) => {
  try {
    console.log("Sending data:", purchaseSetItemAll); // データの確認
    const response = await axios.post("/purchase", purchaseSetItemAll, {
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
