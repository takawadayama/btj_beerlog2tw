import React, { useEffect, useState } from "react";
import { fetchFavorites, fetchPreferences, fetchSearchResults, addFavorite, deleteFavorite, updatePreferences, fetchFavoriteBrandPreferences } from "./api";
import { User, Brand, Preference } from "./types";
import RadarChart from "./RadarChart";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";

interface ProfileContainerProps {
  user: User;
}

const ProfileContainer: React.FC<ProfileContainerProps> = ({ user }) => {
  const [favorites, setFavorites] = useState<Brand[]>([]);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [newFavorite, setNewFavorite] = useState<string>("");
  const [selectedFavorite, setSelectedFavorite] = useState<Brand | null>(null);
  const [updatedPreferences, setUpdatedPreferences] = useState<{ [key: number]: number }>({});
  const [searchResults, setSearchResults] = useState<Brand[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [isNewFavoriteSelected, setIsNewFavoriteSelected] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const favoritesData = await fetchFavorites(user.user_id);
        setFavorites(favoritesData);
        const preferencesData = await fetchPreferences(user.user_id);
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
  }, [user.user_id]);

  useEffect(() => {
    const fetchResults = async () => {
      if (newFavorite.length > 0 && !isNewFavoriteSelected) {
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
  }, [newFavorite, isNewFavoriteSelected]);

  const handleFavoriteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewFavorite(e.target.value);
    setIsNewFavoriteSelected(false);
  };

  const handleFavoriteSelect = async (brand: Brand) => {
    setSelectedFavorite(brand);
    setNewFavorite(brand.brand_name);
    setIsNewFavoriteSelected(true);
    setSearchResults([]);
  
    try {
      await addFavorite(user.user_id, brand.brand_name);
      const favoritesData = await fetchFavorites(user.user_id);
      setFavorites(favoritesData);
      setNewFavorite("");
      setSelectedFavorite(null);
      setShowInput(false);
      toast.success("好みの銘柄を追加しました！");
    } catch (error) {
      console.error("Failed to add favorite:", error);
      toast.error("銘柄の追加に失敗しました");
    }
  };

  // const handleFavoriteSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (selectedFavorite) {
  //     try {
  //       await addFavorite(user.user_id, selectedFavorite.brand_name);
  //       const favoritesData = await fetchFavorites(user.user_id);
  //       setFavorites(favoritesData);
  //       setNewFavorite("");
  //       setSelectedFavorite(null);
  //       setShowInput(false);
  //       toast.success("好みの銘柄を追加しました！");
  //     } catch (error) {
  //       console.error("Failed to add favorite:", error);
  //       toast.error("銘柄の追加に失敗しました");
  //     }
  //   }
  // };

  const handleFavoriteDelete = async (brand_id: number) => {
    confirmAlert({
      message: "銘柄を削除しますか？",
      buttons: [
        {
          label: "OK",
          onClick: async () => {
            try {
              await deleteFavorite(user.user_id, brand_id);
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
      await updatePreferences(user.user_id, updatedPreferences);
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

  // 好きな銘柄のチャート図を取得（表示を変えるだけなので、DBへ反映させるには「更新」を押す必要がある）
  const handleFetchPreferences = async () => {
    if (favorites.length === 0) {
      alert("好きな銘柄を追加してください");
      return;
    }

    try {
      const preferencesData = await fetchFavoriteBrandPreferences(user.user_id);

      if (preferencesData) {
        // updatedPreferencesの更新
        setUpdatedPreferences(preferencesData);

        // preferencesの更新
        setPreferences((prevPreferences) => prevPreferences.map((pref) => (preferencesData[pref.item_id] !== undefined ? { ...pref, score: preferencesData[pref.item_id] } : pref)));
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    }
  };

  //　表示内容を元に戻す（好みテーブルから再取得する）
  const handleResetPreferences = async () => {
    try {
      const preferencesData = await fetchPreferences(user.user_id);

      // preferencesの更新
      setPreferences(preferencesData);

      // updatedPreferencesの更新
      const preferencesMap = preferencesData.reduce(
        (map, pref) => {
          map[pref.item_id] = pref.score;
          return map;
        },
        {} as { [key: number]: number }
      );
      setUpdatedPreferences(preferencesMap);
    } catch (error) {
      console.error("Error resetting preferences:", error);
    }
  };
  
  return (
    <div>
      <div className="bg-gray-200 rounded px-4 grid grid-cols-2 gap-4 mb-10 pt-10 pr-5">
        {/* 左 */}
        <div className="bg-gray-200 pl-4 rounded flex flex-col items-center col-span-1" style={{ height: "auto" }}>
          <div className="flex items-start w-full mb-4">
            <img src={`data:image/jpeg;base64,${user.user_picture}`} alt="User Picture" className="rounded-full w-56 h-56 object-cover mb-2 mr-4" />
            <div>
              <h2 className="text-xl font-bold">{user.user_name}</h2>
              <p>{user.user_profile}</p>
              <div className="mt-3">
                <div className="mt-3 flex items-center">
                  <p className="mr-2 font-bold text-gray-800">好きな銘柄:</p>
                  <button onClick={() => setShowInput(true)} className="text-blue-500">
                    <AddCircleOutlineIcon style={{ fontSize: "2rem" }} />
                  </button>
                </div>

                {favorites.map((favorite) => (
                  <div key={favorite.brand_id} className="flex items-center justify-between w-full mb-2">
                    <div className="flex items-center pr-5">
                      <img src={`data:image/png;base64,${favorite.brand_logo}`} alt={favorite.brand_name} className="w-10 h-10 object-cover rounded-full border-2 border-amber-600 mr-4" />
                      <p>{favorite.brand_name}</p>
                    </div>
                    <button onClick={() => handleFavoriteDelete(favorite.brand_id)} className="text-red-500">
                      <RemoveCircleOutlineIcon style={{ fontSize: "2rem" }} />
                    </button>
                  </div>
                ))}
                {/* <div className="flex justify-center mt-1">
                  <button onClick={() => setShowInput(true)} className="text-blue-500">
                    <AddCircleOutlineIcon style={{ fontSize: "2rem" }} />
                  </button>
                </div> */}
                {showInput && (
                  <>
                    <input
                      type="text"
                      value={newFavorite}
                      onChange={handleFavoriteChange}
                      placeholder="好きな銘柄を入力"
                      className="border-2 border-amber-600 p-2 rounded-lg w-full mt-2 focus:outline-none focus:ring-2 focus:ring-amber-600 bg-gray-50 shadow-sm"
                    />
                    {searchResults.length > 0 && (
                      <ul className="border border-amber-600 mt-2 rounded-lg w-full bg-white shadow-lg">
                        {searchResults.map((result) => (
                          <li
                            key={result.brand_id}
                            onClick={() => handleFavoriteSelect(result)}
                            className="cursor-pointer p-2 hover:bg-amber-100 flex items-center"
                          >
                            <img
                              src={`data:image/png;base64,${result.brand_logo}`}
                              alt={result.brand_name}
                              className="w-6 h-6 object-cover rounded-full border-2 border-amber-600 mr-2"
                            />
                            {result.brand_name}
                          </li>
                        ))}
                      </ul>
                    )}
                    {/* <button onClick={handleFavoriteSubmit} className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 mb-3 rounded mt-2">
                      追加する
                    </button> */}
                  </>
                )}
                <div className="flex justify-center mt-4">
                  <button
                    onClick={handleFetchPreferences}
                    className="text-amber-600 hover:text-white bg-white hover:bg-amber-600 border-2 border-amber-600 text-sm font-semibold px-4 py-2 rounded-full shadow-md transform transition-all duration-300"
                    style={{ marginRight: "10px" }}
                  >
                    チャートに反映
                  </button>
                  <button
                    onClick={handleResetPreferences}
                    className="text-amber-600 hover:text-white bg-white hover:bg-amber-600 border-2 border-amber-600 text-sm font-semibold px-4 py-2 rounded-full shadow-md transform transition-all duration-300"
                  >
                    元に戻す
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-around w-3/5">
            <div className="text-center">
              <p className="font-bold">フォロワー</p>
              <p>958</p>
            </div>
            <div className="text-center">
              <p className="font-bold">フォロー中</p>
              <p>495</p>
            </div>
            <div className="text-center">
              <p className="font-bold">投稿</p>
              <p>593</p>
            </div>
          </div>
          <div className="flex justify-center w-full mt-4">
            <div className="flex justify-between w-full max-w-3xl">
              <div
                className="relative text-center cursor-pointer border-2 border-amber-600 bg-amber-100 px-4 pt-2 pb-5 rounded-lg mr-2 w-1/2 hover:bg-amber-500 hover:text-white transform hover:scale-105 transition-all duration-300 shadow-lg"
                onClick={() => (window.location.href = "/")}
              >
                <h2 className="text-lg font-bold mb-2">お店でびあログ</h2>
                <table className="w-full mb-8">
                  <tbody>
                    <tr>
                      <td className="text-left font-bold">累計生ビール:</td>
                      <td className="text-right">2,531杯</td>
                    </tr>
                    <tr>
                      <td className="text-left font-bold">訪問店舗数:</td>
                      <td className="text-right">692店舗</td>
                    </tr>
                    <tr>
                      <td className="text-left font-bold">ステータス:</td>
                      <td className="text-right">神</td>
                    </tr>
                  </tbody>
                </table>
                <div className="absolute bottom-1 right-2">
                  <button
                    className="text-amber-600 hover:text-white bg-white hover:bg-amber-600 border-2 border-amber-600 text-sm font-semibold px-4 py-2 mb-1 rounded-full shadow-md transform transition-all duration-300"
                    onClick={() => (window.location.href = "/search")}
                  >
                    飲食店を探す &rarr;
                  </button>
                </div>
              </div>

              <div
                className="relative text-center cursor-pointer border-2 border-amber-600 bg-amber-100 px-4 pt-2 pb-5 rounded-lg ml-2 w-1/2 hover:bg-amber-500 hover:text-white transform hover:scale-105 transition-all duration-300 shadow-lg"
                onClick={() => (window.location.href = "/purchase")}
              >
                <h2 className="text-lg font-bold mb-2">おうちでびあログ</h2>
                <table className="w-full mb-8">
                  <tbody>
                    <tr>
                      <td className="text-left font-bold">累計缶ビール:</td>
                      <td className="text-right">3,453本</td>
                    </tr>
                    <tr>
                      <td className="text-left font-bold">累計摂取量:</td>
                      <td className="text-right">1,208ℓ</td>
                    </tr>
                    <tr>
                      <td className="text-left font-bold">銘柄数:</td>
                      <td className="text-right">401銘柄</td>
                    </tr>
                    <tr>
                      <td className="text-left font-bold">ステータス:</td>
                      <td className="text-right">レジェンド</td>
                    </tr>
                  </tbody>
                </table>
                <div className="absolute bottom-1 right-2">
                  <button
                    className="text-amber-600 hover:text-white bg-white hover:bg-amber-600 border-2 border-amber-600 text-sm font-semibold px-4 py-2 mb-1 rounded-full shadow-md transform transition-all duration-300"
                    onClick={() => (window.location.href = "/recommendation")}
                  >
                    おすすめ銘柄をお届け &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右 */}
        <div className="bg-gray-200 pr-4 rounded flex flex-col items-center justify-center relative col-span-1" style={{ height: "auto" }}>
          <RadarChart preferences={preferences} onPreferenceChange={handlePreferenceChange} />
          <form onSubmit={handlePreferencesSubmit} className="w-full mt-4 flex justify-center">
            <button
              type="submit"
              className="text-amber-600 hover:text-white bg-white hover:bg-amber-600 border-2 border-amber-600 text-sm font-semibold px-4 py-2 rounded-full shadow-md transform transition-all duration-300"
              style={{ position: "absolute", bottom: "1px", right: "10px" }}
            >
              更新
            </button>
          </form>
        </div>

        <ToastContainer position="top-right" autoClose={1000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      </div>
    </div>
  );
};

export default ProfileContainer;
