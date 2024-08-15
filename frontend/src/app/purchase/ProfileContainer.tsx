import React, { useEffect, useState } from "react";
import { fetchFavorites, fetchPreferences, fetchSearchResults, addFavorite, deleteFavorite, updatePreferences } from "./api";
import { User, Brand, Preference } from "../../types/purchase_types";
import RadarChart from "./RadarChart";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";

interface ProfileContainerProps {
  user_id: number;
}

const ProfileContainer: React.FC<ProfileContainerProps> = ({ user_id }) => {
  const [favorites, setFavorites] = useState<Brand[]>([]);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [newFavorite, setNewFavorite] = useState<string>("");
  const [selectedFavorite, setSelectedFavorite] = useState<Brand | null>(null);
  const [updatedPreferences, setUpdatedPreferences] = useState<{ [key: number]: number }>({});
  const [searchResults, setSearchResults] = useState<Brand[]>([]);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const favoritesData = await fetchFavorites(user_id);
        setFavorites(favoritesData);
        const preferencesData = await fetchPreferences(user_id);
        setPreferences(preferencesData);
        const preferencesMap = preferencesData.reduce(
          (map, pref) => {
            map[pref.item_id] = pref.score;
            return map;
          },
          {} as { [key: number]: number }
        );
        setUpdatedPreferences(preferencesMap);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, [user_id]);

  useEffect(() => {
    const fetchResults = async () => {
      if (newFavorite.length > 0) {
        try {
          const results = await fetchSearchResults(newFavorite);
          setSearchResults(results);
        } catch (error) {
          console.error("Failed to fetch search results:", error);
        }
      } else {
        setSearchResults([]);
      }
    };

    fetchResults();
  }, [newFavorite]);

  const handleFavoriteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewFavorite(e.target.value);
  };

  const handleFavoriteSelect = (brand: Brand) => {
    setSelectedFavorite(brand);
    setNewFavorite(brand.brand_name);
    setSearchResults([]);
  };

  const handleFavoriteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFavorite) {
      try {
        await addFavorite(user_id, selectedFavorite.brand_name);
        setFavorites([...favorites, selectedFavorite]);
        setNewFavorite("");
        setSelectedFavorite(null);
        setShowInput(false);
        toast.success("好みの銘柄を追加しました！");
      } catch (error) {
        console.error("Failed to add favorite:", error);
        toast.error("銘柄の追加に失敗しました");
      }
    }
  };

  const handleFavoriteDelete = async (brand_id: number) => {
    confirmAlert({
      message: "銘柄を削除しますか？",
      buttons: [
        {
          label: "OK",
          onClick: async () => {
            try {
              await deleteFavorite(user_id, brand_id);
              setFavorites(favorites.filter((favorite) => favorite.brand_id !== brand_id));
              toast.success("好みの銘柄を削除しました！");
            } catch (error) {
              console.error("Failed to delete favorite:", error);
              toast.error("銘柄の削除に失敗しました！");
            }
          },
        },
        {
          label: "キャンセル",
          onClick: () => {},
        },
      ],
    });
  };

  const handlePreferenceChange = (item_id: number, value: number) => {
    setUpdatedPreferences({
      ...updatedPreferences,
      [item_id]: value,
    });
    setPreferences((prevPreferences) => prevPreferences.map((pref) => (pref.item_id === item_id ? { ...pref, score: value } : pref)));
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePreferences(user_id, updatedPreferences);
      setPreferences(
        preferences.map((pref) => ({
          ...pref,
          score: updatedPreferences[pref.item_id],
        }))
      );
      toast.success("好みを更新しました！");
    } catch (error) {
      console.error("Failed to update preferences:", error);
      toast.error("好みの更新に失敗しました");
    }
  };

  return (
    <div className="flex flex-col items-center"> {/* flexbox を使用して中央揃えにします */}
      <div className="w-full flex justify-center"> {/* チャートを中央に配置 */}
        <RadarChart preferences={preferences} onPreferenceChange={handlePreferenceChange} />
      </div>
      <form onSubmit={handlePreferencesSubmit} className="w-full mt-4 flex justify-center">
        <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded mt-2" style={{ position: "absolute", bottom: "20px", right: "10px" }}>
          更新
        </button>
      </form>
      <ToastContainer position="top-right" autoClose={1000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
};

export default ProfileContainer;
