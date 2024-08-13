import React, { useState } from "react";
import { PurchaseSetItem } from "../../types/purchase_types";

interface PurchaseSetContainerProps {
  purchaseSetItemAll: PurchaseSetItem[];
  setPurchaseSetItemAll: React.Dispatch<React.SetStateAction<PurchaseSetItem[]>>;
}

const PurchaseSetContainer: React.FC<PurchaseSetContainerProps> = ({ purchaseSetItemAll, setPurchaseSetItemAll }) => {
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

  const handleRemoveItem = (index: number) => {
    setPurchaseSetItemAll((prevItems) => prevItems.filter((_, i) => i !== index));
  };

  return (
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
  );
};

export default PurchaseSetContainer;
