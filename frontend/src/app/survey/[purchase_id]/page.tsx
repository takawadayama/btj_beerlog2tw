"use client"; // クライアントコンポーネントとしてマーク

import { useRouter } from 'next/navigation';
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import Navbar from '../../user/Navbar'; // Navbarコンポーネントのインポート
import RadarChartForSurvey from './RadarChartForSurvey'; // RadarChartForSurveyのインポート
import { toast, ToastContainer } from 'react-toastify'; // react-toastifyをインポート
import 'react-toastify/dist/ReactToastify.css'; // react-toastifyのCSSをインポート

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
  brand_logo_url: string; // ブランドロゴのURL
}

const SurveyPage = () => {
  const router = useRouter();
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [age, setAge] = useState<number | null>(null);
  const [gender, setGender] = useState<number | null>(null);
  const [purchaseDate, setPurchaseDate] = useState<string | null>(null); // 購入日を保持
  const [items, setItems] = useState<Item[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [formData, setFormData] = useState<Record<number, Record<number, number>>>({}); // brand_idごとのformData
  const [averageScores, setAverageScores] = useState<Record<number, Record<number, number>>>({}); // brand_idごとの平均スコア

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
      const brandsWithLogo = await Promise.all(data.map(async (brand: Brand) => {
        const logoResponse = await fetch(`http://localhost:8000/brands/${brand.brand_id}/logo`);
        const logoBlob = await logoResponse.blob();
        const logoUrl = URL.createObjectURL(logoBlob);
        return { ...brand, brand_logo_url: logoUrl };
      }));
      setBrands(brandsWithLogo);
      brandsWithLogo.forEach((brand: Brand) => {
        fetchAverageScores(brand.brand_id); // 各ブランドの平均スコアを取得
      });
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchAverageScores = async (brandId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/brand/${brandId}/average_scores`);
      const data = await response.json();
      console.log(`Average scores for brand ${brandId}:`, data); // デバッグ用のログ出力
      setAverageScores((prevScores) => ({
        ...prevScores,
        [brandId]: data,
      }));
    } catch (error) {
      console.error('Error fetching average scores:', error);
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

  const handlePreferenceChange = (brandId: number, itemId: number, value: number) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [brandId]: {
        ...prevFormData[brandId],
        [itemId]: value,
      },
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!purchaseId || age === null || gender === null || purchaseDate === null) return;

    try {
      for (const brand of brands) {
        const surveyData = {
          purchase_id: parseInt(purchaseId, 10),
          brand_id: brand.brand_id, // ブランドごとに変更
          age: age, // ユーザーから取得
          gender: gender, // ユーザーから取得
          purchase_date: purchaseDate, // DBから取得
          responses: items.map((item) => ({
            item_id: item.item_id,
            score: formData[brand.brand_id]?.[item.item_id] !== undefined ? formData[brand.brand_id][item.item_id] : Math.round(averageScores[brand.brand_id][item.item_id]),
          })),
        };

        const response = await fetch(`http://localhost:8000/survey/${purchaseId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(surveyData),
        });
        if (!response.ok) {
          throw new Error('Failed to submit survey');
        }
      }

      // purchasesテーブルのsurvey_completionを1に更新
      await fetch(`http://localhost:8000/purchase/${purchaseId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      toast.success('回答ありがとうございます！');
      router.push('/purchaselog'); // 回答完了後に/purchaselogに遷移
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error submitting survey');
    }
  };

  if (!purchaseId) return <p>Loading...</p>;

  return (
    <div className="relative">
      <Navbar /> {/* Navbarコンポーネントを表示 */}
      <div className="container mx-auto p-4 mt-16">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold mr-4">銘柄アンケート（{purchaseDate}購入分）</h1> {/* 購入日を表示 */}
            <form onSubmit={handleSubmit}>
              <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded">回答する</button>
            </form>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {brands.map((brand) => (
            <div key={brand.brand_id} className="relative border p-4 rounded shadow">
              <div className="relative z-20">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <img src={brand.brand_logo_url} alt={brand.brand_name} className="w-12 h-12 mr-2" />
                    <h2 className="text-left text-xl font-semibold">{brand.brand_name}</h2>
                  </div>
                </div>
                <div className="flex justify-center mb-4 py-5">
                  <RadarChartForSurvey
                    items={items}
                    formData={formData[brand.brand_id] || {}}
                    onPreferenceChange={(itemId, value) => handlePreferenceChange(brand.brand_id, itemId, value)}
                    defaultScores={averageScores[brand.brand_id] || {}} // 追加
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <ToastContainer />
      </div>
    </div>
  );
};

export default SurveyPage;
