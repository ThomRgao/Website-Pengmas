import React, { useState } from "react";
import { motion } from "framer-motion";
import { LogIn, Eye, EyeOff, ShieldCheck } from "lucide-react";
import api from "../api";
import { useNavigate } from "react-router-dom";

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
    <div className="min-h-screen w-full grid place-items-center bg-gray-50 p-4">
      <div className="relative w-full max-w-5xl h-[620px] bg-white shadow-2xl rounded-2xl overflow-hidden">
        <div className="absolute inset-0 hidden md:grid grid-cols-2">
          <div className="relative z-10 h-full w-full p-10 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-sm"
            >
              <form onSubmit={doLogin}>
                <h2 className="text-3xl font-bold text-gray-900">Login Admin</h2>
                <p className="text-gray-500 mt-1 mb-6">
                  Hanya admin yang perlu login untuk mengelola, menyetujui, dan memantau seluruh data peminjaman.
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
            </motion.div>
          </div>

          <div className="relative z-10 h-full w-full p-10 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35 }}
              className="max-w-md text-center"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 mb-6">
                <ShieldCheck size={40} className="text-white" />
              </div>
              <h1 className="text-4xl font-extrabold text-white">Panel Administrator</h1>
              <p className="mt-3 text-white">
                Setujui peminjaman, pantau identitas peminjam, verifikasi pengembalian, dan lihat riwayat lengkap penggunaan barang.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="md:hidden h-full w-full p-8 flex items-center justify-center">
          <form onSubmit={doLogin} className="w-full max-w-sm">
            <h2 className="text-3xl font-bold text-gray-900">Login Admin</h2>
            <p className="text-gray-500 mt-1 mb-6">
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

        <motion.div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 rounded-2xl md:block hidden"
          initial={false}
          animate={{ right: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          style={{
            background:
              "linear-gradient(135deg,#2563eb 0%,#8b5cf6 50%,#f43f5e 100%)",
            boxShadow: "0 10px 30px rgba(0,0,0,.15)",
            zIndex: 0
          }}
        />
      </div>
    </div>
  );
}