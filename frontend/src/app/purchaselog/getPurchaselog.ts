import axios from "axios";
import { Purchaselog } from "../../types/purchase_types";

export const fetchPurchaselog = async (jwt: string): Promise<Purchaselog[]> => {
  const response = await axios.get<Purchaselog[]>(process.env.NEXT_PUBLIC_API_ENDPOINT + "/purchaselog", {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });
  return response.data;
};
