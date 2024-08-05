import React, { useEffect, useState } from 'react';
import axios from 'axios';
import RadarChart from './RadarChart';

interface User {
  user_id: number;
  user_name: string;
  user_profile: string;
  user_picture: string;
}

interface Brand {
  brand_id: number;
  brand_name: string;
}

interface Preference {
  item_id: number;
  item_name: string;
  score: number;
}

interface ProfileContainerProps {
  user: User;
}

const ProfileContainer: React.FC<ProfileContainerProps> = ({ user }) => {
  const [favorites, setFavorites] = useState<Brand[]>([]);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [newFavorite, setNewFavorite] = useState<string>('');
  const [selectedFavorite, setSelectedFavorite] = useState<Brand | null>(null);
  const [updatedPreferences, setUpdatedPreferences] = useState<{ [key: number]: number }>({});
  const [searchResults, setSearchResults] = useState<Brand[]>([]);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await axios.get<Brand[]>(`http://localhost:8000/user_favorites`, {
          params: { user_id: user.user_id }
        });
        setFavorites(response.data);
      } catch (error) {
        console.error('Failed to fetch favorites:', error);
      }
    };

    const fetchPreferences = async () => {
      try {
        const response = await axios.get<Preference[]>(`http://localhost:8000/user_preferences`, {
          params: { user_id: user.user_id }
        });
        setPreferences(response.data);
        const preferencesMap = response.data.reduce((map, pref) => {
          map[pref.item_id] = pref.score;
          return map;
        }, {} as { [key: number]: number });
        setUpdatedPreferences(preferencesMap);
      } catch (error) {
        console.error('Failed to fetch preferences:', error);
      }
    };

    fetchFavorites();
    fetchPreferences();
  }, [user.user_id]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (newFavorite.length > 0) {
        try {
          const response = await axios.get<Brand[]>(`http://localhost:8000/search_brands`, {
            params: { search_term: newFavorite }
          });
          setSearchResults(response.data);
        } catch (error) {
          console.error('Failed to fetch search results:', error);
        }
      } else {
        setSearchResults([]);
      }
    };

    fetchSearchResults();
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
        await axios.post('http://localhost:8000/add_favorite', {
          user_id: user.user_id,
          brand_name: selectedFavorite.brand_name
        });
        setFavorites([...favorites, selectedFavorite]);
        setNewFavorite('');
        setSelectedFavorite(null);
        setShowInput(false);
      } catch (error) {
        console.error('Failed to add favorite:', error);
      }
    }
  };

  const handleFavoriteDelete = async (brand_id: number) => {
    const confirmDelete = window.confirm('削除してよろしいでしょうか？');
    if (confirmDelete) {
      try {
        await axios.delete('http://localhost:8000/delete_favorite', {
          params: {
            user_id: user.user_id,
            brand_id: brand_id
          }
        });
        setFavorites(favorites.filter(favorite => favorite.brand_id !== brand_id));
      } catch (error) {
        console.error('Failed to delete favorite:', error);
      }
    }
  };

  const handlePreferenceChange = (item_id: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdatedPreferences({
      ...updatedPreferences,
      [item_id]: parseFloat(e.target.value)
    });
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/update_preferences', {
        user_id: user.user_id,
        preferences: updatedPreferences
      });
      setPreferences(preferences.map(pref => ({
        ...pref,
        score: updatedPreferences[pref.item_id]
      })));
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  return (
    <div className="bg-gray-200 rounded p-4 flex justify-between items-start mb-10">
      {/* 左側 */}
      <div className="flex items-center flex-col p-4 w-1/4">
        <img
          src={`data:image/jpeg;base64,${user.user_picture}`}
          alt="User Picture"
          className="rounded-full w-52 h-52 object-cover mb-4"
        />
        <div className="text-center">
          <h2 className="text-xl font-bold">{user.user_name}</h2>
          <p>{user.user_profile}</p>
        </div>
        {/* フォロワー、フォロー中、投稿数 */}
        <div className="flex justify-around w-full mt-4">
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
      </div>
      {/* 中央 */}
      <div className="flex flex-col items-center p-4 w-2/4">
        <div className="mb-4">
          <p>好きな銘柄:</p>
          {favorites.map(favorite => (
            <div key={favorite.brand_id} className="flex items-center justify-between w-full">
              <p>{favorite.brand_name}</p>
              <button onClick={() => handleFavoriteDelete(favorite.brand_id)} className="text-red-500">
                －
              </button>
            </div>
          ))}
          <button onClick={() => setShowInput(true)} className="mt-2 text-blue-500">
            ＋
          </button>
          {showInput && (
            <>
              <input
                type="text"
                value={newFavorite}
                onChange={handleFavoriteChange}
                placeholder="新しい好きな銘柄を追加"
                className="border p-2 rounded w-full mt-2"
              />
              {searchResults.length > 0 && (
                <ul className="border mt-2 rounded w-full">
                  {searchResults.map(result => (
                    <li
                      key={result.brand_id}
                      onClick={() => handleFavoriteSelect(result)}
                      className="cursor-pointer p-2 hover:bg-gray-300"
                    >
                      {result.brand_name}
                    </li>
                  ))}
                </ul>
              )}
              <button onClick={handleFavoriteSubmit} className="bg-amber-600 text-white py-2 px-4 rounded mt-2">
                追加する
              </button>
            </>
          )}
          <RadarChart userId={user.user_id} />
        </div>
        <form onSubmit={handlePreferencesSubmit} className="w-full">
          {preferences.map(preference => (
            <div key={preference.item_id} className="flex items-center justify-between mb-2">
              <label>{preference.item_name}</label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={updatedPreferences[preference.item_id]}
                onChange={handlePreferenceChange(preference.item_id)}
                className="border p-2 rounded w-1/3"
              />
            </div>
          ))}
          <button type="submit" className="bg-amber-600 text-white py-2 px-4 rounded mt-2">
            更新
          </button>
        </form>
      </div>
      {/* 右側 */}
      <div className="flex flex-col items-center p-4 w-1/4">
        <div className="mb-8 text-center">
          <h2 className="text-xl font-bold mb-2">お店でびあログ</h2>
          <p>累計生ビール: 2,531杯</p>
          <p>訪問店舗数: 692店舗</p>
          <p className="mb-4">生ビールランク: 神</p>
          <a href="/" className="bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700 mt-2">飲み屋を探す</a>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">おうちでびあログ</h2>
          <p>累計缶ビール: 3,453本</p>
          <p>累計摂取量: 1,208ℓ</p>
          <p>銘柄数: 401店舗</p>
          <p className="mb-4">おうちビールランク: レジェンド</p>
          <a href="/purchase" className="bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700 mt-2">おすすめビールを自宅に届ける</a>
        </div>
      </div>
    </div>
  );
};

export default ProfileContainer;
