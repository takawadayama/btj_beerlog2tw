"use client";

import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import Navbar from './Navbar'; // Navbarコンポーネントのインポート

interface User {
  user_id: number;
  user_name: string;
  user_profile: string;
  user_picture: string;
}

interface Photo {
  photo_id: number;
  photo_data: string;
}

interface UserWithPhotos {
  user: User;
  photos: Photo[];
}

interface ErrorResponse {
  detail: string;
}

export default function UserPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [userWithPhotos, setUserWithPhotos] = useState<UserWithPhotos | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // JWTからuser_idを取得する関数 (ログイン機能実装後に有効化)
  const fetchUserIdFromJWT = () => {
    const token = localStorage.getItem('token'); // JWTトークンをローカルストレージから取得
    if (token) {
      const decodedToken: any = JSON.parse(atob(token.split('.')[1]));
      return decodedToken.sub; // ここでJWTのペイロードからuser_idを取得
    }
    return null;
  };

  // JWTからuser_idを取得してuserIdステートに設定 (ログイン機能実装後に有効化)
  useEffect(() => {
    const id = fetchUserIdFromJWT();
    if (id !== null) {
      setUserId(id);
      fetchUserWithPhotos(id); // JWTから取得したuser_idでユーザー情報をフェッチ
    }
  }, []);

  const fetchUserWithPhotos = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:8000/user_with_photos`, {
        params: { user_id: id }
      });
      setUserWithPhotos(response.data);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setError(axiosError.response?.data?.detail || 'User not found or an error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId !== null) {
      fetchUserWithPhotos(userId);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-20">
      <Navbar /> {/* Navbarコンポーネントの表示 */}
      <div className="p-4 lg:px-60">
        {/* ログイン機能実装後に削除 */}
        <div className="mb-4 p-4 border bg-red-200 border-red-500 rounded">
          <p className="text-red-500 font-bold mb-2">ログイン機能実装後に削除</p>
          <form onSubmit={handleSubmit} className="mb-4">
            <label className="block mb-2">
              Enter User ID:
              <input
                type="number"
                value={userId !== null ? userId : ''}
                onChange={(e) => setUserId(parseInt(e.target.value))}
                className="border p-2 rounded w-full"
              />
            </label>
            <button type="submit" className="bg-blue-500 text-white p-2 rounded">Fetch User</button>
          </form>
        </div>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {userWithPhotos && (
          <div className="bg-gray-50 rounded p-4">
            <div className="flex items-center bg-gray-200 rounded-3xl py-10 px-4 mb-10">
              <img
                src={`data:image/jpeg;base64,${userWithPhotos.user.user_picture}`}
                alt="User Picture"
                className="rounded-full w-52 h-52 object-cover"
              />
              <div className="ml-4">
                <h2 className="text-xl font-bold">{userWithPhotos.user.user_name}</h2>
                <p>{userWithPhotos.user.user_profile}</p>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-2">最近の投稿</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
                {userWithPhotos.photos.map(photo => (
                  <div key={photo.photo_id} className="relative group">
                    <img
                      src={`data:image/jpeg;base64,${photo.photo_data}`}
                      alt={`Post ${photo.photo_id}`}
                      className="w-full h-64 object-cover rounded-2xl transition-transform duration-300 ease-in-out transform group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
