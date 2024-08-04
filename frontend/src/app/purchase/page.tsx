"use client";
import { useState, useEffect } from "react";
import { getEcSets } from "./getECSets";
import { getRecommendations } from "./getRecommend";

import { ECSetItem, RecommendResponseItem, nationalCraftOptions } from "../../types/purchase_types";

export default function Home() {
  const [nationalEcSets, setNationalEcSets] = useState<ECSetItem[]>([]);
  const [craftEcSets, setCraftEcSets] = useState<ECSetItem[]>([]);
  const [nationalRecommendations, setNationalRecommendations] = useState<RecommendResponseItem[]>([]);
  const [craftRecommendations, setCraftRecommendations] = useState<RecommendResponseItem[]>([]);

  const [isNationalSelected, setIsNationalSelected] = useState(false);
  const [isCraftSelected, setIsCraftSelected] = useState(false);
  const [totalCans, setTotalCans] = useState<number>(24);
  const [nationalCraftRatio, setNationalCraftRatio] = useState<{
    national: number;
    craft: number;
  }>(nationalCraftOptions[24][0]);

  const fetchData = async (category: string) => {
    try {
      const data = await getEcSets(category);
      if (category === "national") {
        setNationalEcSets(data);
      } else if (category === "craft") {
        setCraftEcSets(data);
      }
    } catch (error) {
      console.error("Failed to fetch EC sets:", error);
    }
  };

  const fetchRecommendations = async (ec_set_id: number, category: string, cans: number) => {
    try {
      const data = await getRecommendations({
        ec_set_id,
        category,
        cans,
        kinds: 2,
        ng_id: [4, 5],
      });
      if (category === "national") {
        setNationalRecommendations(data);
        setIsNationalSelected(true);
      } else if (category === "craft") {
        setCraftRecommendations(data);
        setIsCraftSelected(true);
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    }
  };

  useEffect(() => {
    fetchData("national");
    fetchData("craft");
  }, []);

  useEffect(() => {
    setNationalCraftRatio(nationalCraftOptions[totalCans][0]);
  }, [totalCans]);

  return (
    <div className="container mx-auto p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">条件選択</h1>
      <div className="mb-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">全体の本数</label>
          <select
            value={totalCans}
            onChange={(e) => {
              setTotalCans(Number(e.target.value));
              setIsNationalSelected(false);
              setIsCraftSelected(false);
            }}
            className="select select-bordered w-full"
          >
            {Object.keys(nationalCraftOptions).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">ナショナル本数とクラフト本数</label>
          <select
            value={JSON.stringify(nationalCraftRatio)}
            onChange={(e) => {
              setNationalCraftRatio(JSON.parse(e.target.value));
              setIsNationalSelected(false);
              setIsCraftSelected(false);
            }}
            className="select select-bordered w-full"
          >
            {nationalCraftOptions[totalCans].map((option, index) => (
              <option key={index} value={JSON.stringify(option)}>
                {option.national}:{option.craft}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-bold mb-2">National</h2>
          <div className="overflow-y-auto h-64 bg-white rounded-lg shadow-md p-4">
            {isNationalSelected ? (
              <div>
                <button className="btn btn-outline mb-4" onClick={() => setIsNationalSelected(false)}>
                  セット選択に戻る
                </button>
                {nationalRecommendations.map((item) => (
                  <div key={item.ec_brand_id} className="card card-compact bg-blue-100 shadow-xl mb-2 p-1">
                    <div className="card-body p-1 flex flex-row justify-between items-center">
                      <h3 className="card-title text-sm font-semibold">{item.name}</h3>
                      <p className="text-xs">{item.description}</p>
                      <div className="flex items-center space-x-4">
                        <p className="text-xs">Price: {item.price}</p>
                        <p className="text-xs">Count: {item.count}</p>
                        <button className=" bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700">
                          選択して変更
                        </button>
                        <button className=" bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700">
                          別銘柄を提案
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              nationalEcSets.map((ecSet) => (
                <div key={ecSet.ec_set_id} className="card card-compact bg-blue-100 shadow-xl mb-2 p-1">
                  <div className="card-body p-2 flex flex-row items-center">
                    <div className="flex-grow">
                      <h3 className="card-title text-sm font-semibold">{ecSet.set_name}</h3>
                      <p className="text-xs">{ecSet.set_description}</p>
                    </div>
                    <div className="ml-4">
                      <button
                        className=" bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700"
                        onClick={() => fetchRecommendations(ecSet.ec_set_id, "national", nationalCraftRatio.national)}
                      >
                        これを選択する
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">Craft</h2>
          <div className="overflow-y-auto h-64 bg-white rounded-lg shadow-md p-4">
            {isCraftSelected ? (
              <div>
                <button className="btn btn-outline mb-4" onClick={() => setIsCraftSelected(false)}>
                  セット選択に戻る
                </button>
                {craftRecommendations.map((item) => (
                  <div key={item.ec_brand_id} className="card card-compact bg-green-100 shadow-xl mb-2 p-1">
                    <div className="card-body p-1 flex flex-row justify-between items-center">
                      <h3 className="card-title text-sm font-semibold">{item.name}</h3>
                      <p className="text-xs">{item.description}</p>
                      <div className="flex items-center space-x-4">
                        <p className="text-xs">Price: {item.price}</p>
                        <p className="text-xs">Count: {item.count}</p>
                        <button className=" bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700">
                          選択して変更
                        </button>
                        <button className=" bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700">
                          別銘柄を提案
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              craftEcSets.map((ecSet) => (
                <div key={ecSet.ec_set_id} className="card card-compact bg-green-100 shadow-xl mb-2 p-1">
                  <div className="card-body p-2 flex flex-row items-center">
                    <div className="flex-grow">
                      <h3 className="card-title text-sm font-semibold">{ecSet.set_name}</h3>
                      <p className="text-xs">{ecSet.set_description}</p>
                    </div>
                    <div className="ml-4">
                      <button
                        className=" bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700"
                        onClick={() => fetchRecommendations(ecSet.ec_set_id, "craft", nationalCraftRatio.craft)}
                      >
                        これを選択する
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
