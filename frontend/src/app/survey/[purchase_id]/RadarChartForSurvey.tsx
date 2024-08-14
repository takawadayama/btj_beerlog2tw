import React from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Item } from './types'; // types.tsからItemをインポート

Chart.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface RadarChartProps {
  items: Item[];
  formData: Record<number, number>;
  onPreferenceChange: (item_id: number, value: number) => void;
  defaultScores: Record<number, number>; // 追加
}

const RadarChartForSurvey: React.FC<RadarChartProps> = ({ items, formData, onPreferenceChange, defaultScores }) => {
  const labels = items.map(item => item.item_name);
  const scores = items.map(item => formData[item.item_id] !== undefined ? formData[item.item_id] : Math.round(defaultScores[item.item_id]) || 0); // 修正

  const data = {
    labels,
    datasets: [
      {
        label: '評価チャート',
        data: scores,
        backgroundColor: 'rgba(255, 193, 7, 0.2)', // アンバー色の背景
        borderColor: 'rgba(255, 193, 7, 1)', // アンバー色の境界線
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255, 193, 7, 1)', // アンバー色のポイント
      }
    ]
  };

  const options = {
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
          callback: function(value: any) {
            return Number(value).toFixed(0);
          },
          color: '#333',
          backdropColor: 'rgba(0, 0, 0, 0)',
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
        display: false,
      },
    },
  };

  const calculatePosition = (index: number, total: number) => {
    const angle = (Math.PI / 2) - (2 * Math.PI * index / total);
    const radius = 0.57; // 中心からの距離を調整
    return {
      top: `${45 - radius * 100 * Math.sin(angle)}%`, // 全体を上にずらす
      left: `${50 + radius * 100 * Math.cos(angle)}%`,
    };
  };

  const getLabelPosition = (item_id: number) => {
    if (item_id === 1 || item_id === 5) {
      return 'flex-row';
    }
    return 'flex-col';
  };

  return (
    <div className="relative w-96 h-96" style={{ transform: 'translateY(-10%)' }}> {/* チャート全体を上にずらす */}
      <Radar data={data} options={options} />
      {items.map((item, index) => {
        const position = calculatePosition(index, items.length);
        return (
          <div
            key={item.item_id}
            style={{
              position: 'absolute',
              top: position.top,
              left: position.left,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className={`flex ${getLabelPosition(item.item_id)} items-center p-1 rounded`}>
              <label className="text-xs mb-1" style={{ whiteSpace: 'nowrap' }}>{item.item_name}</label>
              <select
                value={formData[item.item_id] !== undefined ? formData[item.item_id] : Math.round(defaultScores[item.item_id]) || ""}
                onChange={(e) => onPreferenceChange(item.item_id, parseFloat(e.target.value))}
                className="border p-1 rounded text-xs"
                style={{ width: '60px' }} // 幅を固定
              >
                {[1, 2, 3, 4, 5].map(num => (
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

export default RadarChartForSurvey;
