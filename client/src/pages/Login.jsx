import React, { useState } from "react";
import { motion } from "framer-motion";
import { LogIn, Eye, EyeOff } from "lucide-react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import logoDesa from "../images/logo-desa.png";

export default function Login() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginShow, setLoginShow] = useState(false);

  const doLogin = async e => {
    e.preventDefault();
    setError("");

    if (!loginUsername || !loginPassword) {
      setError("Username dan password admin wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", {
        username: loginUsername,
        password: loginPassword
      });

      if (data?.user?.role !== "admin") {
        setError("Halaman login ini hanya untuk admin");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      nav("/");
    } catch (err) {
      setError(err?.response?.data?.error || "Gagal login admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid place-items-center bg-slate-100 p-4">
      <style>{`
        @keyframes floatSlow {
          0% { transform: translate3d(0px, 0px, 0) scale(1); }
          50% { transform: translate3d(16px, -18px, 0) scale(1.05); }
          100% { transform: translate3d(0px, 0px, 0) scale(1); }
        }

        @keyframes floatMedium {
          0% { transform: translate3d(0px, 0px, 0) scale(1); }
          50% { transform: translate3d(-18px, 16px, 0) scale(1.08); }
          100% { transform: translate3d(0px, 0px, 0) scale(1); }
        }

        @keyframes floatSoft {
          0% { transform: translate3d(0px, 0px, 0) rotate(0deg); }
          50% { transform: translate3d(10px, -10px, 0) rotate(4deg); }
          100% { transform: translate3d(0px, 0px, 0) rotate(0deg); }
        }

        @keyframes pulseGlow {
          0% { opacity: .28; transform: scale(1); }
          50% { opacity: .62; transform: scale(1.12); }
          100% { opacity: .28; transform: scale(1); }
        }

        @keyframes shineSweep {
          0% { transform: translateX(-28%) rotate(0deg); opacity: .08; }
          50% { transform: translateX(10%) rotate(4deg); opacity: .16; }
          100% { transform: translateX(28%) rotate(0deg); opacity: .08; }
        }

        @keyframes logoBreath {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.035) rotate(.8deg); }
          100% { transform: scale(1) rotate(0deg); }
        }

        @keyframes bgZoom {
          0% { transform: scale(1); }
          50% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }

        @keyframes cardAppearLeft {
          0% { opacity: 0; transform: translateX(-22px) scale(.985); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }

        @keyframes cardAppearRight {
          0% { opacity: 0; transform: translateX(22px) scale(.985); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }

        @keyframes gridMove {
          0% { transform: translateY(0px) translateX(0px); opacity: .08; }
          50% { transform: translateY(-8px) translateX(6px); opacity: .12; }
          100% { transform: translateY(0px) translateX(0px); opacity: .08; }
        }

        .login-left-enter {
          animation: cardAppearLeft .45s ease-out;
        }

        .login-right-enter {
          animation: cardAppearRight .5s ease-out;
        }

        .float-slow {
          animation: floatSlow 8s ease-in-out infinite;
        }

        .float-medium {
          animation: floatMedium 10s ease-in-out infinite;
        }

        .float-soft {
          animation: floatSoft 7.5s ease-in-out infinite;
        }

        .pulse-glow {
          animation: pulseGlow 4.8s ease-in-out infinite;
        }

        .shine-sweep {
          animation: shineSweep 11s ease-in-out infinite;
        }

        .logo-breath {
          animation: logoBreath 4.5s ease-in-out infinite;
        }

        .bg-zoom {
          animation: bgZoom 12s ease-in-out infinite;
        }

        .grid-move {
          animation: gridMove 9s ease-in-out infinite;
        }
      `}</style>

      <div className="relative w-full max-w-6xl h-[660px] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] rounded-[32px] overflow-hidden border border-white/60">
        <div className="absolute inset-0 hidden md:grid grid-cols-2">
          <div className="relative z-10 h-full w-full p-10 lg:p-12 flex items-center justify-center bg-white login-left-enter">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-md"
            >
              <form onSubmit={doLogin}>
                <div className="mb-8">
                  <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 mb-5 shadow-sm">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-100 to-yellow-100 border border-green-200 flex items-center justify-center overflow-hidden p-1">
                      <img
                        src={logoDesa}
                        alt="Logo Desa Cimaragas"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-bold">
                        Sistem Desa
                      </p>
                      <p className="text-sm font-bold text-slate-800 -mt-0.5">
                        Panel Login Administrator
                      </p>
                    </div>
                  </div>

                  <h2 className="text-4xl font-extrabold text-slate-900 leading-tight">
                    Login Admin
                  </h2>
                  <p className="text-slate-500 mt-2 text-base leading-relaxed max-w-md">
                    Hanya admin yang perlu login untuk mengelola, menyetujui,
                    dan memantau seluruh data peminjaman serta pengembalian barang.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm shadow-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Username Admin</label>
                    <input
                      className="input mt-2"
                      value={loginUsername}
                      onChange={e => setLoginUsername(e.target.value)}
                      placeholder="Masukkan username admin"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600">Password Admin</label>
                    <div className="relative mt-2">
                      <input
                        className="input pr-11"
                        type={loginShow ? "text" : "password"}
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setLoginShow(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition"
                      >
                        {loginShow ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    disabled={loading}
                    className="btn-primary w-full justify-center rounded-2xl py-3 text-base shadow-lg shadow-blue-600/20"
                  >
                    {loading ? "Memproses..." : (<><LogIn size={18} /> Login Admin</>)}
                  </button>

                  <button
                    type="button"
                    onClick={() => nav("/")}
                    className="btn-secondary w-full justify-center rounded-2xl py-3 text-base"
                  >
                    Kembali ke Dashboard Publik
                  </button>
                </div>
              </form>
            </motion.div>
          </div>

          <div className="relative z-10 h-full w-full p-10 lg:p-12 flex items-center justify-center overflow-hidden login-right-enter">
            <div
              className="absolute inset-0 bg-zoom"
              style={{
                background: `
                  radial-gradient(circle at 16% 18%, rgba(250, 204, 21, 0.28), transparent 22%),
                  radial-gradient(circle at 84% 16%, rgba(220, 38, 38, 0.14), transparent 20%),
                  radial-gradient(circle at 82% 84%, rgba(37, 99, 235, 0.18), transparent 22%),
                  radial-gradient(circle at 28% 82%, rgba(34, 197, 94, 0.18), transparent 26%),
                  linear-gradient(145deg, #084c12 0%, #0f6b1d 24%, #1f7a1f 52%, #33923d 76%, #d9c80f 100%)
                `
              }}
            />

            <div className="absolute inset-0 opacity-[0.09] grid-move">
              <div className="absolute inset-y-0 left-[14%] w-[1px] bg-white/70" />
              <div className="absolute inset-y-0 left-[31%] w-[1px] bg-white/40" />
              <div className="absolute inset-y-0 left-[52%] w-[1px] bg-white/35" />
              <div className="absolute inset-y-0 left-[72%] w-[1px] bg-white/35" />
              <div className="absolute inset-y-0 left-[88%] w-[1px] bg-white/25" />
              <div className="absolute inset-x-0 top-[18%] h-[1px] bg-white/35" />
              <div className="absolute inset-x-0 top-[39%] h-[1px] bg-white/25" />
              <div className="absolute inset-x-0 top-[61%] h-[1px] bg-white/28" />
              <div className="absolute inset-x-0 top-[82%] h-[1px] bg-white/22" />
            </div>

            <div className="absolute inset-0 shine-sweep bg-[linear-gradient(135deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.04)_38%,rgba(255,255,255,0)_100%)]" />

            <div className="absolute -top-16 -left-14 w-80 h-80 rounded-full bg-yellow-300/20 blur-3xl pulse-glow" />
            <div className="absolute top-24 right-10 w-96 h-96 rounded-full bg-green-300/10 blur-3xl float-medium" />
            <div className="absolute bottom-[-60px] left-16 w-96 h-96 rounded-full bg-blue-300/10 blur-3xl float-slow" />
            <div className="absolute bottom-10 right-[-30px] w-72 h-72 rounded-full bg-red-300/10 blur-3xl pulse-glow" />
            <div className="absolute top-[36%] left-[14%] w-40 h-40 rounded-full bg-lime-200/10 blur-2xl float-soft" />
            <div className="absolute top-[64%] right-[18%] w-44 h-44 rounded-full bg-yellow-100/10 blur-2xl float-soft" />

            <div className="absolute top-[12%] left-[18%] w-3 h-3 rounded-full bg-yellow-300/70 shadow-[0_0_16px_rgba(250,204,21,0.9)] float-slow" />
            <div className="absolute top-[22%] right-[24%] w-2.5 h-2.5 rounded-full bg-white/60 shadow-[0_0_14px_rgba(255,255,255,0.85)] float-medium" />
            <div className="absolute bottom-[24%] left-[24%] w-2.5 h-2.5 rounded-full bg-blue-200/70 shadow-[0_0_14px_rgba(191,219,254,0.9)] float-soft" />
            <div className="absolute bottom-[18%] right-[16%] w-3 h-3 rounded-full bg-green-200/60 shadow-[0_0_14px_rgba(187,247,208,0.85)] float-medium" />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45 }}
              className="relative z-10 max-w-md text-center"
            >
              <div className="relative inline-flex items-center justify-center mb-8">
                <div className="absolute inset-0 rounded-[36px] bg-white/18 blur-xl scale-110 pulse-glow" />
                <div className="relative w-36 h-36 rounded-[36px] bg-white/10 backdrop-blur-md border border-white/18 shadow-[0_20px_45px_rgba(0,0,0,0.18)] overflow-hidden flex items-center justify-center p-4 logo-breath">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.04)_45%,rgba(255,255,255,0.02)_100%)]" />
                  <img
                    src={logoDesa}
                    alt="Logo Desa Cimaragas"
                    className="relative z-10 w-full h-full object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.18)]"
                  />
                </div>
              </div>

              <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[0.95] drop-shadow-sm">
                Panel
                <br />
                Administrator
              </h1>

              <p className="mt-5 text-white/95 text-lg leading-relaxed max-w-xl">
                Kelola peminjaman, setujui pengajuan, verifikasi pengembalian,
                dan pantau seluruh aktivitas inventaris desa secara lebih mudah.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="md:hidden h-full w-full p-8 flex items-center justify-center bg-white">
          <form onSubmit={doLogin} className="w-full max-w-sm">
            <div className="flex items-center justify-center mb-5">
              <div className="w-24 h-24 rounded-[24px] bg-gradient-to-br from-green-50 via-yellow-50 to-blue-50 border border-green-100 shadow-sm overflow-hidden flex items-center justify-center p-2">
                <img
                  src={logoDesa}
                  alt="Logo Desa Cimaragas"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 text-center">Login Admin</h2>
            <p className="text-gray-500 mt-1 mb-6 text-center">
              Hanya admin yang perlu login.
            </p>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Username Admin</label>
                <input
                  className="input"
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  placeholder="Masukkan username admin"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Password Admin</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={loginShow ? "text" : "password"}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setLoginShow(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {loginShow ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button disabled={loading} className="btn-primary w-full justify-center">
                {loading ? "Memproses..." : (<><LogIn size={18} /> Login Admin</>)}
              </button>

              <button
                type="button"
                onClick={() => nav("/")}
                className="btn-secondary w-full justify-center"
              >
                Kembali ke Dashboard Publik
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}