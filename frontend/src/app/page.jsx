"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import Link from "next/link";

const Home = () => {
  const [isJwt, setIsJwt] = useState(false);
  const [jwtMessage, setJwtMessage] = useState('');
  const [searchType, setSearchType] = useState('keyword');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapData, setMapData] = useState('');

  const router = useRouter();

  useEffect(() => {
    const jwt = localStorage.getItem('token');
    if (jwt) {
      setJwtMessage(`JWTあり`);
      setIsJwt(true);
    } else {
      setJwtMessage('JWTなし');
    }
  }, []);


  const handleLoginRedirect = () => {
    router.push('/login'); // `/login` への遷移
  };

  const handleSignup = () => {
    router.push('/signup'); // `/signup` への遷移
  };

  const handleMyRedirect = () => {
    router.push('/user'); // `/mypage` への遷移
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); // JWTをローカルストレージから削除
    setIsJwt(false);
    setJwtMessage('JWTなし');
  };
  const handleAboutRedirect = () => {
    router.push('/about'); // 「びあログとは？」
  };

  const handleIntroductionRedirect = () => {
    router.push('/introduction'); // 「おいしい生ビール入門」
  };

  const handleColumnRedirect = () => {
    router.push('/column'); // 「ビールコラム」
  };

  const handlePickupPubRedirect = () => {
    router.push('/pickup-pub'); // 「ピックアップ居酒屋」
  };

  // 検索関連
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // 検索クエリを使用した検索ロジックをここに追加(await fetchがうんちゃらみたいなやつ)
    console.log(`Searching for ${searchQuery} by ${searchType}`);
  };

  return (
    <>
      <div className='maindiv relative bg-[url("/kampai.jpg")] h-screen bg-cover bg-center'>
        {/* 背景オーバーレイ */}
        <div className="absolute bg-gray-600 bg-opacity-80 h-full w-full z-10"></div>
        
        {/* 上部ナビゲーションバー */}
        <div className='container-body absolute top-0 right-0 left-0 z-30 flex justify-between items-center pt-3 pb-10'>
          {/* 左側のボタン */}
          <div className="flex space-x-4 p-4 ml-20">
            <button onClick={handleAboutRedirect} className="font-sans text-white py-2 px-4 rounded-xl hover:bg-amber-600 focus:outline-none transition-colors duration-200">びあログとは？</button>
            <button onClick={handleIntroductionRedirect} className="font-sans text-white py-2 px-4 rounded-xl hover:bg-amber-600 focus:outline-none transition-colors duration-200">クラフトビール入門</button>
            <button onClick={handleColumnRedirect} className="font-sans text-white py-2 px-4 rounded-xl hover:bg-amber-600 focus:outline-none transition-colors duration-200">ビールコラム</button>
            <button onClick={handlePickupPubRedirect} className="font-sans text-white py-2 px-4 rounded-xl hover:bg-amber-600 focus:outline-none transition-colors duration-200">ピックアップ居酒屋</button>
          </div>
          {/* 右側のボタン */}
          <div className="flex space-x-4 p-4 mr-20">
            {!isJwt && (
              <>
                <button onClick={handleLoginRedirect} className="font-sans bg-amber-600 text-white py-2 px-4 rounded-xl hover:bg-amber-700 focus:outline-none transition-colors duration-200">ログイン</button>
                <button onClick={handleSignup} className="font-sans bg-amber-600 text-white py-2 px-4 rounded-xl hover:bg-amber-700 focus:outline-none transition-colors duration-200">新規登録</button>
              </>
            )}
            {isJwt && (
              <>
                <button onClick={handleMyRedirect} className="bg-amber-600 text-white py-2 px-4 rounded-xl hover:bg-amber-700 focus:outline-none transition-colors duration-200">マイページ</button>
                <button onClick={handleLogout} className="bg-amber-600 text-white py-2 px-4 rounded-xl hover:bg-amber-700 focus:outline-none transition-colors duration-200">ログアウト</button>
              </>
            )}
          </div>
        </div>
        
        {/* ロゴと検索機能が含まれるコンテナ */}
        <div className="absolute inset-0 flex flex-col justify-center items-center z-20">
          {/* ロゴ（アニメーションあり） */}
          <img src="/logo.png" alt="ロゴ" className="h-36 animate-fadeInScaleUp" />
          {/* コメント */}
          <p className="font-sans mb-4 text-center" style={{ fontSize: '1rem', color: 'white' }}>
          自宅でも居酒屋でも。飲みたいビールに出会える。
          </p>
          {/* 検索オプションと検索窓 */}
          <div className="flex flex-col items-center justify-center">
            <div className="flex mt-4 divide-x divide-white w-full">
              {/* 最初のボタン */}
              <button
                className="bg-amber-600 text-white py-1 px-4 rounded-l-3xl hover:bg-amber-700 focus:outline-none transition-colors duration-200 flex-grow text-sm"
                onClick={() => setSearchType('keyword')}
              >
                キーワードから探す
              </button>
              {/* 中央のボタン */}
              <button 
                  className="bg-amber-600 text-white py-1 px-4 hover:bg-amber-700 focus:outline-none transition-colors duration-200 flex-grow text-sm"
                  onClick={() => router.push('/search')}
                >
                  現在地から探す
              </button>
              {/* 最後のボタン */}
              <button 
                className="bg-amber-600 text-white py-1 px-4 rounded-r-3xl hover:bg-amber-700 focus:outline-none transition-colors duration-200 flex-grow text-sm"
                onClick={() => setSearchType('brand')}
              >
                銘柄から探す
              </button>
            </div>
            <form className="flex justify-center mt-6 w-full" onSubmit={handleSearchSubmit}>
              <input
                className="border-4 border-amber-600 rounded-l-xl py-2 px-6 h-12 flex-grow  text-sm"
                type="text"
                placeholder="キーワードを入力"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white rounded-r-xl px-0 py-2 h-12 flex-grow  text-sm">
                検索
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;