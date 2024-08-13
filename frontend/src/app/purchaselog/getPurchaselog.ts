import axios from "axios";
import { Purchaselog } from "../../types/purchase_types";

export const fetchPurchaselog = async (jwt: string): Promise<Purchaselog[]> => {
  const response = await axios.get<Purchaselog[]>("http://127.0.0.1:8000/purchaselog", {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });
  return response.data;
};
