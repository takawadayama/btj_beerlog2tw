"use client";
import { useState, useEffect } from "react";
import { getEcSets } from "./getECSets";
import { getRecommendations } from "./getRecommend";
import { useRouter } from "next/navigation";
import { createPurchase } from "./createPurchase";
import Navbar from "./Navbar"; // Navbarコンポーネントのインポート
import ProfileContainer from "./ProfileContainer"; // ProfileContainerコンポーネントのインポート
import { jwtDecode } from "jwt-decode";

import { fetchEcSearchResults } from "./api";

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
  const [newFavorite, setNewFavorite] = useState<string>("");
  const [searchResults, setSearchResults] = useState<EcBrandItem[]>([]);
  const [selectedFavorite, setSelectedFavorite] = useState<EcBrandItem | null>(null);
  const [isNewFavoriteSelected, setIsNewFavoriteSelected] = useState<boolean>(false);

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
    setJwt(token);
    const decodedToken = jwtDecode<DecodedToken>(token);
    setUserId(Number(decodedToken.sub));
  }, []);

  useEffect(() => {
    setNationalCraftRatio(nationalCraftOptions[totalCans][1]);
  }, [totalCans]);

  const handleRemoveNgItem = (indexToRemove: number) => {
    setNgList((prevNgList) => prevNgList.filter((_, index) => index !== indexToRemove));
  };

  // "別の銘柄を選択"ボタンを押したときに、それをngListへ追加するとともにリコメンドし直す
  const handleProposeAnotherBrand = (ec_brand_id: number, name: string, category: string) => {
    // 1. ngListの内容を取得して、tempNgListへ入れる
    const tempNgList = [...ngList];

    // 2. tempNgListに対して、重複するかどうかを確認したうえで、ec_brand_idとnameを追加する
    const exists = tempNgList.some((item) => item.ng_id === ec_brand_id);
    if (!exists) {
      tempNgList.push({ ng_id: ec_brand_id, ng_name: name });
    }

    // 3. setNgList(temNgList)として、変数を渡す
    setNgList(tempNgList);

    // 4. temNgListを用いて、fetchRecommendationsを実行する
    if (category === "craft") {
      if (craftSelectedSet) {
        fetchRecommendations(craftSelectedSet.set_name, craftSelectedSet.ec_set_id, category, nationalCraftRatio.craft, craftKinds, tempNgList);
      } else {
        console.error("craftSelectedSet is undefined");
      }
    }
    if (category === "national") {
      if (nationalSelectedSet) {
        fetchRecommendations(nationalSelectedSet.set_name, nationalSelectedSet.ec_set_id, category, nationalCraftRatio.national, nationalKinds, tempNgList);
      } else {
        console.error("nationalSelectedSet is undefined");
      }
    }
  };

  const handleFavoriteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewFavorite(e.target.value);
    setIsNewFavoriteSelected(false);
  };

  useEffect(() => {
    const fetchResults = async () => {
      if (newFavorite.length > 0 && !isNewFavoriteSelected) {
        try {
          const results = await fetchEcSearchResults(newFavorite);
          setSearchResults(results);
        } catch (error) {
          console.error("Failed to fetch search results:", error);
        }
      } else {
        setSearchResults([]);
      }
    };

    fetchResults();
  }, [newFavorite]);

  const handleFavoriteSelect = (ec_brand: EcBrandItem) => {
    setSelectedFavorite(ec_brand);
    setNewFavorite(ec_brand.name);
    setIsNewFavoriteSelected(true);
    setSearchResults([]);
  };

  //選択したnational銘柄へ変更する処理
  const handleUpdateNationalSelectedBrand = (ec_brand_id: number) => {
    if (selectedFavorite?.category !== "national") {
      alert("nationalブランドを選択してください");
      return; // 条件が満たされない場合、処理を中断
    }

    // 既にselectedFavorite.ec_brand_idを持つアイテムが存在するかチェック
    const alreadyExistsInRecommendations = nationalRecommendations.some((item) => item.ec_brand_id === selectedFavorite?.ec_brand_id);

    const alreadyExistsInSetDetails = nationalSetDetails.some((item) => item.ec_brand_id === selectedFavorite?.ec_brand_id);

    if (alreadyExistsInRecommendations || alreadyExistsInSetDetails) {
      alert("この銘柄は既に選択されています。");
      return; // 存在する場合、処理を中断
    }

    setNationalRecommendations((prevRecommendations) =>
      prevRecommendations.map((item) =>
        item.ec_brand_id === ec_brand_id
          ? {
              ...item,
              // 必要に応じて他のプロパティも更新可能
              ec_brand_id: selectedFavorite?.ec_brand_id || ec_brand_id,
              name: selectedFavorite?.name || item.name,
              price: selectedFavorite?.price || item.price,
              description: selectedFavorite?.description || item.description,
            }
          : item
      )
    );

    setNationalSetDetails((prevSetDetails) =>
      prevSetDetails.map((item) =>
        item.ec_brand_id === ec_brand_id
          ? {
              ...item,
              // nationalSetDetailsにも同じように更新
              ec_brand_id: selectedFavorite?.ec_brand_id || ec_brand_id,
              name: selectedFavorite?.name || item.name,
              price: selectedFavorite?.price || item.price,
              ec_set_id: 998, // 自分で選択したものは999を入れる
            }
          : item
      )
    );
    setSelectedFavorite(null);
  };

  //選択したcraft銘柄へ変更する処理
  const handleUpdateCraftSelectedBrand = (ec_brand_id: number) => {
    if (selectedFavorite?.category !== "craft") {
      alert("craftブランドを選択してください");
      return; // 条件が満たされない場合、処理を中断
    }

    // 既にselectedFavorite.ec_brand_idを持つアイテムが存在するかチェック
    const alreadyExistsInRecommendations = craftRecommendations.some((item) => item.ec_brand_id === selectedFavorite?.ec_brand_id);

    const alreadyExistsInSetDetails = craftSetDetails.some((item) => item.ec_brand_id === selectedFavorite?.ec_brand_id);

    if (alreadyExistsInRecommendations || alreadyExistsInSetDetails) {
      alert("この銘柄は既に選択されています。");
      return; // 存在する場合、処理を中断
    }

    setCraftRecommendations((prevRecommendations) =>
      prevRecommendations.map((item) =>
        item.ec_brand_id === ec_brand_id
          ? {
              ...item,
              // 必要に応じて他のプロパティも更新可能
              ec_brand_id: selectedFavorite?.ec_brand_id || ec_brand_id,
              name: selectedFavorite?.name || item.name,
              price: selectedFavorite?.price || item.price,
              description: selectedFavorite?.description || item.description,
            }
          : item
      )
    );

    setCraftSetDetails((prevSetDetails) =>
      prevSetDetails.map((item) =>
        item.ec_brand_id === ec_brand_id
          ? {
              ...item,
              // nationalSetDetailsにも同じように更新
              ec_brand_id: selectedFavorite?.ec_brand_id || ec_brand_id,
              name: selectedFavorite?.name || item.name,
              price: selectedFavorite?.price || item.price,
              ec_set_id: 999, // 自分で選択したものは999を入れる
            }
          : item
      )
    );
    setSelectedFavorite(null);
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

          {/* ngListの内容を表示 */}
          <div className="mt-4">
            <h2 className="text-xl font-bold mb-2">除外銘柄リスト</h2>
            {ngList.length > 0 ? (
              <ul className="list-disc ml-5">
                {ngList.map((item, index) => (
                  <li key={index} className="text-sm flex justify-between items-center">
                    {item.ng_name}
                    <button className="ml-4 bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600" onClick={() => handleRemoveNgItem(index)}>
                      削除
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">現在、除外されている銘柄はありません。</p>
            )}
          </div>

          <div>
            {/* 自分で銘柄を選択 */}
            <p className="text-lg font-semibold mb-2">自分で銘柄を選択する</p>
            <p className="text-md mb-2">選択された銘柄: {selectedFavorite ? `${selectedFavorite.name} [${selectedFavorite.category}]` : ""}</p>
            <input type="text" value={newFavorite} onChange={handleFavoriteChange} placeholder="銘柄を検索" className="border p-2 rounded w-full mt-2" />
            {searchResults.length > 0 && (
              <ul className="border mt-2 rounded w-full">
                {searchResults.map((result) => (
                  <li key={result.ec_brand_id} onClick={() => handleFavoriteSelect(result)} className="cursor-pointer p-2 hover:bg-gray-300">
                    {result.name}
                  </li>
                ))}
              </ul>
            )}
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
                  {/* 再提案ボタンの追加 */}
                  <button
                    className=" bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700 ml-auto"
                    onClick={() => {
                      if (nationalSelectedSet) {
                        fetchRecommendations(nationalSelectedSet.set_name, nationalSelectedSet.ec_set_id, "national", nationalCraftRatio.national, nationalKinds, ngList);
                      } else {
                        console.error("nationalSelectedSet is undefined");
                      }
                    }}
                  >
                    再提案
                  </button>
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
                        <button className=" bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700" onClick={() => handleUpdateNationalSelectedBrand(item.ec_brand_id)}>
                          選択銘柄に変更
                        </button>
                        <button className=" bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700" onClick={() => handleProposeAnotherBrand(item.ec_brand_id, item.name, "national")}>
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
                  {/* 再提案ボタンの追加 */}
                  <button
                    className=" bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700 ml-auto"
                    onClick={() => {
                      if (craftSelectedSet) {
                        fetchRecommendations(craftSelectedSet.set_name, craftSelectedSet.ec_set_id, "craft", nationalCraftRatio.craft, craftKinds, ngList);
                      } else {
                        console.error("craftSelectedSet is undefined");
                      }
                    }}
                  >
                    再提案
                  </button>
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
                        <button className=" bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700" onClick={() => handleUpdateCraftSelectedBrand(item.ec_brand_id)}>
                          選択銘柄に変更
                        </button>
                        <button className=" bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700" onClick={() => handleProposeAnotherBrand(item.ec_brand_id, item.name, "craft")}>
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
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Purchase Set Items</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {purchaseSetItemAll.map((item, index) => (
            <div key={index} className="card w-full bg-base-100 shadow-xl rounded-lg">
              <div className="card-body">
                <div className="flex justify-between items-center">
                  {/* 1つ目のカラム: Set, Cans, Set Number */}
                  <div className="flex-1">
                    <h2 className="card-title">セット {index + 1}</h2>
                    <h2 className="card-title">
                      数量：{item.setDetails.set_num}　[{item.setDetails.cans}本]
                    </h2>
                  </div>

                  {/* 2つ目のカラム: +, - ボタン */}
                  <div className="flex items-center space-x-1 mr-4">
                    <button className="btn btn-secondary" onClick={() => handleDecrementSetNumber(index)} disabled={item.setDetails.set_num <= 1}>
                      -
                    </button>
                    <button className="btn btn-secondary" onClick={() => handleIncrementSetNumber(index)}>
                      +
                    </button>
                  </div>

                  {/* 3つ目のカラム: 削除ボタン */}
                  <div>
                    <button className="btn btn-error" onClick={() => handleRemoveItem(index)}>
                      削除
                    </button>
                  </div>
                </div>

                <div className="divider"></div>

                {/* National Set Section */}
                <div className="card bg-gray-100 shadow-md p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold mr-2">{item.national_set.set_name}</h3>
                    <h3 className="text-lg font-semibold mr-2">[{item.national_set.cans} 本]</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="table table-compact w-full">
                      <thead>
                        <tr>
                          <th>銘柄</th>
                          <th>カテゴリ</th>
                          <th>価格(円)</th>
                          <th>本数</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.national_set.details.map((detail, i) => (
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

                <div className="divider"></div>

                {/* Craft Set Section */}
                <div className="card bg-gray-100 shadow-md p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold mr-2">{item.craft_set.set_name}</h3>
                    <h3 className="text-lg font-semibold mr-2">[{item.craft_set.cans} 本]</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="table table-compact w-full">
                      <thead>
                        <tr>
                          <th>銘柄</th>
                          <th>カテゴリ</th>
                          <th>価格(円)</th>
                          <th>本数</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.craft_set.details.map((detail, i) => (
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
