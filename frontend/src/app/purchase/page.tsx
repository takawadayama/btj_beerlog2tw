"use client";
import { useState, useEffect } from "react";
import { getEcSets } from "./getECSets";
import { getRecommendations } from "./getRecommend";

import { ECSetItem, RecommendResponseItem, nationalCraftOptions } from "../../types/purchase_types";

export default function Home() {
  const [nationalEcSets, setNationalEcSets] = useState<ECSetItem[]>([]);
  const [craftEcSets, setCraftEcSets] = useState<ECSetItem[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendResponseItem[]>([]);
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
      setRecommendations(data);
      if (category === "national") {
        setIsNationalSelected(true);
      } else if (category === "craft") {
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">条件選択</h1>
      <div className="mb-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">全体の本数</label>
          <select
            value={totalCans}
            onChange={(e) => setTotalCans(Number(e.target.value))}
            className="input input-bordered w-full"
          >
            {Object.keys(nationalCraftOptions).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            ナショナル本数とクラフト本数
          </label>
          <select
            value={JSON.stringify(nationalCraftRatio)}
            onChange={(e) => setNationalCraftRatio(JSON.parse(e.target.value))}
            className="input input-bordered w-full"
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
          <div className="overflow-y-auto h-64">
            {isNationalSelected ? (
              <div>
                <button
                  className="btn btn-primary mb-4"
                  onClick={() => setIsNationalSelected(false)}
                >
                  セット選択に戻る
                </button>
                {recommendations.map((item) => (
                  <div key={item.ec_brand_id} className="card bg-blue-500 shadow-xl mb-2 p-2">
                    <div className="card-body p-2 flex justify-between items-center">
                      <div className="flex flex-col">
                        <h3 className="card-title text-sm">{item.name}</h3>
                        <p className="text-xs">{item.description}</p>
                        <p className="text-xs">Price: {item.price}</p>
                        <p className="text-xs">Count: {item.count}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              nationalEcSets.map((ecSet) => (
                <div key={ecSet.ec_set_id} className="card bg-blue-500 shadow-xl mb-2 p-2">
                  <div className="card-body p-2 flex items-center">
                    <div className="flex-grow">
                      <h3 className="card-title text-sm">{ecSet.set_name}</h3>
                      <p className="text-xs">{ecSet.set_description}</p>
                    </div>
                    <div className="ml-4">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          fetchRecommendations(
                            ecSet.ec_set_id,
                            "national",
                            nationalCraftRatio.national
                          )
                        }
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
          <div className="overflow-y-auto h-64">
            {isCraftSelected ? (
              <div>
                <button className="btn btn-primary mb-4" onClick={() => setIsCraftSelected(false)}>
                  セット選択に戻る
                </button>
                {recommendations.map((item) => (
                  <div key={item.ec_brand_id} className="card bg-green-500 shadow-xl mb-2 p-2">
                    <div className="card-body p-2 flex justify-between items-center">
                      <div className="flex flex-col">
                        <h3 className="card-title text-sm">{item.name}</h3>
                        <p className="text-xs">{item.description}</p>
                        <p className="text-xs">Price: {item.price}</p>
                        <p className="text-xs">Count: {item.count}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              craftEcSets.map((ecSet) => (
                <div key={ecSet.ec_set_id} className="card bg-green-500 shadow-xl mb-2 p-2">
                  <div className="card-body p-2 flex items-center">
                    <div className="flex-grow">
                      <h3 className="card-title text-sm">{ecSet.set_name}</h3>
                      <p className="text-xs">{ecSet.set_description}</p>
                    </div>
                    <div className="ml-4">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          fetchRecommendations(ecSet.ec_set_id, "craft", nationalCraftRatio.craft)
                        }
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
