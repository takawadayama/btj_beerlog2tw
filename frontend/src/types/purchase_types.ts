export interface ECSetItem {
  ec_set_id: number;
  set_name: string;
  set_description: string;
}

export interface RecommendQueryParams {
  ec_set_id: number;
  category: string;
  cans: number;
  kinds: number;
  ng_id?: number[];
}

export interface RecommendResponseItem {
  ec_brand_id: number;
  name: string;
  description: string;
  price: number;
  count: number;
}

export interface NationalCraftOption {
  national: number;
  craft: number;
}

export const nationalCraftOptions: Record<number, NationalCraftOption[]> = {
  12: [
    { national: 0, craft: 12 },
    { national: 6, craft: 6 },
    { national: 12, craft: 0 },
  ],
  24: [
    { national: 0, craft: 24 },
    { national: 6, craft: 18 },
    { national: 12, craft: 12 },
    { national: 18, craft: 6 },
    { national: 24, craft: 0 },
  ],
};
