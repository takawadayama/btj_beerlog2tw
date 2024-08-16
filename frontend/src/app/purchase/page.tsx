"use client";
import { useState, useEffect } from "react";
import { getEcSets } from "./getECSets";
import { getRecommendations } from "./getRecommend";
import { useRouter } from "next/navigation";
import { createPurchase } from "./createPurchase";
import Navbar from "../common/Navbar";
import ProfileContainer from "./ProfileContainer";
import PurchaseSetContainer from "./PurchaseSetContainer";
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

  const [nationalKinds, setNationalKinds] = useState<number>(2);
  const [craftKinds, setCraftKinds] = useState<number>(3);
  const nationalKindsOptions = [1, 2, 3];
  const craftKindsOptions = [1, 2, 3, 6];

  const [ngList, setNgList] = useState<NgList[]>([]);

  const [purchaseSetItemAll, setPurchaseSetItemAll] = useState<PurchaseSetItem[]>([]);
  const [jwt, setJwt] = useState<string>("");
  const [userId, setUserId] = useState<number | undefined>(undefined);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSetDetails, setSelectedSetDetails] = useState<RecommendResponseItem[]>([]);
  const [selectedSetDescription, setSelectedSetDescription] = useState("");

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

  const fetchRecommendations = async (
    set_name: string,
    ec_set_id: number,
    category: string, // ここでcategoryを引数として受け取ります
    cans: number,
    kinds: number,
    ngList: NgList[]
  ) => {
    try {
      const ngIdList: number[] = ngList?.map((item) => item.ng_id);
      const data = await getRecommendations(
        {
          ec_set_id,
          category,
          cans,
          kinds,
          ng_id: ngIdList,
        },
        jwt //ヘッダーにJWTを追加
      );

      const updatedData = data.map((item) => ({
        ...item,
        ec_set_id: ec_set_id, // ec_set_id を追加
        category: category, // category フィールドを追加
      }));

      if (category === "national") {
        setNationalSet({ cans: cans, set_name: set_name, set_id: ec_set_id });
        setNationalRecommendations(updatedData); // 修正されたデータを使用します

        setNationalSetDetails(updatedData); // 修正されたデータを使用します

        setSelectedSetDetails(updatedData);
        setSelectedSetDescription(nationalEcSets.find((set) => set.ec_set_id === ec_set_id)?.set_description || "");

        setIsNationalSelected(true);
        setIsModalOpen(true);
      } else if (category === "craft") {
        setCraftSet({ cans: cans, set_name: set_name, set_id: ec_set_id });
        setCraftRecommendations(updatedData); // 修正されたデータを使用します

        setCraftSetDetails(updatedData); // 修正されたデータを使用します

        setSelectedSetDetails(updatedData);
        setSelectedSetDescription(craftEcSets.find((set) => set.ec_set_id === ec_set_id)?.set_description || "");

        setIsCraftSelected(true);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchData("national");
    fetchData("craft");
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

    // デバッグ用のログ出力
    console.log("National Set Details: ", nationalSetDetails);
    console.log("Craft Set Details: ", craftSetDetails);

    if (combinedCans === totalCans) {
      const newPurchaseSetItem: PurchaseSetItem = {
        setDetails: {
          cans: combinedCans,
          set_num: 1,
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
    setNationalSet({ cans: 0, set_name: "", set_id: 0 });
    setNationalSelectedSet(undefined);
    setNationalSetDetails([]);
    setIsNationalSelected(false);
  };

  const ResetCraftSetSelection = () => {
    setCraftSet({ cans: 0, set_name: "", set_id: 0 });
    setCraftSelectedSet(undefined);
    setCraftSetDetails([]);
    setIsCraftSelected(false);
  };

  const handlePurchaseItemAll = async () => {
    try {
      // デバッグ用のログ出力
      console.log("Purchase Set Items: ", purchaseSetItemAll);
      const data = await createPurchase(purchaseSetItemAll, jwt);
      alert("合計金額は" + data.total_amount + "円です");
      router.push("/user");
    } catch (error) {
      console.error("Error creating purchase:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 bg-gray-100 min-h-screen pt-10 mt-5">
      <Navbar /> {/* Navbarコンポーネントの表示 */}
      <div className="flex justify-between items-start bg-gray-100 rounded p-4 gap-4 mb-10 pt-10 pr-10">
        {/* 左 - 条件選択 */}
        <div className="card bg-white shadow-md rounded-lg pt-2 px-4 pb-20 w-1/6">
          <h1 className="text-xl font-bold mb-4 text-amber-600" style={{ fontFamily: "Poppins, sans-serif" }}>
            Step1 <span style={{ display: "block" }}>お届け数量を選択</span>
          </h1>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">全体の本数</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(nationalCraftOptions).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setTotalCans(Number(key));
                    ResetNationalSetSelection();
                    ResetCraftSetSelection();
                  }}
                  className={`py-2 px-4 rounded-lg text-white font-bold ${totalCans === Number(key) ? "bg-amber-600" : "bg-gray-300"} hover:bg-amber-500 transition-all duration-200`}
                >
                  {key}本
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">ナショナル：クラフト</label>
            <div className="grid grid-cols-2 gap-2">
              {nationalCraftOptions[totalCans].map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setNationalCraftRatio(option);
                    ResetNationalSetSelection();
                    ResetCraftSetSelection();
                  }}
                  className={`py-2 px-4 rounded-lg text-white font-bold ${
                    JSON.stringify(nationalCraftRatio) === JSON.stringify(option) ? "bg-amber-600" : "bg-gray-300"
                  } hover:bg-amber-500 transition-all duration-200`}
                >
                  {option.national}:{option.craft}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">ナショナル銘柄数</label>
            <div className="flex justify-between">
              {nationalKindsOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setNationalKinds(option);
                    ResetNationalSetSelection();
                  }}
                  className={`py-2 px-4 rounded-lg text-white font-bold ${nationalKinds === option ? "bg-amber-600" : "bg-gray-300"} hover:bg-amber-500 transition-all duration-200`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">クラフト銘柄数</label>
            <div className="flex justify-between">
              {craftKindsOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setCraftKinds(option);
                    ResetCraftSetSelection();
                  }}
                  className={`py-2 px-4 rounded-lg text-white font-bold ${craftKinds === option ? "bg-amber-600" : "bg-gray-300"} hover:bg-amber-500 transition-all duration-200`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 中央 - レーダーチャートはProfileContainerの中に移動 */}
        <div className="card bg-white shadow-md rounded-lg p-28 w-2/5 relative">
          <h2 className="absolute top-2 left-4 text-xl font-bold text-amber-600" style={{ fontFamily: "Poppins, sans-serif" }}>
            Step2 <span style={{ display: "block" }}>好みを確認</span>
          </h2>
          {userId !== undefined && <ProfileContainer user_id={userId} />}
        </div>

        {/* 右 - ナショナルブランドとクラフトブランドのアルゴリズム選択 */}
        <div className="card bg-white shadow-md rounded-lg pt-2 pb-6 px-4 w-3/5">
          <h2 className="text-xl font-bold text-amber-600 mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
            Step3 びあログおすすめを選択
          </h2>
          <h2 className="text-lg text-gray-600 font-bold">ナショナルビール</h2>
          <div className="overflow-y-auto h-60 bg-white rounded-lg shadow-md p-4">
            <div className="grid grid-cols-2 gap-4">
              {nationalEcSets.map((ecSet) => (
                <div key={ecSet.ec_set_id}>
                  <button
                    onClick={() => {
                      setNationalSelectedSet(ecSet);
                      fetchRecommendations(ecSet.set_name, ecSet.ec_set_id, "national", nationalCraftRatio.national, nationalKinds, ngList);
                    }}
                    className={`py-2 px-4 rounded-lg text-white font-bold w-full ${
                      nationalSelectedSet?.ec_set_id === ecSet.ec_set_id ? "bg-amber-600" : "bg-gray-300"
                    } hover:bg-amber-500 transition-all duration-200`}
                  >
                    {ecSet.set_name}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-lg text-gray-600 font-bold mt-5">クラフトビール</h2>
          <div className="overflow-y-auto h-60 bg-white rounded-lg shadow-md p-4">
            <div className="grid grid-cols-2 gap-4">
              {craftEcSets.map((ecSet) => (
                <div key={ecSet.ec_set_id}>
                  <button
                    onClick={() => {
                      setCraftSelectedSet(ecSet);
                      fetchRecommendations(ecSet.set_name, ecSet.ec_set_id, "craft", nationalCraftRatio.craft, craftKinds, ngList);
                    }}
                    className={`py-2 px-4 rounded-lg text-white font-bold w-full ${
                      craftSelectedSet?.ec_set_id === ecSet.ec_set_id ? "bg-amber-600" : "bg-gray-300"
                    } hover:bg-amber-500 transition-all duration-200`}
                  >
                    {ecSet.set_name}
                  </button>
                </div>
              ))}
            </div>
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
      <PurchaseSetContainer purchaseSetItemAll={purchaseSetItemAll} setPurchaseSetItemAll={setPurchaseSetItemAll} />
      {/* モーダルウィンドウ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-3/4 max-h-full overflow-auto">
            <h2 className="text-lg font-bold mb-4">{nationalSelectedSet?.set_name || craftSelectedSet?.set_name}</h2>
            <p className="text-sm text-gray-600 mb-4">{selectedSetDescription}</p>
            {selectedSetDetails.map((item) => (
              <div key={item.ec_brand_id} className="mb-4">
                {item.picture ? (
                  <img src={`data:image/png;base64,${item.picture}`} alt={item.name} className="w-10 h-10 object-cover rounded-full border-2 border-amber-600 mr-4" />
                ) : (
                  <span className="w-10 h-10 rounded-full border-2 border-amber-600 mr-4 flex items-center justify-center">なし</span>
                )}
                <h3 className="text-sm font-semibold">{item.name}</h3>
                <p className="text-xs">価格: {item.price} 円</p>
                <p className="text-xs">本数: {item.count} 本</p>
              </div>
            ))}
            <button onClick={closeModal} className="mt-4 bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700">
              戻る
            </button>
          </div>
          <div className="fixed inset-0 opacity-50 z-40" onClick={closeModal}></div>
        </div>
      )}
    </div>
  );
}
