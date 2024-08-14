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
    <div>
      <Navbar />
      <div className="container mx-auto p-4 mt-20">
        <h1 className="text-2xl font-bold mb-4">Purchase Logs</h1>
        <div className="grid grid-cols-1 gap-4">
          {purchaselog.map((log, index) => (
            <div key={index} className="card w-full bg-base-100 shadow-xl rounded-lg">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="card-title">Purchase ID: {log.purchase_id}</h2>
                    <h2 className="card-title">Purchase Date: {new Date(log.date_time).toLocaleDateString()}</h2>
                    <h2 className="card-title">Total Amount: {log.total_amount} 円</h2>
                    <h2 className="card-title">Total Cans: {log.total_cans} 本</h2>
                    <h2 className="card-title">Survey Completed: {log.survey_completion ? "Yes" : "No"}</h2>
                  </div>
                  <div>
                    {/* ボタンを追加 */}
                    <button className={`btn ${log.survey_completion ? "btn-primary" : "btn-disabled"}`} onClick={() => handleSurveyRedirect(log.purchase_id)} disabled={!log.survey_completion}>
                      Survey
                    </button>
                  </div>
                </div>

                <div className="divider"></div>

                {/* Purchase Details Section */}
                <div className="card bg-gray-100 shadow-md p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Purchase Details</h3>
                  <div className="overflow-x-auto">
                    <table className="table table-compact w-full">
                      <thead>
                        <tr>
                          <th>Brand</th>
                          <th>Category</th>
                          <th>Price (円)</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {log.details.map((detail, i) => (
                          <tr key={i}>
                            <td>{detail.name}</td>
                            <td>{detail.category}</td>
                            <td>{detail.price}</td>
                            <td>{detail.count}</td>
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
