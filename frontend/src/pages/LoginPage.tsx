import React, { useState, useEffect } from 'react';
import {
  Camera,
  Eye,
  Bot,
  Brain,
  Cpu,
  Layers,
  Crosshair,
  Mail,
  Lock,
  Eye as EyeIcon,
  EyeOff,
  Sun,
  Moon,
  ChevronDown,
  Monitor
} from 'lucide-react';
import { MapleLeafIcon } from '../components/MapleLeafIcon';
import { RobotArmGraphic } from '../components/RobotArmGraphic';
import { api } from '../services/api';
import type { HealthStatus } from '../types';

interface LoginPageProps {
  onLogin: () => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, theme, setTheme }) => {
  const [activeAuthTab, setActiveAuthTab] = useState<'signin' | 'create'>('signin');
  const [email, setEmail] = useState('operator@aveon.robotics');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [health, setHealth] = useState<HealthStatus>({
    system_online: true,
    camera: 'READY',
    vision: 'READY',
    robot: 'STANDBY',
    simulation_mode: true,
  });

  useEffect(() => {
    const checkHealth = async () => {
      const data = await api.getHealth();
      setHealth(data);
    };
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex flex-col justify-between relative overflow-x-hidden">
      {/* Background Maple Watermark Accents */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] pointer-events-none opacity-5 -mr-20 -mt-20">
        <MapleLeafIcon size={550} color="#D62828" />
      </div>

      {/* 1. Header matching Reference Image 1 */}
      <header className="w-full px-6 md:px-12 py-4 flex items-center justify-between z-10">
        {/* Brand Logo & Subtitle */}
        <div className="flex items-center gap-3 select-none">
          <MapleLeafIcon size={38} color="#D62828" />
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-slate-900 leading-none">
              AVEON
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase mt-0.5">
              AI • VISION • ROBOTICS
            </span>
          </div>
        </div>

        {/* Language selector & Theme toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer">
            <span className="text-sm">🍁</span>
            <span>English</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>

          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-full transition-colors shadow-2xs cursor-pointer"
            title="Toggle Light / Dark Mode"
          >
            {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col items-center z-10">
        {/* 2. Hero Section */}
        <div className="w-full relative mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Hero Text */}
            <div className="md:col-span-7 flex flex-col items-start">
              {/* Online status badge */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-emerald-700 mb-4 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>SYSTEM ONLINE</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight leading-[1.08] mb-3">
                See. Understand.<br />
                <span className="text-[#D62828]">Act.</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 font-medium max-w-md mb-6 leading-relaxed">
                AI-powered vision and control for intelligent robotics.
              </p>

              {/* 5 Feature Pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
                  <Camera size={13} className="text-[#D62828]" />
                  <span>Real-Time Vision</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
                  <Layers size={13} className="text-[#D62828]" />
                  <span>OpenCV</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
                  <Crosshair size={13} className="text-[#D62828]" />
                  <span>Object Detection</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
                  <Cpu size={13} className="text-[#D62828]" />
                  <span>Robot Control</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
                  <Brain size={13} className="text-[#D62828]" />
                  <span>AI Assistant</span>
                </div>
              </div>
            </div>

            {/* Right Hero Graphic with Maple Leaf & Robot Arm */}
            <div className="md:col-span-5 relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <MapleLeafIcon size={260} color="#D62828" />
              </div>
              <div className="relative w-64 h-64 sm:w-72 sm:h-72">
                <RobotArmGraphic />
              </div>
            </div>
          </div>

          {/* 3 Live Hardware Readiness Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-2">
            {/* Camera */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#D62828] flex items-center justify-center shrink-0">
                <Camera size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">Camera</span>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{health.camera}</span>
                </div>
              </div>
            </div>

            {/* Vision */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#D62828] flex items-center justify-center shrink-0">
                <Eye size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">Vision</span>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{health.vision}</span>
                </div>
              </div>
            </div>

            {/* Robot */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#D62828] flex items-center justify-center shrink-0">
                <Bot size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">Robot</span>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>{health.robot}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Authentication Card */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200/90 p-7 z-10 transition-all">
          {/* Tabs */}
          <div className="flex items-center justify-center border-b border-slate-100 mb-6">
            <button
              onClick={() => setActiveAuthTab('signin')}
              className={`pb-3 text-sm font-bold transition-all relative px-6 cursor-pointer ${
                activeAuthTab === 'signin' ? 'text-[#D62828]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
              {activeAuthTab === 'signin' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D62828] rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => setActiveAuthTab('create')}
              className={`pb-3 text-sm font-bold transition-all relative px-6 cursor-pointer ${
                activeAuthTab === 'create' ? 'text-[#D62828]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Create Account
              {activeAuthTab === 'create' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D62828] rounded-full"></span>
              )}
            </button>
          </div>

          {/* Social OAuth Buttons */}
          <div className="space-y-2.5 mb-5">
            <button
              type="button"
              onClick={onLogin}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={onLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.76 1.05-1.82.93-2.88-.91.04-2.02.61-2.67 1.37-.58.67-1.08 1.74-.95 2.78 1.02.08 2.06-.51 2.69-1.27z" />
              </svg>
              <span>Continue with Apple</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest absolute">
              OR
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email or Phone</label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3.5 text-slate-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email or mobile number"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <a href="#forgot" className="text-[11px] font-semibold text-[#D62828] hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:bg-white transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#D62828] border-slate-300 rounded focus:ring-red-500 accent-[#D62828] cursor-pointer"
              />
              <label htmlFor="remember" className="ml-2 text-xs font-medium text-slate-700 cursor-pointer">
                Remember me
              </label>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-[#D62828] hover:bg-red-700 text-white font-bold text-xs tracking-wide shadow-md shadow-red-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Sign In</span>
              <span>→</span>
            </button>

            {/* CRITICAL ACTION: Try Demo Login Button */}
            <button
              type="button"
              onClick={onLogin}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer mt-2"
            >
              <Monitor size={15} className="text-[#D62828]" />
              <span>Try Demo Login</span>
            </button>
          </form>

          {/* Terms Footer */}
          <p className="text-[10px] text-center text-slate-400 mt-6 leading-relaxed">
            By continuing, you agree to AVEON's{' '}
            <a href="#terms" className="text-slate-600 underline">Terms of Service</a> and{' '}
            <a href="#privacy" className="text-slate-600 underline">Privacy Policy</a>.
          </p>
        </div>
      </main>
    </div>
  );
};
