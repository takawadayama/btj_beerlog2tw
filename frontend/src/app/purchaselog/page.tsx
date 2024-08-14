"use client";

import { useEffect, useState } from "react";
import { fetchPurchaselog } from "./getPurchaselog";
import { Purchaselog } from "../../types/purchase_types";
import { jwtDecode } from "jwt-decode";
import Navbar from "../../common/Navbar"; // Navbarコンポーネントのインポート
import { useRouter } from "next/navigation"; // useRouterをインポート

interface DecodedToken {
  sub: string;
}

export default function PurchaselogPage() {
  const [jwt, setJwt] = useState<string>("");
  const [purchaselog, setPurchaselog] = useState<Purchaselog[]>([]);
  const router = useRouter(); // useRouterを使用してルーティング

  useEffect(() => {
    const token = localStorage.getItem("token") as string;
    if (token) {
      setJwt(token);
      const decodedToken = jwtDecode<DecodedToken>(token);
      fetchPurchaselog(token)
        .then((data) => setPurchaselog(data))
        .catch((error) => {
          console.error("Failed to fetch purchase logs:", error);
        });
    }
  }, []);

  const handleSurveyRedirect = (purchase_id: number) => {
    router.push(`/survey/${purchase_id}`);
  };

  return (
    <div className="bg-gray-200 min-h-screen">
      <Navbar />
      <div className="container mx-auto p-4 mt-20">
        <h1 className="text-2xl font-bold mb-4">購入履歴</h1>
        <div className="grid grid-cols-1 gap-4">
          {purchaselog.map((log, index) => (
            <div key={index} className="border-2 border-amber-600 bg-amber-100 shadow-lg rounded-lg p-6 hover:bg-amber-500 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {/* <h2 className="text-xl font-bold mb-2">Purchase ID: {log.purchase_id}</h2> */}
                  <h2 className="text-xl font-bold mb-2">購入日: {new Date(log.date_time).toLocaleDateString()}</h2>
                  <h2 className="text-xl font-bold mb-2">合計金額: {log.total_amount} 円</h2>
                  <h2 className="text-xl font-bold mb-2">合計本数: {log.total_cans} 本</h2>
                  {/* <h2 className="text-xl font-bold mb-2">Survey Completed: {log.survey_completion ? "Yes" : "No"}</h2> */}
                </div>
                <div>
                  {/* ボタンをスタイルに合わせて修正 */}
                  <button
                    className={`text-amber-600 bg-white border-2 border-amber-600 text-lg font-semibold px-6 py-3 rounded-full shadow-md transform transition-all duration-300 ${
                      log.survey_completion ? "cursor-not-allowed opacity-50" : "hover:text-white hover:bg-amber-600"
                    }`}
                    onClick={() => handleSurveyRedirect(log.purchase_id)}
                    disabled={log.survey_completion}
                  >
                    {log.survey_completion ? "回答済み" : "アンケートへ回答"}
                  </button>
                </div>
              </div>

              <div className="mt-4 border-t border-gray-300 pt-4">
                {/* Purchase Details Section */}
                <div className="bg-gray-100 p-4 rounded-lg shadow-inner text-black">
                  <h3 className="text-lg font-semibold mb-4">内訳</h3>
                  <div className="overflow-x-auto">
                    <table className="table-auto w-full">
                      <thead>
                        <tr>
                          <th className="px-4 py-2">銘柄</th>
                          <th className="px-4 py-2">カテゴリ</th>
                          <th className="px-4 py-2">価格 (円)</th>
                          <th className="px-4 py-2">数量</th>
                        </tr>
                      </thead>
                      <tbody>
                        {log.details.map((detail, i) => (
                          <tr key={i}>
                            <td className="border px-4 py-2">{detail.name}</td>
                            <td className="border px-4 py-2">{detail.category}</td>
                            <td className="border px-4 py-2">{detail.price}</td>
                            <td className="border px-4 py-2">{detail.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
