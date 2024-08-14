"use client";
import { useState, useEffect } from "react";
import { getEcSets } from "./getECSets";
import { getRecommendations } from "./getRecommend";
import { useRouter } from "next/navigation";
import { createPurchase } from "./createPurchase";
import Navbar from "../common/Navbar"; // Navbarコンポーネントのインポート
import ProfileContainer from "./ProfileContainer"; // ProfileContainerコンポーネントのインポート
import PurchaseSetContainer from "./PurchaseSetContainer"; //買い物かごのコンポーネント
import { jwtDecode } from "jwt-decode";

import { ECSetItem, RecommendResponseItem, nationalCraftOptions, PurchaseItem, PurchaseSubSetItem, PurchaseSetItem, NgList, Brand, EcBrandItem, DecodedToken } from "../../types/purchase_types";

export default function Home() {
  const [nationalEcSets, setNationalEcSets] = useState<ECSetItem[]>([]);
  const [craftEcSets, setCraftEcSets] = useState<ECSetItem[]>([]);
  const [nationalRecommendations, setNationalRecommendations] = useState<RecommendResponseItem[]>([]);
  const [craftRecommendations, setCraftRecommendations] = useState<RecommendResponseItem[]>([]);

  const [nationalSelectedSet, setNationalSelectedSet] = useState<ECSetItem>();
  const [craftSelectedSet, setCraftSelectedSet] = useState<ECSetItem>();

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

  //おススメセットの種類を指定
  const [nationalKinds, setNationalKinds] = useState<number>(2);
  const [craftKinds, setCraftKinds] = useState<number>(3);
  const nationalKindsOptions = [1, 2, 3];
  const craftKindsOptions = [1, 2, 3, 6];

  const [ngList, setNgList] = useState<NgList[]>([]);

  const [purchaseSetItemAll, setPurchaseSetItemAll] = useState<PurchaseSetItem[]>([]);
  const [jwt, setJwt] = useState<string>("");
  const [userId, setUserId] = useState<number | undefined>(undefined);

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
  const fetchRecommendations = async (set_name: string, ec_set_id: number, category: string, cans: number, kinds: number, ngList: NgList[]) => {
    try {
      const ngIdList: number[] = ngList?.map((item) => item.ng_id);
      const data = await getRecommendations({
        ec_set_id,
        category,
        cans,
        kinds,
        ng_id: ngIdList,
      });
      if (category === "national") {
        setNationalSet({ cans: cans, set_name: set_name, set_id: ec_set_id });
        setNationalRecommendations(data);

        // 現在の状態は無視して、dataの内容で上書きする
        const updatedDetails = data.map((item) => ({
          ...item,
          ec_brand_id: item.ec_brand_id,
          category: "national",
          name: item.name,
          price: item.price,
          ec_set_id: ec_set_id,
        }));
        setNationalSetDetails(updatedDetails);

        setIsNationalSelected(true);
      } else if (category === "craft") {
        setCraftSet({ cans: cans, set_name: set_name, set_id: ec_set_id });
        setCraftRecommendations(data);

        // 現在の状態は無視して、dataの内容で上書きする
        const updatedDetails = data.map((item) => ({
          ...item,
          ec_brand_id: item.ec_brand_id,
          category: "craft",
          name: item.name,
          price: item.price,
          ec_set_id: ec_set_id,
        }));
        setCraftSetDetails(updatedDetails);

        setIsCraftSelected(true);
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    }
  };

  useEffect(() => {
    fetchData("national");
    fetchData("craft");
    //トークン情報を取得
    const token = localStorage.getItem("token") as string;
    if (token) {
      setJwt(token);
      const decodedToken = jwtDecode<DecodedToken>(token);
      setUserId(Number(decodedToken.sub));
    }
  }, []);

  useEffect(() => {
    setNationalCraftRatio(nationalCraftOptions[totalCans][1]);
  }, [totalCans]);

  const handleRemoveNgItem = (indexToRemove: number) => {
    setNgList((prevNgList) => prevNgList.filter((_, index) => index !== indexToRemove));
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

  const ResetNationalSetSelection = () => {
    // national選択に関連するものを初期化
    setNationalSet({ cans: 0, set_name: "", set_id: 0 });
    setNationalSelectedSet(undefined);
    setNationalSetDetails([]);
    setIsNationalSelected(false);
  };

  const ResetCraftSetSelection = () => {
    // craft選択に関連するものを初期化
    setCraftSet({ cans: 0, set_name: "", set_id: 0 });
    setCraftSelectedSet(undefined);
    setCraftSetDetails([]);
    setIsCraftSelected(false);
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
    <div className="container mx-auto p-4 bg-gray-100 min-h-screen pt-20 mt-5">
      <Navbar /> {/* Navbarコンポーネントの表示 */}
      <div className="bg-gray-200 rounded p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10 pt-10 pr-10">
        {/* 左 */}
        <div className="card bg-white shadow-md rounded-lg p-4 mb-4">
          <h1 className="text-2xl font-bold mb-4">条件選択</h1>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">全体の本数</label>
            <select
              value={totalCans}
              onChange={(e) => {
                setTotalCans(Number(e.target.value));
                ResetNationalSetSelection();
                ResetCraftSetSelection();
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
                ResetNationalSetSelection();
                ResetCraftSetSelection();
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

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">ナショナルの種類数</label>
            <select
              value={nationalKinds}
              onChange={(e) => {
                setNationalKinds(Number(e.target.value));
                ResetNationalSetSelection();
              }}
              className="select select-bordered w-full"
            >
              {nationalKindsOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">クラフトの種類数</label>
            <select
              value={craftKinds}
              onChange={(e) => {
                setCraftKinds(Number(e.target.value));
                ResetCraftSetSelection();
              }}
              className="select select-bordered w-full"
            >
              {craftKindsOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* 右 */}
        <div className="shadow-md rounded-lg p-4 mb-4 overflow-hidden">
          <div className="card mb-4 bg-gray-200 p-8 pt-20 rounded flex flex-col items-center justify-center relative col-span-1" style={{ height: "auto" }}>
            {userId !== undefined && <ProfileContainer user_id={userId} />}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-bold mb-2">National</h2>
          <div className="overflow-y-auto h-64 bg-white rounded-lg shadow-md p-4">
            {isNationalSelected ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  {nationalSelectedSet && <span className="text-lg font-semibold">{nationalSelectedSet.set_name}</span>}
                  <button className="btn btn-outline ml-auto" onClick={ResetNationalSetSelection}>
                    セット選択に戻る
                  </button>
                </div>
                {nationalRecommendations.map((item) => (
                  <div key={item.ec_brand_id} className="card card-compact bg-blue-100 shadow-xl mb-2 p-1">
                    <div className="card-body p-1 flex flex-row justify-between items-center">
                      <h3 className="card-title text-sm font-semibold">{item.name}</h3>
                      <p className="text-xs">{item.description}</p>
                      <div className="flex items-center space-x-4">
                        <p className="text-xs">Price: {item.price}</p>
                        <p className="text-xs">Count: {item.count}</p>
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
                        className={`py-2 px-4 rounded ${nationalCraftRatio.national === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-amber-600 hover:bg-amber-700 text-white"}`}
                        onClick={() => {
                          setNationalSelectedSet(ecSet);
                          fetchRecommendations(ecSet.set_name, ecSet.ec_set_id, "national", nationalCraftRatio.national, nationalKinds, ngList);
                        }}
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
                <div className="flex items-center justify-between mb-4">
                  {craftSelectedSet && <span className="text-lg font-semibold">{craftSelectedSet.set_name}</span>}
                  <button className="btn btn-outline ml-auto" onClick={ResetCraftSetSelection}>
                    セット選択に戻る
                  </button>
                </div>
                {craftRecommendations.map((item) => (
                  <div key={item.ec_brand_id} className="card card-compact bg-green-100 shadow-xl mb-2 p-1">
                    <div className="card-body p-1 flex flex-row justify-between items-center">
                      <h3 className="card-title text-sm font-semibold">{item.name}</h3>
                      <p className="text-xs">{item.description}</p>
                      <div className="flex items-center space-x-4">
                        <p className="text-xs">Price: {item.price}</p>
                        <p className="text-xs">Count: {item.count}</p>
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
                        className={`py-2 px-4 rounded ${nationalCraftRatio.craft === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-amber-600 hover:bg-amber-700 text-white"}`}
                        onClick={() => {
                          setCraftSelectedSet(ecSet);
                          fetchRecommendations(ecSet.set_name, ecSet.ec_set_id, "craft", nationalCraftRatio.craft, craftKinds, ngList);
                        }}
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
      <div className="flex space-x-4 mt-4 mb-4">
        <button onClick={handleAddToCart} className="bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700">
          買い物かごに入れる
        </button>
        <button onClick={handlePurchaseItemAll} className="bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700">
          購入する
        </button>
      </div>
      {/* purchaseSetItemAllの表示 */}
      <PurchaseSetContainer purchaseSetItemAll={purchaseSetItemAll} setPurchaseSetItemAll={setPurchaseSetItemAll} />
    </div>
  );
}
