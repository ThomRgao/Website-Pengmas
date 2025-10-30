import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, UserPlus, Eye, EyeOff } from "lucide-react";
import api from "../api";
import { useNavigate, useLocation } from "react-router-dom";

export default function Login({ initialMode = "login" }) {
  const nav = useNavigate();
  const loc = useLocation();

  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginShow, setLoginShow] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regShow, setRegShow] = useState(false);

  useEffect(() => {
    if (initialMode) setMode(initialMode);
    if (loc.pathname.toLowerCase().includes("register")) setMode("register");
  }, [loc.pathname, initialMode]);

  const doLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!loginUsername || !loginPassword) {
      setError("Username dan password wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", {
        username: loginUsername,
        password: loginPassword,
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      nav("/");
    } catch (err) {
      setError(err?.response?.data?.error || "Gagal login");
    } finally {
      setLoading(false);
    }
  };

  const doRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!regUsername || !regPassword) {
      setError("Username dan password wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        username: regUsername.trim(),
        password: regPassword,
        fullName: fullName || regUsername,
        email: email || `${regUsername}@example.com`,
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      nav("/");
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message;
      setError(msg || "Gagal daftar");
    } finally {
      setLoading(false);
    }
  };

  const LoginForm = (
    <motion.form
      key="login-form"
      onSubmit={doLogin}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-sm"
    >
      <h2 className="text-3xl font-bold text-gray-900">Masuk</h2>
      <p className="text-gray-500 mt-1 mb-6">Gunakan akun Anda untuk melanjutkan.</p>
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-600">Username</label>
          <input
            className="input"
            value={loginUsername}
            onChange={(e) => setLoginUsername(e.target.value)}
            placeholder="Masukkan Username Anda"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Password</label>
          <div className="relative">
            <input
              className="input pr-10"
              type={loginShow ? "text" : "password"}
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="••••••"
            />
            <button
              type="button"
              onClick={() => setLoginShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {loginShow ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button disabled={loading} className="btn-primary w-full justify-center">
          {loading ? "Memproses..." : (<><LogIn size={18} /> Masuk</>)}
        </button>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        Belum punya akun?{" "}
        <button
          type="button"
          onClick={() => setMode("register")}
          className="link inline-flex items-center gap-1"
        >
          <UserPlus size={14} /> Daftar
        </button>
      </div>
    </motion.form>
  );

  const RegisterForm = (
    <motion.form
      key="register-form"
      onSubmit={doRegister}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-sm"
    >
      <h2 className="text-3xl font-bold text-gray-900">Daftar</h2>
      <p className="text-gray-500 mt-1 mb-6">Registrasi cepat untuk mulai mengelola inventaris.</p>
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-sm text-gray-600">Nama Lengkap</label>
          <input
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nama Anda"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Email</label>
          <input
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@contoh.com"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Username</label>
          <input
            className="input"
            value={regUsername}
            onChange={(e) => setRegUsername(e.target.value)}
            placeholder="username"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Password</label>
          <div className="relative">
            <input
              className="input pr-10"
              type={regShow ? "text" : "password"}
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              placeholder="••••••"
            />
            <button
              type="button"
              onClick={() => setRegShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {regShow ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button disabled={loading} className="btn-primary w-full justify-center">
          {loading ? "Memproses..." : (<><UserPlus size={18} /> Daftar</>)}
        </button>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        Sudah punya akun?{" "}
        <button type="button" onClick={() => setMode("login")} className="link">
          Masuk
        </button>
      </div>
    </motion.form>
  );

  return (
    <div className="min-h-screen w-full grid place-items-center bg-gray-50">
      <div className="relative w-full max-w-5xl h-[620px] bg-white shadow-2xl rounded-2xl overflow-hidden">
        <div className="md:hidden h-full w-full p-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {mode === "login" ? LoginForm : RegisterForm}
          </AnimatePresence>
        </div>
        <div className="absolute inset-0 hidden md:grid grid-cols-2">
          <div className="relative z-10 h-full w-full p-10 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {mode === "login" ? (
                LoginForm
              ) : (
                <motion.div
                  key="login-art"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35 }}
                  className="max-w-md text-center"
                >
                  <h1 className="text-4xl font-extrabold text-white">Inventory System</h1>
                  <p className="mt-3 text-white">Sudah terdaftar? Masuk untuk akses penuh dashboard.</p>
                  <div className="mt-8">
                    <button onClick={() => setMode("login")} className="btn-secondary">Sudah Punya Akun</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="relative z-10 h-full w-full p-10 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {mode === "register" ? (
                RegisterForm
              ) : (
                <motion.div
                  key="register-art"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.35 }}
                  className="max-w-md text-center"
                >
                  <h1 className="text-4xl font-extrabold text-white">Selamat Datang</h1>
                  <p className="mt-3 text-white">Belum punya akun? Daftar sekarang dan mulai kelola inventaris.</p>
                  <div className="mt-8">
                    <button onClick={() => setMode("register")} className="btn-secondary">Buat Akun Baru</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <motion.div
          className="pointer-events-none absolute inset-y-0 w-1/2 rounded-2xl md:block hidden"
          initial={false}
          animate={{ left: mode === "login" ? "50%" : "0%" }}
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
