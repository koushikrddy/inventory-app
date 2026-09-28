import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, Eye, EyeOff, ArrowRight } from 'lucide-react';
import ParticleBackground from '../components/ParticleBackground';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const fillCreds = (em: string, pw: string) => {
    setEmail(em);
    setPassword(pw);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4" style={{
      background: 'linear-gradient(135deg, #0c0c1d 0%, #111128 30%, #0d0d22 60%, #0a0a1a 100%)'
    }}>
      <ParticleBackground />

      {/* Soft glow behind card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none" style={{
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        filter: 'blur(60px)',
      }} />

      {/* Main content */}
      <div className={`relative z-10 w-full flex items-center justify-center gap-14 transition-all duration-[1000ms] ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

        {/* Left: Branding (hidden on small screens) */}
        <div className="hidden lg:block flex-1 max-w-[460px]">
          <div className="mb-8">
            <div className="relative inline-block mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                boxShadow: '0 8px 30px rgba(99,102,241,0.4)',
              }}>
                <Package className="w-7 h-7 text-white" />
              </div>
            </div>

            <h1 className="text-5xl font-extrabold text-white leading-[1.05] mb-4 tracking-tight">
              Smart
              <span className="block" style={{
                background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Inventory</span>
              <span className="block text-white/70">Management</span>
            </h1>

            <p className="text-base text-white/35 max-w-[380px] leading-relaxed font-light">
              AI-powered inventory management for modern retail. Track, analyze, and optimize your stock effortlessly.
            </p>
          </div>

          {/* Stats preview */}
          <div className="flex gap-4 mt-10">
            {[
              { num: '33+', label: 'Products' },
              { num: '10', label: 'Categories' },
              { num: 'AI', label: 'Powered' },
            ].map((s, i) => (
              <div key={i} className="flex-1 p-4 rounded-2xl text-center" style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <p className="text-xl font-bold text-white/80">{s.num}</p>
                <p className="text-[11px] text-white/30 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Login Card - Instagram style tall card */}
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
              }}>
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">InventoryPro</span>
            </div>
          </div>

          {/* Card - Instagram style: tall, clean, minimal */}
          <div className="rounded-[20px] px-8 py-9" style={{
            background: 'rgba(15, 15, 35, 0.8)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          }}>
            {/* Logo on top (Instagram style) */}              <div className="text-center mb-9">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                boxShadow: '0 6px 25px rgba(99,102,241,0.35)',
              }}>
                <Package className="w-8 h-8 text-white" />
              </div>
              <p className="text-white/30 text-[13px]">Sign in to continue to your dashboard</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl text-sm text-center" style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
              }}>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Email */}
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 text-[14px] text-white placeholder-white/25 focus:outline-none transition-all duration-300"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1.5px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    height: '48px',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="Email address"
                  required
                />
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 text-[14px] text-white placeholder-white/25 focus:outline-none transition-all duration-300 pr-11"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1.5px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    height: '48px',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Forgot password link */}
              <div className="text-right">
                <button type="button" className="text-[12px] font-medium text-indigo-400/70 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </button>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl font-bold text-[14px] text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                style={{
                  height: '48px',
                  background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                  boxShadow: '0 6px 25px rgba(99, 102, 241, 0.35)',
                  marginTop: '4px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 10px 35px rgba(99, 102, 241, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 25px rgba(99, 102, 241, 0.35)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    'Log In'
                  )}
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                }} />
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-[11px] text-white/25 uppercase tracking-widest font-medium" style={{
                  background: 'rgba(15,15,35,1)',
                }}>or</span>
              </div>
            </div>

            {/* Demo credentials - Instagram style */}
            <div className="space-y-3">
              {[
                { role: 'Admin', email: 'admin@store.com', pass: 'admin123', color: '#6366f1', emoji: '👑' },
                { role: 'Staff', email: 'staff@store.com', pass: 'staff123', color: '#a855f7', emoji: '🧑‍💼' },
              ].map((cred, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => fillCreds(cred.email, cred.pass)}
                  className="w-full flex items-center gap-3 px-4 rounded-2xl text-left transition-all duration-300 group"
                  style={{
                    height: '46px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1.5px solid rgba(255,255,255,0.06)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.borderColor = `${cred.color}30`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  }}
                >
                  <span className="text-lg">{cred.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white/75">{cred.role} — {cred.email}</p>
                  </div>
                  <ArrowRight size={14} className="text-white/15 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Sign up prompt (Instagram style) */}
          <div className="mt-4 text-center rounded-[20px] py-4" style={{
            background: 'rgba(15, 15, 35, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            <p className="text-[13px] text-white/35">
              Don't have an account? <button className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Sign up</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
