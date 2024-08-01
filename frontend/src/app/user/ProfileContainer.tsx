import React from 'react';
import Link from 'next/link';

interface User {
  user_id: number;
  user_name: string;
  user_profile: string;
  user_picture: string;
}

interface ProfileContainerProps {
  user: User;
}

const ProfileContainer: React.FC<ProfileContainerProps> = ({ user }) => {
  return (
    <div className="bg-gray-200 rounded p-4 flex justify-between items-start mb-10">
      {/* 左側 */}
      <div className="flex items-center flex-col p-4">
        <img
          src={`data:image/jpeg;base64,${user.user_picture}`}
          alt="User Picture"
          className="rounded-full w-52 h-52 object-cover mb-4"
        />
        <div className="text-center">
          <h2 className="text-xl font-bold">{user.user_name}</h2>
          <p>{user.user_profile}</p>
        </div>
        {/* フォロワー、フォロー中、投稿数 */}
        <div className="flex justify-around w-full mt-4">
          <div className="text-center">
            <p className="font-bold">フォロワー</p>
            <p>958</p>
          </div>
          <div className="text-center">
            <p className="font-bold">フォロー中</p>
            <p>495</p>
          </div>
          <div className="text-center">
            <p className="font-bold">投稿</p>
            <p>593</p>
          </div>
        </div>
      </div>
      {/* 中央 */}
      <div className="flex flex-col items-center p-4">
        <div className="flex items-center mb-2">
          <h2 className="text-xl font-bold">お好み</h2>
          <Link href="/user/admin" legacyBehavior>
            <a className="ml-4 bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700">お好みを修正する</a>
          </Link>
        </div>
        <div className="mb-4">
          <p>銘柄: 黒ラベル, 岸和田ビール 鎮工</p>
          <p>味わいチャート:</p>
          <img src="/SampleChart.png" alt="Taste Chart" className="w-64 h-64" />
        </div>
      </div>
      {/* 右側 */}
      <div className="flex flex-col items-center p-4">
        <div className="mb-8 text-center">
          <h2 className="text-xl font-bold mb-2">お店でびあログ</h2>
          <p>累計生ビール: 2,531杯</p>
          <p>訪問店舗数: 692店舗</p>
          <p className="mb-4">生ビールランク: 神</p>
          <Link href="/" legacyBehavior>
            <a className="bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700 mt-2">飲み屋を探す</a>
          </Link>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">おうちでびあログ</h2>
          <p>累計缶ビール: 3,453本</p>
          <p>累計摂取量: 1,208ℓ</p>
          <p>銘柄数: 401店舗</p>
          <p className="mb-4">おうちビールランク: レジェンド</p>
          <Link href="/purchase" legacyBehavior>
            <a className="bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700 mt-2">おすすめビールを自宅に届ける</a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfileContainer;
