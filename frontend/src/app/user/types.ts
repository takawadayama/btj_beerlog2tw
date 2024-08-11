export interface User {
  user_id: number;
  user_name: string;
  user_profile: string;
  user_picture: string;
}

export interface Brand {
  brand_id: number;
  brand_name: string;
}

export interface Item {
  item_id: number;
  item_name: string;
}

export interface Preference {
  user_id: number;
  item_id: number;
  score: number;
  item: Item;
}
