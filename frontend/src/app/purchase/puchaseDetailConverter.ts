import { RecommendResponseItem, PurchaseItem } from "../../types/purchase_types";

// 変換関数
export const convertToPurchaseItem = (
  category: string,
  ec_set_id: number,
  recommendItem: RecommendResponseItem
): PurchaseItem => {
  return {
    ec_brand_id: recommendItem.ec_brand_id,
    name: recommendItem.name,
    category: category,
    price: recommendItem.price,
    count: recommendItem.count,
    ec_set_id: ec_set_id,
  };
};
