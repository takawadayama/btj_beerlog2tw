import React from "react";
import { Radar } from "react-chartjs-2";
import { Chart, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";
import { Preference } from "../../types/purchase_types";

Chart.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface RadarChartProps {
  preferences: Preference[];
  onPreferenceChange: (item_id: number, value: number) => void;
  style?: React.CSSProperties; // スタイルプロパティを追加
}

const RadarChart: React.FC<RadarChartProps> = ({ preferences, onPreferenceChange, style }) => {
  const labels = preferences.map((pref) => pref.item.item_name); // item.item_name を参照
  const scores = preferences.map((pref) => pref.score);

  const data = {
    labels,
    datasets: [
      {
        label: "お好みチャート",
        data: scores,
        backgroundColor: "rgba(255, 193, 7, 0.2)", // アンバー色の背景
        borderColor: "rgba(255, 193, 7, 1)", // アンバー色の境界線
        borderWidth: 2,
        pointBackgroundColor: "rgba(255, 193, 7, 1)", // アンバー色のポイント
      },
    ],
  };

  const options = {
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
          callback: function (value: any) {
            return Number(value).toFixed(0); // 小数点なしで表示
          },
          color: "#333", // 文字の色を濃くする
          backdropColor: "rgba(0, 0, 0, 0)", // 背景を透過
          font: {
            size: 15,
          },
        },
        pointLabels: {
          font: {
            size: 14,
          },
          display: false, // 内側の項目名を非表示
        },
      },
    },
    plugins: {
      legend: {
        display: false, // レーダーチャートのタイトルを非表示
      },
    },
  };

  const calculatePosition = (index: number, total: number) => {
    const angle = Math.PI / 2 - (2 * Math.PI * index) / total;
    const radius = 0.6; // 中心からの距離を調整
    return {
      top: `${50 - radius * 100 * Math.sin(angle)}%`,
      left: `${50 + radius * 100 * Math.cos(angle)}%`,
    };
  };

  return (
    <div className="relative w-96 h-96" style={style}>
      {" "}
      {/* サイズを大きくする */}
      <Radar data={data} options={options} />
      {preferences.map((preference, index) => {
        const position = calculatePosition(index, preferences.length);
        return (
          <div
            key={preference.item_id}
            style={{
              position: "absolute",
              top: position.top,
              left: position.left,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="flex flex-col items-center">
              <label className="text-xs mb-1" style={{ whiteSpace: "nowrap" }}>
                {preference.item.item_name}
              </label>{" "}
              {/* item_name を直接使用 */}
              <select
                value={preference.score}
                onChange={(e) => onPreferenceChange(preference.item_id, parseFloat(e.target.value))}
                className="border p-1 rounded text-xs"
                style={{ marginTop: "2px" }} // ラベルとセレクトボックスの間を狭くする
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RadarChart;
