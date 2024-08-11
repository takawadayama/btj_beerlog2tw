// components/ConditionsSelector.tsx
import React from "react";

interface ConditionsSelectorProps {
  totalCans: number;
  setTotalCans: (cans: number) => void;
  setNationalSet: (set: { cans: number; set_name: string; set_id: number }) => void;
  setNationalSetDetails: (details: any[]) => void;
  setCraftSet: (set: { cans: number; set_name: string; set_id: number }) => void;
  setCraftSetDetails: (details: any[]) => void;
  setIsNationalSelected: (selected: boolean) => void;
  setIsCraftSelected: (selected: boolean) => void;
  nationalCraftRatio: { national: number; craft: number };
  setNationalCraftRatio: (ratio: { national: number; craft: number }) => void;
  nationalCraftOptions: { [key: number]: { national: number; craft: number }[] };
}

const ConditionsSelector: React.FC<ConditionsSelectorProps> = ({
  totalCans,
  setTotalCans,
  setNationalSet,
  setNationalSetDetails,
  setCraftSet,
  setCraftSetDetails,
  setIsNationalSelected,
  setIsCraftSelected,
  nationalCraftRatio,
  setNationalCraftRatio,
  nationalCraftOptions,
}) => {
  return (
    <>
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
            {nationalCraftOptions[totalCans].map((option, index) => (
              <option key={index} value={JSON.stringify(option)}>
                {option.national}:{option.craft}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
};

export default ConditionsSelector;
