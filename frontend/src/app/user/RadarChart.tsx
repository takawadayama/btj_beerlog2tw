// frontend/src/app/user/RadarChart.tsx

import React, { useEffect, useState } from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import axios from 'axios';

Chart.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface RadarChartProps {
  userId: number;
}

const RadarChart: React.FC<RadarChartProps> = ({ userId }) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/user_preferences`, {
          params: { user_id: userId }
        });
        const preferences = response.data;
        const labels = preferences.map((pref: any) => pref.item.item_name);
        const scores = preferences.map((pref: any) => pref.score);

        setData({
          labels,
          datasets: [
            {
              label: 'お好みチャート',
              data: scores,
              backgroundColor: 'rgba(34, 202, 236, 0.2)',
              borderColor: 'rgba(34, 202, 236, 1)',
              borderWidth: 2,
              pointBackgroundColor: 'rgba(34, 202, 236, 1)',
            }
          ]
        });
      } catch (error) {
        console.error("Error fetching user preferences", error);
      }
    };

    fetchData();
  }, [userId]);

  const options = {
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
          callback: function(value: any) {
            return Number(value).toFixed(0); // 小数点なしで表示
          },
          color: '#333', // 文字の色を濃くする
          backdropColor: 'rgba(0, 0, 0, 0)', // 背景を透過
        },
      },
    },
    plugins: {
      legend: {
        display: false, // レーダーチャートのタイトルを非表示
      },
    },
  };

  return (
    <div className="w-96 h-96"> {/* サイズを大きくする */}
      {data && <Radar data={data} options={options} />}
    </div>
  );
};

export default RadarChart;
