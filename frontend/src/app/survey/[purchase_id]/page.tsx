"use client"; // クライアントコンポーネントとしてマーク

import { useRouter } from 'next/navigation';
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';

interface Item {
  item_id: number;
  item_name: string;
}

interface SurveyResponse {
  item_id: number;
  score: number;
}

interface Brand {
  brand_id: number;
  brand_name: string;
}

const SurveyPage = () => {
  const router = useRouter();
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [age, setAge] = useState<number | null>(null);
  const [gender, setGender] = useState<number | null>(null);
  const [purchaseDate, setPurchaseDate] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [formData, setFormData] = useState<Record<number, Record<number, number>>>({}); // brand_idごとのformData

  useEffect(() => {
    const purchaseId = window.location.pathname.split('/').pop();
    if (purchaseId) {
      setPurchaseId(purchaseId);
      fetchItems();
      fetchBrands(purchaseId);
      fetchPurchaseDate(purchaseId);
    } else {
      router.push('/');
    }

    // JWTからuser_idを取得してuserIdステートに設定
    const id = fetchUserIdFromJWT();
    if (id !== null) {
      setUserId(id);
      fetchUserData(id); // JWTから取得したuser_idでユーザー情報をフェッチ
    }
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:8000/items');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchBrands = async (purchaseId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/purchase/${purchaseId}/brands`);
      const data = await response.json();
      setBrands(data);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchPurchaseDate = async (purchaseId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/purchase/${purchaseId}/date`);
      const data = await response.json();
      setPurchaseDate(data.purchase_date);
    } catch (error) {
      console.error('Error fetching purchase date:', error);
    }
  };

  const fetchUserIdFromJWT = () => {
    const token = localStorage.getItem('token'); // JWTトークンをローカルストレージから取得
    if (token) {
      const decodedToken: any = JSON.parse(atob(token.split('.')[1]));
      return decodedToken.sub; // ここでJWTのペイロードからuser_idを取得
    }
    return null;
  };

  const fetchUserData = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setAge(data.age);
        setGender(data.gender);
      } else {
        alert('User not found');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleUserIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUserId(e.target.value);
  };

  const handleUserIdBlur = () => {
    if (userId) {
      fetchUserData(userId);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>, brandId: number) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [brandId]: {
        ...prevFormData[brandId],
        [parseInt(name, 10)]: parseInt(value, 10),
      },
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>, brandId: number) => {
    e.preventDefault();
    if (!purchaseId || age === null || gender === null || purchaseDate === null) return;

    const surveyData = {
      purchase_id: parseInt(purchaseId, 10),
      brand_id: brandId, // ブランドごとに変更
      age: age, // ユーザーから取得
      gender: gender, // ユーザーから取得
      purchase_date: purchaseDate, // DBから取得
      responses: Object.keys(formData[brandId] || {}).map((key) => ({
        item_id: parseInt(key, 10),
        score: formData[brandId][parseInt(key, 10)],
      })),
    };

    try {
      const response = await fetch(`http://localhost:8000/survey/${purchaseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(surveyData),
      });
      if (response.ok) {
        alert('Survey submitted successfully!');
      } else {
        alert('Failed to submit survey');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error submitting survey');
    }
  };

  if (!purchaseId) return <p>Loading...</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Purchase Survey</h1>
      <form>
        {/* ログイン機能実装後に削除 */}
        <div className="mb-4 p-4 border bg-red-200 border-red-500 rounded">
          <p className="text-red-500 font-bold mb-2">ログイン機能実装後に削除</p>
          <label className="block mb-2">
            User ID:
            <input type="text" value={userId} onChange={handleUserIdChange} onBlur={handleUserIdBlur} className="border p-2 rounded w-full" />
          </label>
        </div>
      </form>
      {age !== null && gender !== null && (
        <div className="mb-4">
          <p>Age: {age}</p>
          <p>Gender: {gender}</p>
        </div>
      )}
      {brands.map((brand) => (
        <div key={brand.brand_id} className="mb-8 p-4 border rounded shadow">
          <h2 className="text-xl font-semibold mb-4">{brand.brand_name}</h2>
          <form onSubmit={(e) => handleSubmit(e, brand.brand_id)}>
            {items.map((item) => (
              <div key={item.item_id} className="mb-2">
                <label className="block mb-1">
                  {item.item_name}:
                  <input
                    type="number"
                    name={item.item_id.toString()}
                    min="1"
                    max="5"
                    value={formData[brand.brand_id]?.[item.item_id] || ''}
                    onChange={(e) => handleChange(e, brand.brand_id)}
                    className="border p-2 rounded w-full"
                  />
                </label>
              </div>
            ))}
            <button type="submit" className="bg-blue-500 text-white p-2 rounded">Submit</button>
          </form>
        </div>
      ))}
    </div>
  );
};

export default SurveyPage;
