import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation"; // useRouterをインポート
import { getUserName } from "./getUserName"; // getUserName関数をインポート

const Navbar: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (path !== "/") {
      const token = localStorage.getItem("token");
      if (token) {
        getUserName(token).then((result) => {
          if (result === "Unauthorized") {
            // Unauthorizedエラーの場合の処理
            localStorage.removeItem("token"); // JWTを破棄
            alert("セッションが切れました。再度ログインしてください。"); // アラートを表示
            router.push("/login"); // ログイン画面にリダイレクト
          } else if (result) {
            setUserName(result);
          }
        });
      } else {
        alert("ログインしてください。"); // アラートを表示
        router.push("/login"); // トークンがない場合もログイン画面にリダイレクト
      }
    } else if (path === "/") {
      // メイン画面の場合はログインできてなくても遷移しない
      const token = localStorage.getItem("token");
      if (token) {
        getUserName(token).then((result) => {
          if (result === "Unauthorized") {
            // Unauthorizedエラーの場合の処理
            localStorage.removeItem("token"); // JWTを破棄
          } else if (result) {
            setUserName(result);
          }
        });
      }
    }
  }, [router, path]);

  const handleLoginRedirect = () => {
    router.push("/login");
  };

  const handleSignup = () => {
    router.push("/signup");
  };

  const handleMyRedirect = () => {
    router.push("/user");
  };

  const handleLogoutHome = () => {
    localStorage.removeItem("token"); // JWTをローカルストレージから削除
    setUserName(null);
    router.push("/"); // ログイン画面へ戻る
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); // JWTをローカルストレージから削除
    router.push("/login"); // ログイン画面へ戻る
  };

  const handleAboutRedirect = () => {
    // ダミーハンドラ
  };

  const handleIntroductionRedirect = () => {
    // ダミーハンドラ
  };

  const handleColumnRedirect = () => {
    // ダミーハンドラ
  };

  const handlePickupPubRedirect = () => {
    // ダミーハンドラ
  };

  const renderButtons = () => {
    if (path === "/") {
      return userName ? (
        <>
          <span className="text-gray-800 font-sans">ようこそ、{userName}さん！</span>
          <button onClick={handleMyRedirect} className="bg-amber-600 text-white py-2 px-4 rounded-xl hover:bg-amber-700 focus:outline-none transition-colors duration-200">
            マイページ
          </button>
          <button onClick={handleLogoutHome} className="bg-amber-600 text-white py-2 px-4 rounded-xl hover:bg-amber-700 focus:outline-none transition-colors duration-200">
            ログアウト
          </button>
        </>
      ) : (
        <>
          <span className="text-gray-800 font-sans">ようこそ、ゲストさん！</span>
          <button onClick={handleLoginRedirect} className="font-sans bg-amber-600 text-white py-2 px-4 rounded-xl hover:bg-amber-700 focus:outline-none transition-colors duration-200">
            ログイン
          </button>
          <button onClick={handleSignup} className="font-sans bg-amber-600 text-white py-2 px-4 rounded-xl hover:bg-amber-700 focus:outline-none transition-colors duration-200">
            新規登録
          </button>
        </>
      );
    } else if (path === "/user") {
      return userName ? (
        <>
          <span className="text-gray-800 font-sans">ようこそ、{userName}さん！</span>
          <Link href="/user" legacyBehavior>
            <a className="bg-amber-600 text-white py-2 px-4 rounded-xl hover:bg-amber-700 focus:outline-none transition-colors duration-200">新規投稿</a>
          </Link>
          <button onClick={handleLogout} className="bg-amber-600 text-white py-2 px-4 rounded-xl hover:bg-amber-700 focus:outline-none transition-colors duration-200">
            ログアウト
          </button>
        </>
      ) : null;
    } else if (path === "/purchase" || path.startsWith("/survey/")) {
      return userName ? (
        <>
          <span className="text-gray-800 font-sans">ようこそ、{userName}さん！</span>
          <Link href="/user" legacyBehavior>
            <a className="bg-amber-600 text-white py-2 px-4 rounded-xl hover:bg-amber-700 focus:outline-none transition-colors duration-200">マイページ</a>
          </Link>
          <Link href="/purchaselog" legacyBehavior>
            <a className="bg-amber-600 text-white py-2 px-4 rounded-xl hover:bg-amber-700 focus:outline-none transition-colors duration-200">購入履歴</a>
          </Link>
          <button onClick={handleLogout} className="bg-amber-600 text-white py-2 px-4 rounded-xl hover:bg-amber-700 focus:outline-none transition-colors duration-200">
            ログアウト
          </button>
        </>
      ) : null;
    } else if (path === "/purchaselog") {
      return userName ? (
        <>
          <span className="text-gray-800 font-sans">ようこそ、{userName}さん！</span>
          <Link href="/user" legacyBehavior>
            <a className="bg-amber-600 text-white py-2 px-4 rounded-xl hover:bg-amber-700 focus:outline-none transition-colors duration-200">マイページ</a>
          </Link>
          <Link href="/purchase" legacyBehavior>
            <a className="bg-amber-600 text-white py-2 px-4 rounded-xl hover:bg-amber-700 focus:outline-none transition-colors duration-200">購入ページ</a>
          </Link>
          <button onClick={handleLogout} className="bg-amber-600 text-white py-2 px-4 rounded-xl hover:bg-amber-700 focus:outline-none transition-colors duration-200">
            ログアウト
          </button>
        </>
      ) : null;
    } else {
      return null;
    }
  };

  return (
    <nav className="fixed top-0 right-0 left-0 z-30 bg-gray-50 bg-opacity-80 border-b border-gray-400">
      <div className="flex justify-between items-center p-4">
        <div className="flex space-x-4 ml-20 items-center">
          <Link href="/" legacyBehavior>
            <a>
              <img src="/logo.png" alt="びあログ ロゴ" className="w-32 h-18 object-contain" />
            </a>
          </Link>
          <button onClick={handleAboutRedirect} className="font-sans text-gray-800 py-2 px-4 rounded-xl hover:text-white hover:bg-amber-600 focus:outline-none transition-colors duration-200">
            びあログとは？
          </button>
          <button onClick={handleIntroductionRedirect} className="font-sans text-gray-800 py-2 px-4 rounded-xl hover:text-white hover:bg-amber-600 focus:outline-none transition-colors duration-200">
            クラフトビール入門
          </button>
          <button onClick={handleColumnRedirect} className="font-sans text-gray-800 py-2 px-4 rounded-xl hover:text-white hover:bg-amber-600 focus:outline-none transition-colors duration-200">
            ビールコラム
          </button>
          <button onClick={handlePickupPubRedirect} className="font-sans text-gray-800 py-2 px-4 rounded-xl hover:text-white hover:bg-amber-600 focus:outline-none transition-colors duration-200">
            ピックアップ居酒屋
          </button>
        </div>
        <div className="flex items-center space-x-4 mr-20">{renderButtons()}</div>
      </div>
    </nav>
  );
};

export default Navbar;
