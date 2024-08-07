import React from 'react';
import Link from 'next/link';

const Navbar = () => {
  const handleAboutRedirect = () => {
    // ダミー
  };

  const handleIntroductionRedirect = () => {
    // ダミー
  };

  const handleColumnRedirect = () => {
    // ダミー
  };

  const handlePickupPubRedirect = () => {
    // ダミー
  };

  const handleLogout = () => {
    // ログアウトロジック
    localStorage.removeItem('token'); // JWTをローカルストレージから削除
    window.location.href = '/'; // メイン画面へ戻る
  };

  return (
    <nav className="fixed top-0 right-0 left-0 z-30 bg-gray-50 border-b border-gray-400">
      <div className='flex justify-between items-center p-4'>
        <div className="flex space-x-4 ml-20">
          <button onClick={handleAboutRedirect} className="font-sans text-gray-800 py-2 px-4 rounded-xl hover:text-white hover:bg-amber-600 focus:outline-none transition-colors duration-200">びあログとは？</button>
          <button onClick={handleIntroductionRedirect} className="font-sans text-gray-800 py-2 px-4 rounded-xl hover:text-white hover:bg-amber-600 focus:outline-none transition-colors duration-200">クラフトビール入門</button>
          <button onClick={handleColumnRedirect} className="font-sans text-gray-800 py-2 px-4 rounded-xl hover:text-white hover:bg-amber-600 focus:outline-none transition-colors duration-200">ビールコラム</button>
          <button onClick={handlePickupPubRedirect} className="font-sans text-gray-800 py-2 px-4 rounded-xl hover:text-white hover:bg-amber-600 focus:outline-none transition-colors duration-200">ピックアップ居酒屋</button>
        </div>
        <div className="flex space-x-4 mr-20">
          <Link href="/user" legacyBehavior>
            <a className="bg-amber-600 text-white py-2 px-4 rounded-xl hover:bg-amber-700 focus:outline-none transition-colors duration-200">新規投稿</a>
          </Link>
          <button onClick={handleLogout} className="bg-amber-600 text-white py-2 px-4 rounded-xl hover:bg-amber-700 focus:outline-none transition-colors duration-200">ログアウト</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
