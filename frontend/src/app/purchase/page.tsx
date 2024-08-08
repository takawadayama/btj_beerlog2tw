"use client";
import { useState, useEffect } from "react";
import { getEcSets } from "./getECSets";
import { getRecommendations } from "./getRecommend";
import { useRouter } from "next/navigation";
import { convertToPurchaseItem } from "./puchaseDetailConverter";
import { createPurchase } from "./createPurchase";

import {
  ECSetItem,
  RecommendResponseItem,
  nationalCraftOptions,
  PurchaseItem,
  PurchaseSubSetItem,
  PurchaseSetItem,
} from "../../types/purchase_types";

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
  }>(nationalCraftOptions[24][1]);

  const [nationalSet, setNationalSet] = useState<{ cans: number; set_name: string; set_id: number }>({
    cans: 0,
    set_name: "",
    set_id: 0,
  });
  const [craftSet, setCraftSet] = useState<{ cans: number; set_name: string; set_id: number }>({
    cans: 0,
    set_name: "",
    set_id: 0,
  });
  const [nationalSetDetails, setNationalSetDetails] = useState<PurchaseItem[]>([]);
  const [craftSetDetails, setCraftSetDetails] = useState<PurchaseItem[]>([]);

  const [purchaseSetItemAll, setPurchaseSetItemAll] = useState<PurchaseSetItem[]>([]);
  const [jwt, setJwt] = useState<string>("");

  const router = useRouter();

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

  // おススメセットを選択した時の処理
  const fetchRecommendations = async (set_name: string, ec_set_id: number, category: string, cans: number) => {
    try {
      const data = await getRecommendations({
        ec_set_id,
        category,
        cans,
        kinds: 2,
        ng_id: [1, 6],
      });
      if (category === "national") {
        setNationalSet({ cans: cans, set_name: set_name, set_id: ec_set_id });
        setNationalRecommendations(data);
        setIsNationalSelected(true);
      } else if (category === "craft") {
        setCraftSet({ cans: cans, set_name: set_name, set_id: ec_set_id });
        setCraftRecommendations(data);
        setIsCraftSelected(true);
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    }
  };

  // リコメンド結果を購入候補の変数へ格納する
  useEffect(() => {
    const convertNationalRecommendation = (recommendItem: RecommendResponseItem) => {
      return convertToPurchaseItem("national", nationalSet.set_id, recommendItem);
    };
    // 変換を実行
    const data: PurchaseItem[] = nationalRecommendations.map(convertNationalRecommendation);
    setNationalSetDetails(data);
  }, [nationalRecommendations]);

  useEffect(() => {
    const convertCraftRecommendation = (recommendItem: RecommendResponseItem) => {
      return convertToPurchaseItem("craft", craftSet.set_id, recommendItem);
    };
    // 変換を実行
    const data: PurchaseItem[] = craftRecommendations.map(convertCraftRecommendation);
    setCraftSetDetails(data);
  }, [craftRecommendations]);

  useEffect(() => {
    fetchData("national");
    fetchData("craft");
    //トークン情報を取得
    const token = localStorage.getItem("token") as string;
    setJwt(token);
  }, []);

  useEffect(() => {
    setNationalCraftRatio(nationalCraftOptions[totalCans][1]);
  }, [totalCans]);

  const handleMyRedirect = () => {
    router.push("/user");
  };

  const handleLogout = () => {
    // ログアウト処理を実装する
    localStorage.removeItem("token"); // JWTをローカルストレージから削除
    router.push("/"); //メイン画面へ戻る
  };

  const handleAddToCart = () => {
    const combinedCans = nationalSet.cans + craftSet.cans;

    if (combinedCans === totalCans) {
      const newPurchaseSetItem: PurchaseSetItem = {
        setDetails: {
          cans: combinedCans,
          set_num: 1, // デフォルトで1セット購入（後で増減可能にする）
        },
        national_set: {
          cans: nationalSet.cans,
          set_name: nationalSet.set_name,
          details: nationalSetDetails,
        },
        craft_set: {
          cans: craftSet.cans,
          set_name: craftSet.set_name,
          details: craftSetDetails,
        },
      };

      setPurchaseSetItemAll((prevItems) => [...prevItems, newPurchaseSetItem]);
    } else {
      if ((isNationalSelected || nationalCraftRatio.national === 0) && !isCraftSelected) {
        alert("クラフトブランドを選択してください");
      } else if (!isNationalSelected && (isCraftSelected || nationalCraftRatio.craft === 0)) {
        alert("ナショナルブランドを選択してください");
      } else if (!isNationalSelected && !isCraftSelected) {
        alert("クラフトブランドとナショナルブランドを選択してください");
      }
    }
  };

  const handleBackToNationalSetSelection = () => {
    // nationalSetとnationalSetDetailsの初期化
    setNationalSet({ cans: 0, set_name: "", set_id: 0 });
    setNationalSetDetails([]);
    setIsNationalSelected(false);
  };

  const handleBackToCraftSetSelection = () => {
    // nationalSetとnationalSetDetailsの初期化
    setCraftSet({ cans: 0, set_name: "", set_id: 0 });
    setCraftSetDetails([]);
    setIsCraftSelected(false);
  };

  const handleRemoveItem = (index: number) => {
    setPurchaseSetItemAll((prevItems) => prevItems.filter((_, i) => i !== index));
  };

  const handleIncrementSetNumber = (index: number) => {
    setPurchaseSetItemAll((prevItems) =>
      prevItems.map((item, i) => {
        if (i === index) {
          const newSetNum = item.setDetails.set_num + 1;
          return {
            ...item,
            setDetails: {
              ...item.setDetails,
              cans: (item.setDetails.cans / item.setDetails.set_num) * newSetNum,
              set_num: newSetNum,
            },
            national_set: {
              ...item.national_set,
              cans: (item.national_set.cans / item.setDetails.set_num) * newSetNum,
              details: item.national_set.details.map((detail) => ({
                ...detail,
                count: (detail.count / item.setDetails.set_num) * newSetNum,
              })),
            },
            craft_set: {
              ...item.craft_set,
              cans: (item.craft_set.cans / item.setDetails.set_num) * newSetNum,
              details: item.craft_set.details.map((detail) => ({
                ...detail,
                count: (detail.count / item.setDetails.set_num) * newSetNum,
              })),
            },
          };
        }
        return item;
      })
    );
  };

  const handleDecrementSetNumber = (index: number) => {
    setPurchaseSetItemAll((prevItems) =>
      prevItems.map((item, i) => {
        if (i === index && item.setDetails.set_num > 1) {
          const newSetNum = item.setDetails.set_num - 1;
          return {
            ...item,
            setDetails: {
              ...item.setDetails,
              cans: (item.setDetails.cans / item.setDetails.set_num) * newSetNum,
              set_num: newSetNum,
            },
            national_set: {
              ...item.national_set,
              cans: (item.national_set.cans / item.setDetails.set_num) * newSetNum,
              details: item.national_set.details.map((detail) => ({
                ...detail,
                count: (detail.count / item.setDetails.set_num) * newSetNum,
              })),
            },
            craft_set: {
              ...item.craft_set,
              cans: (item.craft_set.cans / item.setDetails.set_num) * newSetNum,
              details: item.craft_set.details.map((detail) => ({
                ...detail,
                count: (detail.count / item.setDetails.set_num) * newSetNum,
              })),
            },
          };
        }
        return item;
      })
    );
  };

  // 合計金額の受け取った後の処理は改めて考える
  const handlePurchaseItemAll = async () => {
    try {
      const data = await createPurchase(purchaseSetItemAll, jwt);
      // アラートを表示
      alert("合計金額は" + data.total_amount + "円です");

      // /userページへ遷移
      router.push("/user");
    } catch (error) {
      console.error("Error creating purchase:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 bg-gray-100">
      <div className="flex justify-end space-x-4 mb-4">
        <button
          onClick={handleMyRedirect}
          className="bg-amber-600 text-white py-2 px-4 rounded-xl hover:bg-amber-700 focus:outline-none transition-colors duration-200"
        >
          マイページ
        </button>
        <button
          onClick={handleLogout}
          className="bg-amber-600 text-white py-2 px-4 rounded-xl hover:bg-amber-700 focus:outline-none transition-colors duration-200"
        >
          ログアウト
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-4">条件選択</h1>
      <div className="mb-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">全体の本数</label>
          <select
            value={totalCans}
            onChange={(e) => {
              setTotalCans(Number(e.target.value));
              setNationalSet({ cans: 0, set_name: "", set_id: 0 });
              setNationalSetDetails([]);
              setCraftSet({ cans: 0, set_name: "", set_id: 0 });
              setCraftSetDetails([]);
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
              setNationalCraftRatio(JSON.parse(e.target.value)); //選択した文字列をjson形式に変換して格納
              setNationalSet({ cans: 0, set_name: "", set_id: 0 });
              setNationalSetDetails([]);
              setCraftSet({ cans: 0, set_name: "", set_id: 0 });
              setCraftSetDetails([]);
              setIsNationalSelected(false);
              setIsCraftSelected(false);
            }}
            className="select select-bordered w-full"
          >
            {/* デフォルトで表示される値をリストの３番目に変更 */}
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
                <button className="btn btn-outline mb-4" onClick={handleBackToNationalSetSelection}>
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
                    {/* 本数が0本の時の時にはボタンを押せなくする */}
                    <div className="ml-4">
                      <button
                        className={`py-2 px-4 rounded ${
                          nationalCraftRatio.national === 0
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-amber-600 hover:bg-amber-700 text-white"
                        }`}
                        onClick={() =>
                          fetchRecommendations(ecSet.set_name, ecSet.ec_set_id, "national", nationalCraftRatio.national)
                        }
                        disabled={nationalCraftRatio.national === 0}
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
                <button className="btn btn-outline mb-4" onClick={handleBackToCraftSetSelection}>
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
                    {/* 本数が0本の時の時にはボタンを押せなくする */}
                    <div className="ml-4">
                      <button
                        className={`py-2 px-4 rounded ${
                          nationalCraftRatio.craft === 0
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-amber-600 hover:bg-amber-700 text-white"
                        }`}
                        onClick={() =>
                          fetchRecommendations(ecSet.set_name, ecSet.ec_set_id, "craft", nationalCraftRatio.craft)
                        }
                        disabled={nationalCraftRatio.craft === 0}
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
      {/* 購入ボタン */}
      <button onClick={handleAddToCart} className=" bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700">
        買い物かごに入れる
      </button>
      <button onClick={handlePurchaseItemAll} className=" bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700">
        購入する
      </button>
      {/* purchaseSetItemAllの表示 */}
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Purchase Set Items</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {purchaseSetItemAll.map((item, index) => (
            <div key={index} className="card w-full bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Set {index + 1}</h2>
                <p>
                  <span className="font-bold">Cans:</span> {item.setDetails.cans}
                </p>
                <p>
                  <span className="font-bold">Set Number:</span> {item.setDetails.set_num}
                </p>
                <div className="flex space-x-2 mb-2">
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleDecrementSetNumber(index)}
                    disabled={item.setDetails.set_num <= 1}
                  >
                    -
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleIncrementSetNumber(index)}>
                    +
                  </button>
                </div>
                <button className="btn btn-error" onClick={() => handleRemoveItem(index)}>
                  削除
                </button>
                <div className="divider"></div>
                <div>
                  <h3 className="text-lg font-semibold">National Set</h3>
                  <p>
                    <span className="font-bold">Set Name:</span> {item.national_set.set_name}
                  </p>
                  <p>
                    <span className="font-bold">Cans:</span> {item.national_set.cans}
                  </p>
                  <ul className="list-disc ml-5">
                    {item.national_set.details.map((detail, i) => (
                      <li key={i}>
                        {detail.name} - {detail.category} - {detail.price}円 - {detail.count} 本
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="divider"></div>
                <div>
                  <h3 className="text-lg font-semibold">Craft Set</h3>
                  <p>
                    <span className="font-bold">Set Name:</span> {item.craft_set.set_name}
                  </p>
                  <p>
                    <span className="font-bold">Cans:</span> {item.craft_set.cans}
                  </p>
                  <ul className="list-disc ml-5">
                    {item.craft_set.details.map((detail, i) => (
                      <li key={i}>
                        {detail.name} - {detail.category} - {detail.price}円 - {detail.count} 本
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
