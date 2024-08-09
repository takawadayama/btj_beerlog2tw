import axios from "axios";
import { User, Brand, Preference } from "../../types/purchase_types";

export const fetchFavorites = async (user_id: number): Promise<Brand[]> => {
  try {
    const response = await axios.get<Brand[]>(`http://localhost:8000/user_favorites`, {
      params: { user_id },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch favorites:", error);
    throw error;
  }
};

export const fetchPreferences = async (user_id: number): Promise<Preference[]> => {
  try {
    const response = await axios.get<Preference[]>(`http://localhost:8000/user_preferences`, {
      params: { user_id },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch preferences:", error);
    throw error;
  }
};

export const fetchSearchResults = async (search_term: string): Promise<Brand[]> => {
  try {
    const response = await axios.get<Brand[]>(`http://localhost:8000/search_brands`, {
      params: { search_term },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch search results:", error);
    throw error;
  }
};

export const addFavorite = async (user_id: number, brand_name: string): Promise<void> => {
  try {
    await axios.post("http://localhost:8000/add_favorite", {
      user_id,
      brand_name,
    });
  } catch (error) {
    console.error("Failed to add favorite:", error);
    throw error;
  }
};

export const deleteFavorite = async (user_id: number, brand_id: number): Promise<void> => {
  try {
    await axios.delete("http://localhost:8000/delete_favorite", {
      params: {
        user_id,
        brand_id,
      },
    });
  } catch (error) {
    console.error("Failed to delete favorite:", error);
    throw error;
  }
};

export const updatePreferences = async (user_id: number, preferences: { [key: number]: number }): Promise<void> => {
  try {
    await axios.post("http://localhost:8000/update_preferences", {
      user_id,
      preferences,
    });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    throw error;
  }
};
