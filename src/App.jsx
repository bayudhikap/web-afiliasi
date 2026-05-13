import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Upload, Link as LinkIcon, Image as ImageIcon, Type, 
  Settings2, Sliders, ImagePlus, Wand2, Download, 
  Maximize2, X, Copy, Check, Video, AlertCircle, Loader2, Sparkles,
  Sun, Moon, Menu, LogOut, Users, UserPlus, Trash2, 
  ChevronDown, ChevronRight, Mic, Hash, Search, AudioLines, Activity,
  FileDown, FileUp, RotateCcw, PlaySquare, ExternalLink, Edit, Plus, Youtube,
  HelpCircle, LayoutDashboard, Settings, Compass, Info, Flame, Target, TrendingUp, BarChart, Gauge,
  Eye, EyeOff, ShoppingBag, Award, Zap, PenTool, Lightbulb, BarChart2, ActivitySquare, Image as ImageLucide
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';

// ==========================================
// GLOBAL VARIABLES & UTILITIES
// ==========================================
const appId = 'aplikasi-afiliasi'; // Nama bebas
const apiKey = "AIzaSyCUrqDTdrZzWZ0NNBpeEsKmmk3gY4eUVX0"; // MASUKKAN API KEY GEMINI ANDA DI SINI!

const fetchWithRetry = async (url, options, retries = 5) => {
  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delays[i]));
    }
  }
};

const pcmToWav = (pcmData, sampleRate) => {
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  const writeString = (view, offset, string) => { for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i)); };
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, pcmData.length, true);
  return new Blob([view, pcmData], { type: 'audio/wav' });
};

const extractYouTubeId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const InfoTooltip = ({ text }) => (
  <div className="group relative inline-flex ml-1">
    <Info size={14} className="text-slate-400 cursor-help" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl z-50 text-center font-normal">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

const LimitWarning = ({ generateCount, userRole }) => {
  if (userRole !== 'trial') return null;
  return (
    <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center gap-3 text-orange-500">
      <AlertCircle size={20} className="shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-bold">Mode Trial (Batas Generate)</p>
        <p className="text-xs">Sisa kuota Anda: {Math.max(0, 2 - (generateCount || 0))} / 2. Silakan hubungi Admin untuk akses Premium.</p>
      </div>
    </div>
  );
};

const PremiumBadge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    viral: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    hot: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    danger: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  return <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border inline-block ${variants[variant]} ${className}`}>{children}</span>;
};

// ==========================================
// COMPONENT: Dashboard Home
// ==========================================
const DashboardHome = ({ isDark, username, setActiveMenu }) => (
  <div className="animate-in fade-in duration-500">
    <div className="mb-10 text-center">
       <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20">
          <LayoutDashboard size={40} />
       </div>
       <h2 className={`text-3xl font-black mb-3 tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Selamat datang, {username}!</h2>
       <p className={`text-sm max-w-xl mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Pilih modul kerja Anda di bawah ini untuk mulai meriset produk pemenang, memproduksi konten visual, dan meroketkan komisi afiliasi Anda.</p>
    </div>

    <h3 className={`text-lg font-bold mb-4 px-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Pilih Mode Kerjamu</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div onClick={() => setActiveMenu('product-research')} className={`group cursor-pointer p-6 rounded-3xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isDark ? 'bg-slate-900 border-slate-800 hover:border-orange-500/50' : 'bg-white border-slate-200 hover:border-orange-300'}`}>
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><ShoppingBag size={24}/></div>
        <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Riset Produk Tren</h3>
        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Analisa produk laris & temukan "Winning Product" dari berbagai marketplace.</p>
      </div>

      <div onClick={() => setActiveMenu('generator-affiliate')} className={`group cursor-pointer p-6 rounded-3xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isDark ? 'bg-slate-900 border-slate-800 hover:border-indigo-500/50' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><ImagePlus size={24}/></div>
        <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Produksi Visual</h3>
        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ubah foto produk biasa jadi konten promosi berkelas studio.</p>
      </div>

      <div onClick={() => setActiveMenu('script-voice')} className={`group cursor-pointer p-6 rounded-3xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isDark ? 'bg-slate-900 border-slate-800 hover:border-purple-500/50' : 'bg-white border-slate-200 hover:border-purple-300'}`}>
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Mic size={24}/></div>
        <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Audio & Naskah</h3>
        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Hasilkan naskah memikat dan sulap jadi rekaman Voice Over profesional.</p>
      </div>

      <div onClick={() => setActiveMenu('seo')} className={`group cursor-pointer p-6 rounded-3xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isDark ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Hash size={24}/></div>
        <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Optimasi Publikasi</h3>
        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Dapatkan hook maut, thumbnail keren, dan lacak performa video.</p>
      </div>
    </div>
  </div>
);

// ==========================================
// COMPONENT: Product Research AI
// ==========================================
function ToolProductResearch({ isDark, userRole, generateCount, onGenerateAttempt }) {
  const [marketplace, setMarketplace] = useState('TikTok Shop');
  const [category, setCategory] = useState('Fashion dan Aksesoris');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState('');

  const marketplaces = ['TikTok Shop', 'Shopee Affiliate', 'Tokopedia Affiliate', 'Lazada Affiliate'];
  const categories = [
    'Fashion dan Aksesoris', 'Beauty dan Personal Care', 'Elektronik dan Gadget',
    'Home Living', 'Makanan dan Minuman', 'Kesehatan (suplemen, vitamin, dll)',
    'Ibu dan Bayi', 'Hobi dan Olahraga'
  ];

  const getMarketplaceLink = (targetMarketplace, productName) => {
    const query = encodeURIComponent(productName);
    if (targetMarketplace.includes('Shopee')) return `https://shopee.co.id/search?keyword=${query}`;
    if (targetMarketplace.includes('Tokopedia')) return `https://www.tokopedia.com/search?q=${query}`;
    if (targetMarketplace.includes('Lazada')) return `https://www.lazada.co.id/catalog/?q=${query}`;
    if (targetMarketplace.includes('TikTok')) return `https://www.tiktok.com/search?q=${query}`;
    return `https://www.google.com/search?q=${query}+${targetMarketplace}`;
  };

  const handleAnalyze = async () => {
    const isAllowed = await onGenerateAttempt();
    if (!isAllowed) return;

    setIsGenerating(true); setError(''); setResultData(null);

    try {
      const parts = [{ text: `Act as an expert E-commerce & Affiliate Marketing Analyst in Indonesia.
TASK: Use Google Search to analyze the current real-time market trends for the category "${category}" specifically on "${marketplace}" platform in Indonesia.

Identify exactly 4 TOP TRENDING or BEST SELLING products that an affiliate marketer should promote right now to get high conversions.
For each product, provide:
- productName: Specific name of the product (e.g., "Skintific Mugwort Clay Mask").
- demandScore: An integer from 1-100 indicating current market demand.
- competition: "Rendah", "Menengah", or "Tinggi" (Indonesian language).
- estimatedCommission: A realistic percentage range (e.g., "10% - 15%").
- reasonToPromote: 1-2 short sentences in Indonesian explaining WHY this is a winning product right now.
- contentIdea: 1 short sentence in Indonesian giving a hook/angle for a short video ad.

Also provide:
- marketInsight: 2-3 sentences summarizing the current behavior/trend of buyers in this specific category and marketplace.

Return ONLY valid JSON exactly matching the schema.` }];

      const payload = { 
        contents: [{ role: "user", parts }], 
        tools: [{ google_search: {} }], 
        generationConfig: { 
          responseMimeType: "application/json", 
          responseSchema: { 
            type: "OBJECT", 
            properties: { 
              marketInsight: { type: "STRING" },
              products: { 
                type: "ARRAY", 
                items: { 
                  type: "OBJECT", 
                  properties: { 
                    productName: { type: "STRING" },
                    demandScore: { type: "INTEGER" },
                    competition: { type: "STRING" },
                    estimatedCommission: { type: "STRING" },
                    reasonToPromote: { type: "STRING" },
                    contentIdea: { type: "STRING" }
                  } 
                } 
              } 
            } 
          } 
        } 
      };

      const res = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

      const generatedText = res.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) throw new Error("Gagal melakukan analisa data pasar.");
      
      const parsedData = JSON.parse(generatedText);
      const sources = res.candidates?.[0]?.groundingMetadata?.groundingAttributions?.map(a => ({ uri: a.web?.uri, title: a.web?.title }));
      setResultData({ ...parsedData, sources });
    } catch (err) { setError(`Terjadi kesalahan: ${err.message}`); } finally { setIsGenerating(false); }
  };

  const getCompColor = (level) => {
    const lvl = (level || '').toLowerCase();
    if (lvl.includes('rendah') || lvl === 'low') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (lvl.includes('menengah') || lvl === 'medium') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return isDark ? 'text-emerald-400' : 'text-emerald-500';
    if (score >= 60) return isDark ? 'text-amber-400' : 'text-amber-500';
    return isDark ? 'text-red-400' : 'text-red-500';
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>Intelijen Riset Produk <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] uppercase tracking-widest font-black ml-2 shadow-lg">LIVE AI</span></h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Pantau tren pasar *real-time* dan temukan "Winning Product" untuk konversi maksimal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
           <LimitWarning generateCount={generateCount} userRole={userRole} />
           {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex gap-2"><AlertCircle size={18} className="shrink-0 mt-0.5"/>{error}</div>}
           
           <div className={`border rounded-3xl p-6 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <label className={`block text-xs font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <ShoppingBag size={16} className="text-orange-500"/> Target Marketplace
              </label>
              <select value={marketplace} onChange={(e) => setMarketplace(e.target.value)} className={`w-full mb-6 border rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-orange-500/50 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`}>
                {marketplaces.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

              <label className={`block text-xs font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Target size={16} className="text-pink-500"/> Kategori Industri / Niche
              </label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={`w-full mb-4 border rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-orange-500/50 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
           </div>

           <button onClick={handleAnalyze} disabled={isGenerating || (userRole === 'trial' && generateCount >= 2)} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg transition-all active:scale-[0.98] ${(userRole === 'trial' && generateCount >= 2) ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : (isDark ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-900/20' : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200')}`}>
            {isGenerating ? <><Loader2 className="animate-spin" size={18} /> Menggali Data Pasar...</> : <><Search size={18} /> Mulai Riset Produk</>}
          </button>
        </div>

        <div className={`lg:col-span-8 border rounded-3xl p-6 sm:p-8 flex flex-col shadow-sm min-h-[500px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          {!resultData && !isGenerating && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className={`w-24 h-24 mb-6 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                <Search size={40} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
              </div>
              <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Radar Afiliasi Menunggu Perintah</p>
              <p className={`text-xs max-w-xs leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Pilih marketplace dan kategori di samping untuk melihat produk apa yang sedang laris manis saat ini.</p>
            </div>
          )}
          
          {isGenerating && !resultData && (
             <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative">
                   <Activity size={48} className="animate-pulse text-orange-500 mb-6 relative z-10" />
                   <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
                </div>
                <p className={`text-sm font-bold mb-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>Menyisir Data Algoritma Google...</p>
                <p className={`text-[10px] font-medium uppercase tracking-widest animate-pulse ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Mencari Potensi Cuan Tertinggi</p>
             </div>
          )}

          {resultData && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`p-6 rounded-2xl border flex flex-col gap-3 ${isDark ? 'bg-slate-950 border-orange-500/30' : 'bg-orange-50/50 border-orange-200'}`}>
                   <div className="flex items-center gap-2">
                     <TrendingUp size={18} className={isDark ? 'text-orange-400' : 'text-orange-600'} />
                     <h3 className={`font-black text-sm uppercase tracking-widest ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Kondisi Pasar Terkini</h3>
                   </div>
                   <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{resultData.marketInsight}</p>
                </div>

                <div>
                  <h3 className={`text-base font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}><Award size={18} className="text-yellow-500" /> Rekomendasi "Winning Products"</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(resultData.products || []).map((product, index) => (
                      <div key={index} className={`relative p-5 rounded-2xl border flex flex-col transition-all hover:shadow-xl hover:-translate-y-1 ${isDark ? 'bg-slate-950 border-slate-800 hover:border-orange-500/50' : 'bg-white border-slate-200 hover:border-orange-300'}`}>
                        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-2xl">
                           <div className={`absolute top-2 -right-6 w-24 text-center text-[8px] font-black uppercase tracking-widest py-1 rotate-45 ${isDark ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-orange-500 text-white'}`}>TOP #{index + 1}</div>
                        </div>
                        
                        <h4 className={`text-sm font-bold pr-8 mb-4 leading-snug ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{product.productName}</h4>
                        
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                             <span className={`block text-[9px] uppercase font-bold tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Skor Demand</span>
                             <span className={`text-lg font-black leading-none flex items-end ${getScoreColor(product.demandScore)}`}>{product.demandScore}<span className="text-[10px] font-bold text-slate-500 ml-0.5 pb-0.5">/100</span></span>
                          </div>
                          <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                             <span className={`block text-[9px] uppercase font-bold tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Persaingan</span>
                             <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border inline-block mt-0.5 ${getCompColor(product.competition)}`}>{product.competition}</span>
                          </div>
                        </div>

                        <div className="mb-4 space-y-2">
                           <p className={`text-[11px] leading-relaxed flex items-start gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                             <Zap size={14} className="text-yellow-500 shrink-0 mt-0.5"/>
                             <span><span className="font-bold">Alasan Kuat:</span> {product.reasonToPromote}</span>
                           </p>
                        </div>

                        <div className={`mt-auto pt-4 border-t flex flex-col gap-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                           <div className="flex items-center justify-between">
                             <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Estimasi Komisi</span>
                             <span className={`text-xs font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{product.estimatedCommission}</span>
                           </div>
                           
                           <div className={`p-2.5 rounded-xl border text-[10px] italic leading-relaxed ${isDark ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                             <strong className="not-italic text-indigo-500 block mb-0.5 uppercase tracking-wider text-[9px]">Saran Ide Hook:</strong>
                             "{product.contentIdea}"
                           </div>

                           <a 
                             href={getMarketplaceLink(marketplace, product.productName)}
                             target="_blank"
                             rel="noreferrer"
                             className={`w-full py-2.5 mt-1 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold transition-all active:scale-95 ${isDark ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20' : 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100'}`}
                           >
                             Lihat di {marketplace.split(' ')[0]} <ExternalLink size={14} />
                           </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {resultData.sources && resultData.sources.length > 0 && (
                  <div className={`p-4 rounded-xl border flex flex-wrap items-center gap-2 ${isDark ? 'bg-slate-950/50 border-slate-800/50' : 'bg-slate-50 border-slate-200/50'}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Sumber Rujukan Live Web:</span>
                    {resultData.sources.slice(0,3).map((s, i) => s.uri && <a key={i} href={s.uri} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-medium transition-colors ${isDark ? 'bg-slate-900 border-slate-700 text-indigo-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50'}`}><LinkIcon size={10}/> {s.title?.substring(0,25)}...</a>)}
                  </div>
                )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENT: Optimasi Publikasi (Mega Update)
// ==========================================
function ToolSEOGenerator({ isDark, userRole, generateCount, onGenerateAttempt }) {
  const [activeTab, setActiveTab] = useState('seo-tags');

  // STATE: Tab 1 - SEO & Tags (Original)
  const [seoDesc, setSeoDesc] = useState('');
  const [seoImage, setSeoImage] = useState(null);
  const [seoPlatform, setSeoPlatform] = useState('TikTok');
  const [seoResult, setSeoResult] = useState(null);
  const [isSeoGenerating, setIsSeoGenerating] = useState(false);

  // STATE: Tab 2 - Hook Generator
  const [hookProduct, setHookProduct] = useState('');
  const [hookCategory, setHookCategory] = useState('Fashion');
  const [hookResult, setHookResult] = useState(null);
  const [isHookGenerating, setIsHookGenerating] = useState(false);

  // STATE: Tab 3 - UGC Script
  const [ugcTopic, setUgcTopic] = useState('');
  const [ugcAudience, setUgcAudience] = useState('');
  const [ugcTone, setUgcTone] = useState('Ceria dan Ramah');
  const [ugcCta, setUgcCta] = useState('');
  const [ugcResult, setUgcResult] = useState(null);
  const [isUgcGenerating, setIsUgcGenerating] = useState(false);

  // STATE: Tab 4 - Thumbnail Maker
  const [thumbBaseImg, setThumbBaseImg] = useState(null);
  const [thumbFaceImg, setThumbFaceImg] = useState(null);
  const [thumbDesc, setThumbDesc] = useState('');
  const [thumbResult, setThumbResult] = useState(null);
  const [isThumbGenerating, setIsThumbGenerating] = useState(false);

  // STATE: Tab 5 - Video Analyzer
  const [analyzeUrl, setAnalyzeUrl] = useState('');
  const [analyzeResult, setAnalyzeResult] = useState(null);
  const [isAnalyzeGenerating, setIsAnalyzeGenerating] = useState(false);

  // STATE: Tab 6 - Performance Tracker
  const [trackerUrl, setTrackerUrl] = useState('');
  const [trackerResult, setTrackerResult] = useState(null);
  const [isTrackerGenerating, setIsTrackerGenerating] = useState(false);

  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const fileInputRef1 = useRef(null);
  const fileInputRefThumb1 = useRef(null);
  const fileInputRefThumb2 = useRef(null);

  const handleCopy = (text, index) => {
    try {
      const textArea = document.createElement("textarea"); textArea.value = text;
      textArea.style.position = "fixed"; document.body.appendChild(textArea); textArea.focus(); textArea.select();
      document.execCommand('copy'); document.body.removeChild(textArea);
      setCopiedIndex(index); setTimeout(() => setCopiedIndex(null), 2500);
    } catch (e) {}
  };

  const handleImageUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) { const reader = new FileReader(); reader.onloadend = () => setter(reader.result); reader.readAsDataURL(file); }
  };

  // --- API HANDLERS ---
  
  const handleGenerateSEO = async () => {
    if (!seoDesc && !seoImage) return;
    const isAllowed = await onGenerateAttempt(); if (!isAllowed) return;
    setIsSeoGenerating(true); setError(''); setSeoResult(null);
    try {
      const parts = [{ text: `Analyze trends for ${seoPlatform}: ${seoDesc}. Return JSON {reasoning, competitionLevel, viralPotentialScore, results: [{seoTitle, coverText, fullCaption, hashtags: {mega, niche, trending}}]}` }];
      if (seoImage) parts.push({ inlineData: { mimeType: "image/png", data: seoImage.split(',')[1] } });
      const res = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: "user", parts }], tools: [{ google_search: {} }], generationConfig: { responseMimeType: "application/json" } }) });
      setSeoResult(JSON.parse(res.candidates[0].content.parts[0].text));
    } catch (err) { setError(err.message); } finally { setIsSeoGenerating(false); }
  };

  const handleGenerateHook = async () => {
    if (!hookProduct) return;
    const isAllowed = await onGenerateAttempt(); if (!isAllowed) return;
    setIsHookGenerating(true); setError(''); setHookResult(null);
    try {
      const prompt = `Act as an expert TikTok/Shopee Affiliate Copywriter.
Product: ${hookProduct}. Category: ${hookCategory}.
Task: Generate EXACTLY 8 highly engaging video hooks based on proven viral frameworks.
The language MUST be natural, conversational Indonesian slang (e.g., pake, banget, nemu).
Categories to generate:
1. Soft selling, 2. Hard selling, 3. FOMO, 4. Curiosity, 5. Before-after, 6. Problem-solution, 7. Storytelling, 8. Shock value.
Return JSON: { "hooks": [ { "type": "string", "hookText": "string", "reasoning": "string" } ] }`;
      
      const res = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: "user", parts: [{text: prompt}] }], tools: [{ google_search: {} }], generationConfig: { responseMimeType: "application/json" } }) });
      setHookResult(JSON.parse(res.candidates[0].content.parts[0].text));
    } catch (err) { setError(err.message); } finally { setIsHookGenerating(false); }
  };

  const handleGenerateUgc = async () => {
    if (!ugcTopic) return;
    const isAllowed = await onGenerateAttempt(); if (!isAllowed) return;
    setIsUgcGenerating(true); setError(''); setUgcResult(null);
    try {
      const prompt = `Act as a Professional UGC (User Generated Content) Creator.
Write a highly converting, natural Indonesian video script.
Topic: ${ugcTopic}
Target Audience: ${ugcAudience}
Tone/Vibe: ${ugcTone}
Call to Action (CTA): ${ugcCta}

Rules:
- Must sound like a real person talking naturally (use casual words like aku, kamu, pas, banget).
- Include emotional/action pauses in brackets like [Tarik nafas], [Tertawa kecil], [Tunjuk produk].
- Keep it under 60 seconds (around 120 words).
- End with the smooth CTA requested.

Return JSON: { "script": "string", "directorNotes": "string (tips on how to act/shoot)" }`;
      
      const res = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: "user", parts: [{text: prompt}] }], generationConfig: { responseMimeType: "application/json" } }) });
      setUgcResult(JSON.parse(res.candidates[0].content.parts[0].text));
    } catch (err) { setError(err.message); } finally { setIsUgcGenerating(false); }
  };

  const handleGenerateThumb = async () => {
    if (!thumbBaseImg && !thumbDesc) return;
    const isAllowed = await onGenerateAttempt(); if (!isAllowed) return;
    setIsThumbGenerating(true); setError(''); setThumbResult(null);
    try {
      const parts = [
        { text: `Task: Create a highly engaging, high-CTR YouTube/TikTok thumbnail image.
Description: ${thumbDesc}. 
Style: Bold, high contrast, vibrant colors, clear visual hierarchy, optimized for small screens (mobile).
If images are provided, composite them creatively into an eye-catching clickbait thumbnail. No floating bodies.` }
      ];
      if (thumbBaseImg) parts.push({ inlineData: { mimeType: "image/png", data: thumbBaseImg.split(',')[1] } });
      if (thumbFaceImg) parts.push({ inlineData: { mimeType: "image/png", data: thumbFaceImg.split(',')[1] } });

      const res = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } }) });
      const imgBase64 = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (imgBase64) setThumbResult(`data:image/png;base64,${imgBase64}`);
    } catch (err) { setError(err.message); } finally { setIsThumbGenerating(false); }
  };

  const handleAnalyzeVideo = async () => {
    if (!analyzeUrl) return;
    const isAllowed = await onGenerateAttempt(); if (!isAllowed) return;
    setIsAnalyzeGenerating(true); setError(''); setAnalyzeResult(null);
    try {
      const prompt = `Act as an advanced AI Video Algorithm Analyzer.
Simulate a deep analysis of this short-video URL: ${analyzeUrl}. 
(If you cannot fetch it directly, perform a highly realistic heuristic simulation of a typical viral affiliate video based on the URL structure).
Return JSON:
{
  "viralScore": integer (0-100),
  "viralPrediction": "string (Why it will/won't blow up further)",
  "hookStructure": "string (What makes the first 3 seconds work)",
  "pacing": "string (Fast, medium, slow, and why)",
  "dominantEmotion": "string (e.g., FOMO, Curiosity, Empathy)",
  "detectedKeywords": ["string", "string"],
  "salesAngle": "string (How they pitch the product subtly)",
  "ctaEffectiveness": "string"
}`;
      
      const res = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: "user", parts: [{text: prompt}] }], tools: [{ google_search: {} }], generationConfig: { responseMimeType: "application/json" } }) });
      setAnalyzeResult(JSON.parse(res.candidates[0].content.parts[0].text));
    } catch (err) { setError(err.message); } finally { setIsAnalyzeGenerating(false); }
  };

  const handleTracker = async () => {
    if (!trackerUrl) return;
    const isAllowed = await onGenerateAttempt(); if (!isAllowed) return;
    setIsTrackerGenerating(true); setError(''); setTrackerResult(null);
    try {
      const prompt = `Act as an Affiliate Video Performance Tracker & Diagnostic Tool.
URL provided: ${trackerUrl}.
Generate a realistic simulated tracking dashboard for this affiliate video. Be highly critical.
Return JSON:
{
  "metrics": {
    "estimatedViews": "string (e.g., 45.2K)",
    "ctr": "string (e.g., 2.4%)",
    "conversionRate": "string (e.g., 0.8%)",
    "bestUploadTime": "string (e.g., 18:00 - 20:00 WIB)",
    "estimatedRoi": "string (e.g., +250%)"
  },
  "bestHookIdentified": "string",
  "diagnostic": {
    "status": "Success" | "Failed" | "Stagnant",
    "whyFailedOrSucceeded": "string (Detailed brutal honesty why the algorithm loved or hated it)",
    "improvementAdvice": "string"
  }
}`;
      
      const res = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: "user", parts: [{text: prompt}] }], generationConfig: { responseMimeType: "application/json" } }) });
      setTrackerResult(JSON.parse(res.candidates[0].content.parts[0].text));
    } catch (err) { setError(err.message); } finally { setIsTrackerGenerating(false); }
  };


  const TABS = [
    { id: 'seo-tags', icon: Hash, label: 'SEO & Tags', color: 'emerald' },
    { id: 'hook-gen', icon: Lightbulb, label: 'Pabrik Hook', color: 'amber' },
    { id: 'ugc-script', icon: PenTool, label: 'UGC Script', color: 'indigo' },
    { id: 'thumb-gen', icon: ImageLucide, label: 'Thumbnail AI', color: 'pink' },
    { id: 'video-analyzer', icon: ActivitySquare, label: 'Bedah Video', color: 'blue' },
    { id: 'performance-tracker', icon: BarChart2, label: 'Tracker', color: 'purple' },
  ];

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className={`text-3xl font-black tracking-tight flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>
          <RocketIcon className="text-indigo-500" /> Optimasi Publikasi Super
        </h2>
        <p className={`text-sm max-w-3xl mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Pusat kendali komprehensif untuk memastikan konten Anda meledak di algoritma. Mulai dari peracikan *Hook* maut, penulisan Script UGC, hingga pelacakan performa kompetitor.
        </p>
      </div>

      <LimitWarning generateCount={generateCount} userRole={userRole} />
      {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-500 animate-in shake"><AlertCircle size={20} className="shrink-0 mt-0.5" /><p className="text-sm font-medium">{error}</p></div>}

      <div className={`flex gap-2 p-1.5 rounded-2xl mb-8 overflow-x-auto custom-scrollbar border ${isDark ? 'bg-slate-900/50 border-slate-800/50' : 'bg-slate-100/50 border-slate-200'}`}>
        {TABS.map(tab => (
          <button 
            key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap ${activeTab === tab.id ? `bg-${tab.color}-600 text-white shadow-lg shadow-${tab.color}-500/20` : (isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-white')}`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* TABS CONTENT */}
      {activeTab === 'seo-tags' && (
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4">
            <div className="lg:col-span-4 space-y-6">
               <div className={`p-6 rounded-[2rem] border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <label className="text-xs font-bold uppercase tracking-widest text-emerald-500 block mb-4">Target Platform</label>
                  <select value={seoPlatform} onChange={e => setSeoPlatform(e.target.value)} className={`w-full p-4 rounded-2xl border outline-none mb-6 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}>
                     <option>TikTok</option><option>Shopee Video</option><option>Instagram Reels</option>
                  </select>
                  <textarea placeholder="Deskripsi produk atau materi video..." value={seoDesc} onChange={e => setSeoDesc(e.target.value)} className={`w-full h-32 p-5 rounded-2xl border outline-none ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} />
                  <button onClick={handleGenerateSEO} disabled={isSeoGenerating} className="w-full mt-6 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20">{isSeoGenerating ? <Loader2 className="animate-spin mx-auto"/> : 'Analisa SEO & Hashtag'}</button>
               </div>
            </div>
            <div className={`lg:col-span-8 p-8 rounded-[2rem] border shadow-sm min-h-[400px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
               {seoResult ? (
                 <div className="space-y-6">
                    <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
                       <h3 className="font-bold text-emerald-500 text-sm mb-2 flex items-center gap-2"><Activity size={16}/> Skor Viral: {seoResult.viralPotentialScore}/100</h3>
                       <p className={`text-xs italic ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>"{seoResult.reasoning}"</p>
                    </div>
                    {seoResult.results?.map((item, i) => (
                      <div key={i} className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                         <h4 className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{item.seoTitle}</h4>
                         <span className="px-3 py-1 bg-yellow-400 text-black text-[10px] font-black rounded-lg inline-block mb-4 uppercase tracking-tighter">{item.coverText}</span>
                         <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.fullCaption}</p>
                      </div>
                    ))}
                 </div>
               ) : <EmptyState icon={<Hash size={48}/>} title="SEO Engine Siap" desc="Masukkan produk untuk mendapatkan hashtag berjenjang dan ide cover teks klik." isDark={isDark} />}
            </div>
         </div>
      )}

      {activeTab === 'hook-gen' && (
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4">
            <div className="lg:col-span-4 space-y-6">
               <div className={`p-6 rounded-[2rem] border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-amber-500 block mb-2">Nama Produk / Topik</label>
                  <input placeholder="Contoh: Skintific Mugwort" value={hookProduct} onChange={e => setHookProduct(e.target.value)} className={`w-full p-4 rounded-2xl border outline-none mb-4 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} />
                  
                  <label className="text-[11px] font-bold uppercase tracking-widest text-amber-500 block mb-2">Kategori Market</label>
                  <select value={hookCategory} onChange={e => setHookCategory(e.target.value)} className={`w-full p-4 rounded-2xl border outline-none mb-6 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}>
                     <option>Beauty & Skincare</option><option>Gadget</option><option>Fashion</option><option>F&B</option>
                  </select>

                  <button onClick={handleGenerateHook} disabled={isHookGenerating} className="w-full py-4 bg-amber-500 text-white font-bold rounded-2xl shadow-xl shadow-amber-500/20">{isHookGenerating ? <Loader2 className="animate-spin mx-auto"/> : 'Generate 8 Tipe Hook'}</button>
               </div>
            </div>
            <div className={`lg:col-span-8 p-6 rounded-[2rem] border shadow-sm min-h-[400px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
               {hookResult ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {hookResult.hooks?.map((hook, i) => (
                      <div key={i} className={`p-5 rounded-2xl border relative group ${isDark ? 'bg-slate-950 border-slate-800 hover:border-amber-500/50' : 'bg-slate-50 border-slate-200 hover:border-amber-400'}`}>
                         <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">{hook.type}</span>
                         <p className={`mt-3 text-sm font-bold italic leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>"{hook.hookText}"</p>
                         <p className={`mt-2 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{hook.reasoning}</p>
                         <button onClick={() => handleCopy(hook.hookText, `hook_${i}`)} className="absolute top-4 right-4 p-2 bg-amber-500/10 text-amber-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                           {copiedIndex === `hook_${i}` ? <Check size={14}/> : <Copy size={14}/>}
                         </button>
                      </div>
                    ))}
                 </div>
               ) : <EmptyState icon={<Lightbulb size={48}/>} title="Pabrik Hook Siap" desc="Dapatkan 8 variasi hook maut (FOMO, Shock Value, Problem-Solution) untuk video Anda." isDark={isDark} />}
            </div>
         </div>
      )}

      {activeTab === 'ugc-script' && (
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4">
            <div className="lg:col-span-5 space-y-6">
               <div className={`p-6 rounded-[2rem] border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-indigo-500 block mb-2">Topik Inti / Penjelasan</label>
                  <textarea placeholder="Misal: Review mic wireless murah yang suaranya jernih banget..." value={ugcTopic} onChange={e => setUgcTopic(e.target.value)} className={`w-full h-24 p-4 rounded-2xl border outline-none mb-4 resize-none ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} />
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-widest text-indigo-500 block mb-2">Audiens Target</label>
                      <input placeholder="Misal: Content creator pemula" value={ugcAudience} onChange={e => setUgcAudience(e.target.value)} className={`w-full p-3.5 rounded-xl border outline-none text-xs ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-widest text-indigo-500 block mb-2">Vibes / Nada</label>
                      <select value={ugcTone} onChange={e => setUgcTone(e.target.value)} className={`w-full p-3.5 rounded-xl border outline-none text-xs ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}>
                         <option>Ceria dan Ramah</option><option>Elegan & Mewah</option><option>Ngegas / Nyolot (Viral)</option><option>Sedih / Empati</option>
                      </select>
                    </div>
                  </div>

                  <label className="text-[11px] font-bold uppercase tracking-widest text-indigo-500 block mb-2">Goal / CTA</label>
                  <input placeholder="Misal: Suruh klik keranjang kuning promo kilat" value={ugcCta} onChange={e => setUgcCta(e.target.value)} className={`w-full p-4 rounded-2xl border outline-none mb-6 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} />

                  <button onClick={handleGenerateUgc} disabled={isUgcGenerating} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20">{isUgcGenerating ? <Loader2 className="animate-spin mx-auto"/> : 'Tulis Script UGC Natural'}</button>
               </div>
            </div>
            <div className={`lg:col-span-7 p-8 rounded-[2rem] border shadow-sm min-h-[400px] flex flex-col ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
               {ugcResult ? (
                 <div className="space-y-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-center border-b pb-4 dark:border-slate-800">
                      <h3 className={`font-black text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}><PenTool className="text-indigo-500"/> Naskah UGC Siap Rekam</h3>
                      <button onClick={() => handleCopy(ugcResult.script, 'ugc')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${copiedIndex === 'ugc' ? 'bg-emerald-500 text-white' : 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20'}`}>
                        {copiedIndex === 'ugc' ? 'Tersalin!' : 'Salin Naskah'}
                      </button>
                    </div>
                    <div className={`p-6 rounded-2xl flex-1 text-sm leading-loose whitespace-pre-wrap ${isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
                      {ugcResult.script}
                    </div>
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-indigo-50 border-indigo-100'}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 block mb-1">Catatan Sutradara (AI):</span>
                      <p className={`text-xs italic ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{ugcResult.directorNotes}</p>
                    </div>
                 </div>
               ) : <EmptyState icon={<PenTool size={48}/>} title="Penulis Script Beraksi" desc="Masukkan detail, dan AI akan menuliskan naskah yang terdengar seperti diucapkan manusia asli lengkap dengan jeda emosi." isDark={isDark} />}
            </div>
         </div>
      )}

      {activeTab === 'thumb-gen' && (
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4">
            <div className="lg:col-span-5 space-y-6">
               <div className={`p-6 rounded-[2rem] border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>Komposisi Thumbnail</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div onClick={() => fileInputRefThumb1.current?.click()} className={`aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden ${isDark ? 'border-slate-700 hover:border-pink-500' : 'border-slate-300 hover:border-pink-400'}`}>
                      <input type="file" ref={fileInputRefThumb1} hidden accept="image/*" onChange={e => handleImageUpload(e, setThumbBaseImg)} />
                      {thumbBaseImg ? <img src={thumbBaseImg} className="w-full h-full object-cover" /> : <div className="text-center opacity-50"><ImageIcon className="mx-auto mb-2"/><span className="text-[10px] font-bold">GAMBAR UTAMA</span></div>}
                    </div>
                    <div onClick={() => fileInputRefThumb2.current?.click()} className={`aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden ${isDark ? 'border-slate-700 hover:border-pink-500' : 'border-slate-300 hover:border-pink-400'}`}>
                      <input type="file" ref={fileInputRefThumb2} hidden accept="image/*" onChange={e => handleImageUpload(e, setThumbFaceImg)} />
                      {thumbFaceImg ? <img src={thumbFaceImg} className="w-full h-full object-cover" /> : <div className="text-center opacity-50"><Users className="mx-auto mb-2"/><span className="text-[10px] font-bold">WAJAH (OPSIONAL)</span></div>}
                    </div>
                  </div>

                  <label className="text-[11px] font-bold uppercase tracking-widest text-pink-500 block mb-2">Deskripsi Teks / Vibe Thumbnail</label>
                  <textarea placeholder="Contoh: Buat sangat clickbait, warna neon, ada teks 'RAHASIA TERBONGKAR' besar..." value={thumbDesc} onChange={e => setThumbDesc(e.target.value)} className={`w-full h-24 p-4 rounded-2xl border outline-none mb-6 resize-none ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} />

                  <button onClick={handleGenerateThumb} disabled={isThumbGenerating} className="w-full py-4 bg-pink-600 text-white font-bold rounded-2xl shadow-xl shadow-pink-500/20">{isThumbGenerating ? <Loader2 className="animate-spin mx-auto"/> : 'Render Thumbnail High-CTR'}</button>
               </div>
            </div>
            <div className={`lg:col-span-7 p-6 rounded-[2rem] border shadow-sm min-h-[400px] flex flex-col items-center justify-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
               {thumbResult ? (
                 <div className="w-full h-full flex flex-col gap-4">
                   <div className="flex-1 w-full rounded-2xl overflow-hidden bg-black/10 relative">
                      <img src={thumbResult} className="w-full h-full object-contain" />
                   </div>
                   <button className="py-3 bg-pink-500/10 text-pink-500 font-bold rounded-xl w-full flex items-center justify-center gap-2"><Download size={16}/> Unduh Thumbnail</button>
                 </div>
               ) : <EmptyState icon={<ImageLucide size={48}/>} title="Desainer Thumbnail AI" desc="Unggah gambar mentah, dan AI akan meraciknya menjadi thumbnail yang menggoda untuk di-klik." isDark={isDark} />}
            </div>
         </div>
      )}

      {activeTab === 'video-analyzer' && (
         <div className="animate-in slide-in-from-bottom-4 space-y-8">
            <div className={`p-8 rounded-[2rem] border shadow-sm text-center max-w-3xl mx-auto ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
               <div className="w-16 h-16 mx-auto bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-6"><ActivitySquare size={32}/></div>
               <h3 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>Analyzer Algoritma Video</h3>
               <p className={`text-sm mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tempelkan link video TikTok/Shopee kompetitor untuk membedah struktur rahasianya.</p>
               
               <div className="flex flex-col sm:flex-row gap-3">
                 <input placeholder="https://vt.tiktok.com/..." value={analyzeUrl} onChange={e => setAnalyzeUrl(e.target.value)} className={`flex-1 p-4 rounded-2xl border outline-none ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} />
                 <button onClick={handleAnalyzeVideo} disabled={isAnalyzeGenerating} className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 whitespace-nowrap">{isAnalyzeGenerating ? <Loader2 className="animate-spin mx-auto"/> : 'Bedah Video'}</button>
               </div>
            </div>

            {analyzeResult && (
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`p-6 rounded-[2rem] border text-center flex flex-col items-center justify-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                     <Gauge size={48} className="text-blue-500 mb-4"/>
                     <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Viral Score</span>
                     <p className={`text-6xl font-black my-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>{analyzeResult.viralScore}</p>
                     <PremiumBadge variant="success">Sangat Berpotensi</PremiumBadge>
                  </div>
                  <div className={`md:col-span-2 p-8 rounded-[2rem] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                     <h4 className={`font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}><Activity size={18} className="text-blue-500"/> Hasil Pembedahan AI</h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Struktur Hook (0-3s)</span>
                         <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{analyzeResult.hookStructure}</p>
                       </div>
                       <div>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Pacing Video</span>
                         <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{analyzeResult.pacing}</p>
                       </div>
                       <div>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Emosi Dominan</span>
                         <p className={`text-sm font-medium text-blue-500`}>{analyzeResult.dominantEmotion}</p>
                       </div>
                       <div>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Sales Angle</span>
                         <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{analyzeResult.salesAngle}</p>
                       </div>
                     </div>
                  </div>
               </div>
            )}
         </div>
      )}

      {activeTab === 'performance-tracker' && (
         <div className="animate-in slide-in-from-bottom-4 space-y-8">
            <div className={`p-8 rounded-[2rem] border shadow-sm text-center max-w-3xl mx-auto ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
               <div className="w-16 h-16 mx-auto bg-purple-500/10 text-purple-500 rounded-full flex items-center justify-center mb-6"><BarChart2 size={32}/></div>
               <h3 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>Pelacak Performa Video</h3>
               <p className={`text-sm mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cek estimasi konversi dan dapatkan kritik tajam kenapa video Anda stuck (Mentok Viewer).</p>
               
               <div className="flex flex-col sm:flex-row gap-3">
                 <input placeholder="Link video Anda..." value={trackerUrl} onChange={e => setTrackerUrl(e.target.value)} className={`flex-1 p-4 rounded-2xl border outline-none ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} />
                 <button onClick={handleTracker} disabled={isTrackerGenerating} className="px-8 py-4 bg-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-purple-500/20 whitespace-nowrap">{isTrackerGenerating ? <Loader2 className="animate-spin mx-auto"/> : 'Lacak Performa'}</button>
               </div>
            </div>

            {trackerResult && (
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className={`p-8 rounded-[2rem] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                     <h4 className={`font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}><BarChart size={18} className="text-purple-500"/> Estimasi Metrik (AI Based)</h4>
                     <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Estimasi Views</span>
                          <span className={`text-xl font-black ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{trackerResult.metrics.estimatedViews}</span>
                        </div>
                        <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Rata-rata CTR</span>
                          <span className={`text-xl font-black text-purple-500`}>{trackerResult.metrics.ctr}</span>
                        </div>
                        <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Conversion Rate</span>
                          <span className={`text-xl font-black text-emerald-500`}>{trackerResult.metrics.conversionRate}</span>
                        </div>
                        <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Jam Upload Terbaik</span>
                          <span className={`text-sm mt-1 font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{trackerResult.metrics.bestUploadTime}</span>
                        </div>
                     </div>
                  </div>

                  <div className={`p-8 rounded-[2rem] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                     <h4 className={`font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}><Info size={18} className="text-red-500"/> Diagnosa Kegagalan / Kesuksesan</h4>
                     <div className="space-y-4">
                       <div>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Status AI</span>
                         <PremiumBadge variant={trackerResult.diagnostic.status === 'Success' ? 'success' : trackerResult.diagnostic.status === 'Failed' ? 'danger' : 'warning'}>{trackerResult.diagnostic.status}</PremiumBadge>
                       </div>
                       <div className={`p-4 rounded-xl border ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
                         <span className="text-[10px] font-black uppercase tracking-widest block mb-1">Alasan Algoritma:</span>
                         <p className="text-sm">{trackerResult.diagnostic.whyFailedOrSucceeded}</p>
                       </div>
                       <div className={`p-4 rounded-xl border ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                         <span className="text-[10px] font-black uppercase tracking-widest block mb-1">Saran Perbaikan:</span>
                         <p className="text-sm">{trackerResult.diagnostic.improvementAdvice}</p>
                       </div>
                     </div>
                  </div>
               </div>
            )}
         </div>
      )}

    </div>
  );
}

const EmptyState = ({ icon, title, desc, isDark }) => (
  <div className="flex-1 h-full flex flex-col items-center justify-center text-center p-8">
    <div className={`w-24 h-24 mb-6 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800/50 text-slate-600' : 'bg-slate-100 text-slate-300'}`}>
      {icon}
    </div>
    <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{title}</h3>
    <p className={`text-sm max-w-sm leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{desc}</p>
  </div>
);

const RocketIcon = ({ className }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);

// ==========================================
// COMPONENT: Generator Affiliate v1
// ==========================================
function ToolGeneratorAffiliate({ isDark, userRole, generateCount, onGenerateAttempt }) {
  const [characterImg, setCharacterImg] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [productDetailText, setProductDetailText] = useState('');
  const [bgMode, setBgMode] = useState('image');
  const [bgInput, setBgInput] = useState(null);
  const [visualStyle, setVisualStyle] = useState('ultra realistic');
  const [imageCount, setImageCount] = useState(1);
  const [enableDialogue, setEnableDialogue] = useState(false);
  const [characterGender, setCharacterGender] = useState('Wanita');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [negativeSpace, setNegativeSpace] = useState(false);
  const [placement, setPlacement] = useState('natural');
  const [lockedMsg, setLockedMsg] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [generatedResults, setGeneratedResults] = useState([]); 
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [copied, setCopied] = useState(null);
  const [visiblePromptIdx, setVisiblePromptIdx] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const productFileInputRef = useRef(null);
  const bgFileInputRef = useRef(null);

  const handleReset = () => {
    setCharacterImg(null); setProductImages([]); setProductDetailText('');
    setBgMode('image'); setBgInput(null); setVisualStyle('ultra realistic'); 
    setImageCount(1); setEnableDialogue(false); setCharacterGender('Wanita');
    setAspectRatio('9:16'); setNegativeSpace(false); setPlacement('natural'); 
    setGeneratedResults([]); setFullScreenImage(null); setCopied(null); 
    setVisiblePromptIdx(null); setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (productFileInputRef.current) productFileInputRef.current.value = '';
    if (bgFileInputRef.current) bgFileInputRef.current.value = '';
  };

  const handleImageUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) { const reader = new FileReader(); reader.onloadend = () => setter(reader.result); reader.readAsDataURL(file); }
  };

  const handleProductUpload = (e) => {
    const files = Array.from(e.target.files);
    const filesToProcess = files.slice(0, 4 - productImages.length);
    filesToProcess.forEach(file => { const reader = new FileReader(); reader.onloadend = () => setProductImages(prev => [...prev, reader.result]); reader.readAsDataURL(file); });
    if (productFileInputRef.current) productFileInputRef.current.value = '';
  };

  const removeProductImage = (index) => setProductImages(prev => prev.filter((_, i) => i !== index));

  const handleCopy = (textToCopy, idx) => {
    try {
      const textArea = document.createElement("textarea"); textArea.value = textToCopy;
      textArea.style.position = "fixed"; document.body.appendChild(textArea); textArea.focus(); textArea.select();
      if (document.execCommand('copy')) { setCopied(idx); setTimeout(() => setCopied(null), 2000); } 
      else throw new Error('Copy failed');
      document.body.removeChild(textArea);
    } catch (err) { setError("Gagal menyalin."); }
  };

  const handleDownload = (imgData, index) => {
    const link = document.createElement('a'); link.href = imgData; link.download = `affiliate_gen_${index + 1}.png`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleLockCharacter = (imgUrl) => {
    setCharacterImg(imgUrl);
    setLockedMsg('Karakter dari foto berhasil dikunci untuk sesi berikutnya!');
    setTimeout(() => setLockedMsg(''), 4000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generateContent = async () => {
    if (productImages.length === 0) { setError("Mohon unggah minimal 1 gambar produk jualan Anda."); return; }
    const isAllowed = await onGenerateAttempt();
    if (!isAllowed) return;

    setIsGenerating(true); setError(null); setGeneratedResults([]); setVisiblePromptIdx(null);

    try {
      setLoadingText("Menganalisa produk, referensi, dan merancang komposisi visual...");
      const charInfo = characterImg ? `A specific human character is provided.` : `NO human character. Focus entirely on Product Photography.`;
      const dialogueInstruction = enableDialogue ? `MUST INTEGRATE spoken dialogue (Lip-Sync) directly INTO the scenes. The dialogue MUST be in INDONESIAN for a ${characterGender} voice. Format it inside each applicable scene like: "[Indonesian Lip-Sync: '...']"` : `NO spoken dialogue needed. Do not include any lip-sync text.`;
      const aspectText = aspectRatio === '9:16' ? '9:16 portrait vertical format' : aspectRatio === '16:9' ? '16:9 landscape horizontal format' : '1:1 square format';
      const placementText = placement === 'hand' ? 'Held closely and naturally in human hands (close-up)' : placement === 'table' ? 'Placed elegantly on an aesthetic table/surface' : placement === 'giant' ? 'Product is surrealistically giant/oversized compared to the character/environment for dramatic effect' : 'Natural scale and realistic placement';
      const negativeSpaceText = negativeSpace ? 'MANDATORY: Leave significant empty negative space at the top or sides of the composition to allow the user to add promotional typography later. Do not center the main subject too tightly.' : 'Frame the subject perfectly centered without worrying about text space.';

      const isStylized = ['anime style', 'pixar style', 'cyberpunk'].includes(visualStyle);
      const styleEnforcement = isStylized ? `Enforce: "A single, seamless shot strictly following the ${visualStyle} aesthetic. Character and product must blend flawlessly into this specific art/cinematic style without looking like pasted cutouts. Lighting and mood must heavily reflect ${visualStyle}."` : `Enforce: "A single, seamless photorealistic shot. The character MUST be physically grounded (e.g., standing firmly on the floor with legs visible, or sitting naturally) to entirely prevent floating half-bodies. The character, product, and background share the EXACT SAME global illumination. Realistic cast shadows are visible. Natural skin texture. No CGI look."`;

      const parts = [
        { text: `You are an expert AI orchestrator for commercial product photography and cinematic video direction.
Style/Vibe: ${visualStyle}. Images needed: ${imageCount}. 
Product Info: ${productDetailText || 'See images'}.
Character Presence: ${charInfo}

CRITICAL TASK: Generate exactly ${imageCount} DISTINCT concepts. Each concept MUST have a completely DIFFERENT character pose, interaction, and camera angle.
Task 1: Describe the product accurately based on images and text.
Task 2: If a character exists, describe them interacting physically and naturally with the product and environment, adapting to the requested ${visualStyle}.
Task 3: Create an ENGLISH prompt for Image Generation (${aspectText}). The prompt MUST focus on creating a SINGLE UNIFIED SCENE. ${styleEnforcement} ${negativeSpaceText} Product placement: ${placementText}. 
Task 4: Generate a SIMPLE but STRICT AI video prompt optimized for Leonardo AI and Kling AI.
Structure the videoPrompt string EXACTLY as follows with these numbered sections:
1. GLOBAL STYLE: [Brief style description, strictly ${visualStyle}]
2. CHARACTER LOCK: [Describe character identity, facial structure, outfit in physical detail]
3. PRODUCT LOCK: [Describe product in physical detail]
4. ENVIRONMENT LOCK: [Describe the setting physically]
5. SCENE SEQUENCE:
   - Scene 1: [Simple camera angle] - [Simple physical action]
   - Scene 2: [Simple camera angle] - [Simple physical action]
   - Scene 3: [Simple camera angle] - [Simple physical action]
   - Scene 4: [Simple camera angle] - [Simple physical action]
   - Scene 5: [Simple camera angle] - [Simple physical action]
6. CONTINUITY: "Maintain the same exact character identity, facial structure, outfit, product details, and environment consistency across all scenes."
7. NEGATIVE PROMPT: "inconsistent face, changing outfit, extra fingers, distorted hands, blurry face, different character, duplicate body parts, warped fabric."

RULES FOR VIDEO PROMPT (Task 4):
- STRICTLY SIMPLIFY: DO NOT use technical camera/render jargon or micro-instructions like "4k", "60fps", "high-speed shutter", "fluid limb motion", "no robotic transitions", "sharp focus", "soft focus", "natural flare", "room depth visible", "octane render", etc.
- KEEP IT CLEAN: Focus ONLY on the physical appearance (Locks) and simple actions (Scenes).
- Never allow scene descriptions to imply a different character. Every scene must feel like a continuation.
- ${dialogueInstruction}

Return EXACTLY in this JSON schema: { "results": [ { "imagePrompt": "string", "videoPrompt": "string" } ] }` }
      ];

      if (characterImg) { parts.push({ text: `Character Image:` }); parts.push({ inlineData: { mimeType: characterImg.split(';')[0].split(':')[1], data: characterImg.split(',')[1] } }); }
      productImages.forEach((prodImg, index) => { parts.push({ text: `Product Image ${index + 1}:` }); parts.push({ inlineData: { mimeType: prodImg.split(';')[0].split(':')[1], data: prodImg.split(',')[1] } }); });
      if (bgMode === 'image' && bgInput) { parts.push({ text: `Background Reference:` }); parts.push({ inlineData: { mimeType: bgInput.split(';')[0].split(':')[1], data: bgInput.split(',')[1] } }); } 
      else { parts.push({ text: `Background Preference: ${bgInput || 'Matching aesthetic environment'}` }); }

      const visionRes = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { results: { type: "ARRAY", items: { type: "OBJECT", properties: { imagePrompt: { type: "STRING" }, videoPrompt: { type: "STRING" } } } } } } } }) });
      const parsedData = JSON.parse(visionRes.candidates?.[0]?.content?.parts?.[0]?.text || '{"results":[]}');
      const orchestratorResults = parsedData.results || [];
      let finalResults = [];

      for (let i = 0; i < orchestratorResults.length; i++) {
        setLoadingText(`Merender mahakarya visual ${i + 1} dari ${imageCount}... (Menyesuaikan proporsi & pencahayaan)`);
        const item = orchestratorResults[i];
        const imgStyleRules = isStylized ? `7. ART/CINEMATIC STYLE: Strictly adhere to the ${visualStyle} aesthetic. Textures, lighting, and colors must match this style perfectly. Format: ${aspectText}.` : `7. ABSOLUTE PHOTOREALISM: Natural textures. No CGI look. Format: ${aspectText}.`;
        const imageGenParts = [{ text: `Task: Seamless Photographic Synthesis. Base Composition: ${item.imagePrompt}. Style: ${visualStyle}.\nMANDATORY RULES FOR FLAWLESS COMPOSITING:\n1. NO CUTOUTS/FLOATING: The character and product MUST be physically grounded in the environment. DO NOT generate floating half-bodies.\n2. PERFECT MATCH: Color grading, light direction, and brightness MUST 100% match the background and requested ${visualStyle}.\n3. REALISTIC SHADOWS: Cast realistic shadows from the product/character onto the background.\n4. CONSISTENT PERSPECTIVE: The camera angle and focal length must be identical.\n5. COMPOSITION & PLACEMENT: ${placementText}. ${negativeSpaceText}\n6. ASPECT RATIO: Strictly generate in ${aspectText}.\n${imgStyleRules}` }];

        if (characterImg) { imageGenParts.push({ inlineData: { mimeType: characterImg.split(';')[0].split(':')[1], data: characterImg.split(',')[1] } }); }
        productImages.forEach(img => imageGenParts.push({ inlineData: { mimeType: img.split(';')[0].split(':')[1], data: img.split(',')[1] } }));
        if (bgMode === 'image' && bgInput) { imageGenParts.push({ inlineData: { mimeType: bgInput.split(';')[0].split(':')[1], data: bgInput.split(',')[1] } }); }

        const imageRes = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: "user", parts: imageGenParts }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } }) });
        const imgBase64 = imageRes.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        if (imgBase64) { finalResults.push({ imageUrl: `data:image/png;base64,${imgBase64}`, videoPrompt: item.videoPrompt, ratio: aspectRatio }); }
      }
      setGeneratedResults(finalResults);
    } catch (err) { setError(`Error: ${err.message}`); } finally { setIsGenerating(false); }
  };

  return (
    <div className="animate-in fade-in duration-700">
      {lockedMsg && (
        <div className="fixed top-24 right-6 z-50 animate-in slide-in-from-top-5 fade-in bg-emerald-500 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold">
           <Check size={20} /> <span className="text-sm">{lockedMsg}</span>
        </div>
      )}

      <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className={`text-3xl font-black tracking-tight flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            <Sparkles className="text-indigo-500" size={28}/> Visual & Script Studio
          </h2>
          <p className={`text-sm max-w-xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sulap foto produk biasa Anda menjadi konten promosi kelas studio hanya dalam 3 langkah mudah.</p>
        </div>
        <button onClick={handleReset} className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl border transition-all shadow-sm active:scale-95 ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'}`}>
          <RotateCcw size={16} /> Mulai dari Awal
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-5 space-y-6">
          <LimitWarning generateCount={generateCount} userRole={userRole} />
          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-500 animate-in shake"><AlertCircle size={20} className="shrink-0 mt-0.5" /><p className="text-sm font-medium">{error}</p></div>}

          <div className={`border rounded-[2rem] p-6 shadow-sm relative overflow-hidden transition-colors ${isDark ? 'bg-slate-900 border-slate-800 hover:border-indigo-500/30' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
            <div className={`absolute top-0 left-0 w-1.5 h-full ${isDark ? 'bg-indigo-500/80' : 'bg-indigo-500'}`}></div>
            <div className="flex flex-col mb-5">
               <h3 className={`text-base font-black flex items-center gap-2.5 ${isDark ? 'text-white' : 'text-slate-800'}`}><span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-black shadow-md">1</span> Siapkan Bahan Visual</h3>
               <p className={`text-[11px] font-medium mt-1 ml-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Unggah foto produk Anda, dan tambahkan model wajah jika diperlukan.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider pl-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Wajah / Model <span className="text-slate-400/50 normal-case font-medium">(Opsional)</span></span>
                <div onClick={() => fileInputRef.current?.click()} className={`flex-1 min-h-[120px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${characterImg ? (isDark ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-indigo-400/50 bg-indigo-50') : (isDark ? 'border-slate-700 hover:border-indigo-500/50' : 'border-slate-300 hover:border-indigo-400')}`}>
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, setCharacterImg)} />
                  {characterImg ? <img src={characterImg} className="w-full h-full object-cover rounded-2xl p-1 absolute inset-0" style={{position:'relative'}} /> : <div className="flex flex-col items-center text-center p-3 opacity-60"><div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-2"><ImagePlus size={18} className={isDark ? 'text-slate-400' : 'text-slate-500'}/></div><span className="text-[10px] font-bold">Pilih Foto</span></div>}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider pl-1 text-emerald-500`}>Produk Jualan <span className="text-emerald-500/50 normal-case font-medium">(Wajib)</span></span>
                <div className="grid grid-cols-2 gap-2 flex-1 min-h-[120px]">
                  {productImages.length < 4 && (
                    <div onClick={() => productFileInputRef.current?.click()} className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${isDark ? 'border-slate-700 hover:border-emerald-500/50' : 'border-slate-300 hover:border-emerald-400'}`}>
                      <input type="file" ref={productFileInputRef} hidden multiple accept="image/*" onChange={handleProductUpload} />
                      <Plus size={20} className="text-emerald-500/60 mb-1" />
                      <span className="text-[8px] font-bold text-emerald-500/60 uppercase">Tambah</span>
                    </div>
                  )}
                  {productImages.map((img, idx) => (
                    <div key={idx} className="relative rounded-xl border overflow-hidden group shadow-sm">
                      <img src={img} className="w-full h-full object-cover p-0.5 rounded-xl" />
                      <button onClick={() => removeProductImage(idx)} className="absolute top-1 right-1 p-1 bg-black/70 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={`border rounded-[2rem] p-6 shadow-sm relative overflow-hidden transition-colors ${isDark ? 'bg-slate-900 border-slate-800 hover:border-blue-500/30' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
            <div className={`absolute top-0 left-0 w-1.5 h-full ${isDark ? 'bg-blue-500/80' : 'bg-blue-500'}`}></div>
            <div className="flex flex-col mb-5">
               <h3 className={`text-base font-black flex items-center gap-2.5 ${isDark ? 'text-white' : 'text-slate-800'}`}><span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shadow-md">2</span> Ceritakan Produkmu</h3>
               <p className={`text-[11px] font-medium mt-1 ml-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Berikan detail agar AI paham bentuk dan di mana produk ini harus diletakkan.</p>
            </div>
            <div className="space-y-4">
              <textarea placeholder="Tuliskan warnanya, bahannya, atau fungsi utamanya di sini..." className={`w-full h-20 border rounded-xl p-4 text-sm resize-none outline-none transition-all focus:ring-2 focus:ring-blue-500/50 ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'}`} value={productDetailText} onChange={(e) => setProductDetailText(e.target.value)} />
              <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-950/50 border border-slate-800' : 'bg-slate-50 border border-slate-200'}`}>
                <div className={`flex p-1 rounded-lg mb-3 ${isDark ? 'bg-slate-900' : 'bg-slate-200/60'}`}>
                  <button onClick={() => { setBgMode('image'); setBgInput(null); }} className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${bgMode === 'image' ? (isDark ? 'bg-slate-700 text-white' : 'bg-white text-blue-600') : 'text-slate-500'}`}>Foto Background</button>
                  <button onClick={() => { setBgMode('text'); setBgInput(''); }} className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${bgMode === 'text' ? (isDark ? 'bg-slate-700 text-white' : 'bg-white text-blue-600') : 'text-slate-500'}`}>Ketik Suasana</button>
                </div>
                {bgMode === 'image' ? (
                  <div onClick={() => bgFileInputRef.current?.click()} className={`h-16 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all ${isDark ? 'border-slate-700 hover:border-blue-500/50' : 'border-slate-300 hover:border-blue-400'}`}>
                    <input type="file" ref={bgFileInputRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, setBgInput)} />
                    {bgInput ? <img src={bgInput} className="w-full h-full object-cover p-1 rounded-xl" /> : <div className="flex items-center gap-2 text-slate-400 font-medium text-xs"><ImageIcon size={16}/> <span className="underline decoration-dashed">Pilih Gambar Background</span></div>}
                  </div>
                ) : <textarea placeholder="Contoh: Di dapur estetik minimalis..." className={`w-full h-16 border rounded-xl p-3 text-xs resize-none outline-none transition-all focus:ring-2 focus:ring-blue-500/50 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300'}`} value={bgInput || ''} onChange={(e) => setBgInput(e.target.value)} />}
              </div>
            </div>
          </div>

          <div className={`border rounded-[2rem] p-6 shadow-sm relative overflow-hidden transition-colors ${isDark ? 'bg-slate-900 border-slate-800 hover:border-pink-500/30' : 'bg-white border-slate-200 hover:border-pink-300'}`}>
            <div className={`absolute top-0 left-0 w-1.5 h-full ${isDark ? 'bg-pink-500/80' : 'bg-pink-500'}`}></div>
            <div className="flex flex-col mb-5">
               <h3 className={`text-base font-black flex items-center gap-2.5 ${isDark ? 'text-white' : 'text-slate-800'}`}><span className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-[10px] font-black shadow-md">3</span> Pilih Gaya & Lip-Sync AI</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <select value={visualStyle} onChange={(e) => setVisualStyle(e.target.value)} className={`w-full border rounded-xl px-4 py-3.5 text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-pink-500/50 cursor-pointer ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`}>
                  <option value="ultra realistic">📷 Ultra Realistic (Sangat Nyata)</option>
                  <option value="cinematic">🎥 Cinematic (Film Profesional)</option>
                  <option value="vlog style">📱 Vlog Style (Kamera HP / UGC)</option>
                  <option value="anime style">🎨 Anime Style (Kartun Jepang)</option>
                  <option value="pixar style">🧸 Pixar 3D Style (Kartun 3D)</option>
                </select>
              </div>
              <div className={`w-full sm:w-28 p-2 rounded-xl flex flex-col justify-center items-center border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Jumlah</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xl font-black ${isDark ? 'text-pink-400' : 'text-pink-500'}`}>{imageCount}</span>
                  <input type="range" min="1" max="4" value={imageCount} onChange={(e) => setImageCount(parseInt(e.target.value))} className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500" />
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-pink-50/50 border-pink-100'}`}>
              <div>
                <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}><AudioLines size={16}/> Tulis Script Lip-Sync?</h4>
              </div>
              <div className="flex items-center gap-3">
                {enableDialogue && (
                  <select value={characterGender} onChange={(e) => setCharacterGender(e.target.value)} className={`border rounded-lg px-2 py-1.5 text-xs font-bold outline-none cursor-pointer ${isDark ? 'bg-slate-900 border-purple-500/30 text-purple-400' : 'bg-white border-purple-200 text-purple-600'}`}>
                    <option value="Wanita">👩 Suara Wanita</option><option value="Pria">👨 Suara Pria</option>
                  </select>
                )}
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" className="sr-only peer" checked={enableDialogue} onChange={(e) => setEnableDialogue(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:bg-purple-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
            </div>
          </div>

          <div className={`border rounded-2xl p-5 transition-all ${isDark ? 'bg-slate-900/30 border-slate-800/60' : 'bg-slate-50/50 border-slate-200'}`}>
             <h4 className={`text-xs font-bold mb-4 flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><Settings2 size={16}/> Pengaturan Lanjutan <span className="font-normal italic">(Opsional)</span></h4>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 pl-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Rasio Layar</label>
                  <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className={`w-full border rounded-xl px-3 py-2.5 text-xs font-medium outline-none ${isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                    <option value="9:16">9:16 (TikTok/Reels/Shorts)</option><option value="1:1">1:1 (Feed Instagram)</option><option value="16:9">16:9 (YouTube Video)</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 pl-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Posisi Kamera</label>
                  <select value={placement} onChange={e => setPlacement(e.target.value)} className={`w-full border rounded-xl px-3 py-2.5 text-xs font-medium outline-none ${isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                    <option value="natural">Otomatis / Proporsional</option><option value="hand">Fokus Dipegang Tangan</option><option value="table">Di Atas Meja (Flatlay)</option><option value="giant">Efek Dramatis (Raksasa)</option>
                  </select>
                </div>
                <div className={`col-span-1 sm:col-span-2 mt-1 p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <label className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Sisakan Ruang Teks <InfoTooltip text="Berguna jika Anda ingin menambahkan judul promosi di atas gambar hasil nanti."/></label>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={negativeSpace} onChange={e => setNegativeSpace(e.target.checked)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
             </div>
          </div>

          <button onClick={generateContent} disabled={isGenerating || (userRole === 'trial' && generateCount >= 2)} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm shadow-xl transition-all active:scale-[0.98] ${(userRole === 'trial' && generateCount >= 2) ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : (isDark ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white')}`}>
            {isGenerating ? <><Loader2 className="animate-spin" size={18} /> Memproses...</> : <><Wand2 size={18} /> Klik Untuk Mulai Generate</>}
          </button>
        </div>

        <div className={`xl:col-span-7 border rounded-[2.5rem] p-6 sm:p-8 flex flex-col shadow-sm min-h-[500px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          {isGenerating && generatedResults.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="relative w-28 h-28 mb-8"><Wand2 size={24} className="text-indigo-500 animate-pulse absolute inset-0 m-auto"/></div>
              <h3 className={`text-lg font-black mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>AI Sedang Bekerja...</h3>
              <p className={`text-xs font-bold px-4 py-2 rounded-full inline-flex ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>{loadingText}</p>
            </div>
          ) : generatedResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
              {generatedResults.map((item, idx) => (
                <div key={idx} className={`flex flex-col gap-3 p-3 rounded-3xl border transition-all ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`group relative rounded-2xl overflow-hidden shadow-sm ${item.ratio === '9:16' ? 'aspect-[9/16]' : item.ratio === '16:9' ? 'aspect-video' : 'aspect-square'} bg-slate-200 dark:bg-slate-800`}>
                    <img src={item.imageUrl} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button onClick={() => setFullScreenImage(item.imageUrl)} className="absolute top-3 right-3 p-2.5 bg-black/40 backdrop-blur-md rounded-xl text-white hover:bg-white/30"><Maximize2 size={16} /></button>
                      {userRole !== 'trial' && (
                        <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2.5">
                           <button onClick={() => handleDownload(item.imageUrl, idx)} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold"><Download size={14} className="inline mr-2"/> Simpan (HD)</button>
                           <button onClick={() => handleLockCharacter(item.imageUrl)} className="w-full py-3 bg-black/50 text-white rounded-xl text-xs font-bold backdrop-blur-md"><UserPlus size={14} className="inline mr-2"/> Kunci Karakter</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-1">
                    <button onClick={() => setVisiblePromptIdx(visiblePromptIdx === idx ? null : idx)} className={`py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${visiblePromptIdx === idx ? 'bg-indigo-600 text-white' : (isDark ? 'bg-slate-900 border border-slate-700 text-slate-300' : 'bg-white border border-slate-300 text-slate-700')}`}>
                      <Video size={16} /> {visiblePromptIdx === idx ? 'Tutup Script Video' : 'Lihat Script Video (AI)'}
                    </button>
                    {visiblePromptIdx === idx && (
                      <div className={`border rounded-xl p-5 text-sm ${isDark ? 'bg-slate-900 border-indigo-500/30' : 'bg-white border-indigo-200'}`}>
                        <div className="flex items-center justify-between border-b pb-3 mb-3 dark:border-slate-800">
                           <h4 className="text-[10px] font-black uppercase text-indigo-500"><Sparkles size={12} className="inline mr-1"/> Script Video</h4>
                           {userRole !== 'trial' && ( <button onClick={() => handleCopy(item.videoPrompt, `vid_${idx}`)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${copied === `vid_${idx}` ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{copied === `vid_${idx}` ? 'Tersalin!' : 'Salin'}</button> )}
                        </div>
                        <textarea readOnly value={item.videoPrompt} className={`w-full h-40 bg-transparent outline-none resize-none text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="m-auto text-center flex flex-col items-center max-w-sm">
              <div className={`w-28 h-28 mb-6 rounded-[2rem] flex items-center justify-center transform rotate-3 shadow-sm ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-slate-100 border border-slate-200'}`}>
                <ImagePlus size={48} className={`transform -rotate-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              </div>
              <h3 className={`text-lg font-black mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>Area Kanvas Visual</h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Isi panduan Langkah 1 hingga 3 di sebelah kiri, lalu klik tombol <b>Generate</b> untuk melihat keajaiban AI di sini.</p>
            </div>
          )}
        </div>
      </div>
      {fullScreenImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"><button onClick={() => setFullScreenImage(null)} className="absolute top-6 right-6 p-3 bg-white/10 rounded-2xl text-white"><X size={24} /></button><img src={fullScreenImage} className="max-h-[90vh] max-w-full rounded-2xl object-contain" /></div>
      )}
    </div>
  );
}

// ==========================================
// COMPONENT: Script & Voice Generator (Tool 2)
// ==========================================
function ToolScriptVoice({ isDark, userRole, generateCount, onGenerateAttempt }) {
  const [descText, setDescText] = useState('');
  const [refImage, setRefImage] = useState(null);
  
  const [lang, setLang] = useState('Indonesian');
  const [gender, setGender] = useState('female');
  const [tone, setTone] = useState('natural');
  const [ctaType, setCtaType] = useState('Keranjang Kuning (TikTok)');
  const [duration, setDuration] = useState('30s');
  
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  
  const [generatedScripts, setGeneratedScripts] = useState([]);
  const [activeScriptIdx, setActiveScriptIdx] = useState(0);
  const [editableScript, setEditableScript] = useState('');
  
  const [audioUrl, setAudioUrl] = useState('');
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  const voiceMapping = { male: { natural: 'Puck', tegas: 'Charon', ceria: 'Fenrir', dalam: 'Orus' }, female: { natural: 'Kore', tegas: 'Aoede', ceria: 'Leda', dalam: 'Callirrhoe' } };

  const handleReset = () => {
    setDescText(''); setRefImage(null); setLang('Indonesian'); setGender('female'); setTone('natural');
    setCtaType('Keranjang Kuning (TikTok)'); setDuration('30s');
    setGeneratedScripts([]); setActiveScriptIdx(0); setEditableScript(''); setAudioUrl(''); setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setRefImage(reader.result); reader.readAsDataURL(file); } };

  const handleGenerateScript = async () => {
    if (!descText && !refImage) { setError("Mohon berikan deskripsi teks atau unggah gambar referensi."); return; }
    const isAllowed = await onGenerateAttempt(); if (!isAllowed) return;
    setIsGeneratingScript(true); setError(''); setGeneratedScripts([]); setAudioUrl('');

    try {
      const durationWordTarget = duration === '15s' ? '~30 words' : duration === '30s' ? '~60 words' : '~120 words';
      const scriptParts = [{ text: `You are an expert copywriter for short-form video ads (TikTok/Reels). Product Description: ${descText || 'See image'}. Language: ${lang}. Tone/Vibe: ${tone}. Call to Action (CTA): ${ctaType}. Duration Target: ${durationWordTarget}.\nREQUIREMENTS:\n1. Generate exactly 3 script variations. Each MUST use a DIFFERENT HOOK strategy:\n   - Type "Kontroversial": A bold, counter-intuitive, or shocking statement.\n   - Type "Emosional": Highly relatable, addressing a deep pain point or daily struggle.\n   - Type "Rasa Ingin Tahu": A secret, a hack, or building extreme curiosity.\n2. Introduce a relatable problem.\n3. Present the product as the solution.\n4. End with the specified Call to Action (${ctaType}).\n5. Spoken-word ONLY (no emojis, no speaker labels).\nReturn EXACTLY in this JSON schema: { "scripts": [ { "type": "string", "text": "string" } ] }` }];
      if (refImage) scriptParts.push({ inlineData: { mimeType: refImage.split(';')[0].split(':')[1], data: refImage.split(',')[1] } });

      const payload = { contents: [{ role: "user", parts: scriptParts }], generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { scripts: { type: "ARRAY", items: { type: "OBJECT", properties: { type: { type: "STRING" }, text: { type: "STRING" } } } } } } } };
      const scriptRes = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const parsedData = JSON.parse(scriptRes.candidates?.[0]?.content?.parts?.[0]?.text || '{"scripts":[]}');
      if (!parsedData.scripts || parsedData.scripts.length === 0) throw new Error("Gagal merumuskan variasi naskah.");
      setGeneratedScripts(parsedData.scripts); setActiveScriptIdx(0); setEditableScript(parsedData.scripts[0].text);
    } catch (err) { setError(`Terjadi kesalahan: ${err.message}`); } finally { setIsGeneratingScript(false); }
  };

  const switchScriptTab = (newIdx) => { const updatedScripts = [...generatedScripts]; updatedScripts[activeScriptIdx].text = editableScript; setGeneratedScripts(updatedScripts); setActiveScriptIdx(newIdx); setEditableScript(updatedScripts[newIdx].text); };

  const handleGenerateAudio = async () => {
    if (!editableScript.trim()) { setError("Naskah kosong! Mohon tuliskan sesuatu."); return; }
    setIsGeneratingAudio(true); setError(''); setAudioUrl(''); setAudioSpeed(1.0);
    try {
      const ttsRes = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: editableScript }] }], generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceMapping[gender][tone] } } } }, model: "gemini-2.5-flash-preview-tts" }) });
      const audioBase64 = ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioBase64) { const binaryString = atob(audioBase64); const bytes = new Uint8Array(binaryString.length); for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i); setAudioUrl(URL.createObjectURL(pcmToWav(bytes, 24000))); } 
      else throw new Error("Gagal mensintesis suara audio.");
    } catch (err) { setError(`Terjadi kesalahan sintesis suara: ${err.message}`); } finally { setIsGeneratingAudio(false); }
  };

  const handleSpeedChange = (e) => { const speed = parseFloat(e.target.value); setAudioSpeed(speed); if (audioRef.current) { audioRef.current.playbackRate = speed; } };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Script & Voice Generator Pro</h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Hasilkan 3 variasi Hook *A/B Testing*, sesuaikan CTA, dan atur ejaan suara AI.</p>
        </div>
        <button onClick={handleReset} className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition-all shadow-sm active:scale-95 ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'}`}>
          <RotateCcw size={14} /> Reset Pekerjaan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <LimitWarning generateCount={generateCount} userRole={userRole} />
          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex gap-3 items-start"><AlertCircle size={20} className="shrink-0 mt-0.5" /><p>{error}</p></div>}
          
          <div className={`border rounded-3xl p-5 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <label className={`block text-xs font-semibold mb-3 flex items-center ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Deskripsi Singkat Produk <InfoTooltip text="Tulis detail produk agar script lebih akurat."/>
            </label>
            <textarea placeholder="Contoh: Rak sepatu susun 4 warna hitam..." value={descText} onChange={(e) => setDescText(e.target.value)} className={`w-full h-24 p-4 rounded-2xl border text-sm resize-none outline-none ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300'}`} />
            <label className={`block text-xs font-semibold mt-4 mb-3 flex items-center ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Gambar Referensi (Opsional)</label>
            <div onClick={() => fileInputRef.current?.click()} className={`h-20 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
              {refImage ? <img src={refImage} className="h-full object-cover p-1 rounded-2xl" /> : <div className="flex items-center gap-2 text-slate-500 opacity-80"><Upload size={16}/><span className="text-[11px] font-bold uppercase tracking-wider">Unggah Foto Produk</span></div>}
            </div>
          </div>

          <div className={`border rounded-3xl p-5 shadow-sm grid grid-cols-2 gap-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div><label className={`block text-[11px] font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Bahasa</label><select value={lang} onChange={(e) => setLang(e.target.value)} className={`w-full border rounded-xl py-2.5 px-3 text-xs font-medium outline-none ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300'}`}><option value="Indonesian">Indonesia</option><option value="English">Inggris</option></select></div>
            <div><label className={`block text-[11px] font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Gender Suara</label><select value={gender} onChange={(e) => setGender(e.target.value)} className={`w-full border rounded-xl py-2.5 px-3 text-xs font-medium outline-none ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300'}`}><option value="female">Wanita</option><option value="male">Pria</option></select></div>
            <div><label className={`block text-[11px] font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Vokal</label><select value={tone} onChange={(e) => setTone(e.target.value)} className={`w-full border rounded-xl py-2.5 px-3 text-xs font-medium outline-none ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300'}`}><option value="natural">Natural</option><option value="ceria">Ceria</option><option value="tegas">Tegas</option><option value="dalam">Dalam</option></select></div>
            <div><label className={`block text-[11px] font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Durasi</label><select value={duration} onChange={(e) => setDuration(e.target.value)} className={`w-full border rounded-xl py-2.5 px-3 text-xs font-medium outline-none ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300'}`}><option value="15s">Cepat (~15 Detik)</option><option value="30s">Standar (~30 Detik)</option><option value="60s">Review (~60 Detik)</option></select></div>
            <div className="col-span-2 mt-1"><label className={`block text-[11px] font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Call to Action (CTA)</label><select value={ctaType} onChange={(e) => setCtaType(e.target.value)} className={`w-full border rounded-xl py-3 px-3 text-xs font-medium outline-none ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300'}`}><option value="Keranjang Kuning (TikTok)">Arahkan ke Keranjang Kuning (TikTok)</option><option value="Tas Orange (Shopee)">Arahkan ke Tas Orange (Shopee Video)</option><option value="Link di Bio (Instagram/Profil)">Arahkan ke Link di Bio Profil</option></select></div>
          </div>
          <button onClick={handleGenerateScript} disabled={isGeneratingScript || (userRole === 'trial' && generateCount >= 2)} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg transition-all active:scale-[0.98] ${(userRole === 'trial' && generateCount >= 2) ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : (isDark ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white')}`}>
            {isGeneratingScript ? <><Loader2 className="animate-spin" size={18} /> Menganalisa & Meracik Hook...</> : <><Type size={18} /> Tahap 1: Buat 3 Variasi Hook (A/B Testing)</>}
          </button>
        </div>

        <div className={`lg:col-span-7 border rounded-3xl p-6 sm:p-8 flex flex-col shadow-sm min-h-[500px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          {generatedScripts.length === 0 && !isGeneratingScript && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
               <div className={`w-24 h-24 mb-6 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'}`}><Mic size={40} className={isDark ? 'text-slate-600' : 'text-slate-300'} /></div>
               <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Studio Copywriting & Rekaman</p>
            </div>
          )}

          {isGeneratingScript && (
             <div className="flex-1 flex flex-col items-center justify-center">
               <div className="relative w-20 h-20 mb-4"><div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping"></div><div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div></div>
               <p className={`text-sm font-semibold animate-pulse ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Sedang Merancang Skrip...</p>
             </div>
          )}

          {generatedScripts.length > 0 && !isGeneratingScript && (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                 <h3 className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}><Edit size={18} className="text-purple-500"/> Editor Naskah (Pronunciation)</h3>
              </div>
              <div className={`flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                {generatedScripts.map((script, idx) => (
                   <button key={idx} onClick={() => switchScriptTab(idx)} className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${activeScriptIdx === idx ? 'bg-indigo-600 text-white' : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
                     {script.type.includes('Kontroversi') ? '🔥' : script.type.includes('Emosi') ? '❤️' : '🤫'} Hook {idx + 1}
                   </button>
                ))}
              </div>
              <div className="relative flex-1 flex flex-col min-h-[200px] mb-6">
                 <textarea value={editableScript} onChange={(e) => setEditableScript(e.target.value)} className={`flex-1 w-full p-5 rounded-2xl border text-sm resize-none outline-none leading-relaxed focus:ring-2 focus:ring-purple-500/50 ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-700'}`} />
                 <div className={`mt-3 text-[11px] flex items-center gap-1.5 font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}><Info size={14} className="shrink-0" /><p>Tip Pro: Perbaiki ejaan agar AI membacanya dengan benar (misal ubah "Skincare" menjadi "Skin-ker").</p></div>
              </div>

              {audioUrl && (
                <div className={`p-5 mb-6 rounded-2xl border flex flex-col gap-4 ${isDark ? 'bg-slate-950 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100'}`}>
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2"><span className="relative flex h-3 w-3 shrink-0"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span></span><p className="font-bold text-indigo-500 text-xs uppercase">Hasil Audio</p></div>
                    <div className="flex items-center gap-3">
                       <label className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Pacing:</label>
                       <select value={audioSpeed} onChange={handleSpeedChange} className={`border rounded-lg py-1.5 px-2 text-xs font-bold outline-none cursor-pointer ${isDark ? 'bg-slate-900 border-indigo-500/30 text-indigo-400' : 'bg-white border-indigo-200 text-indigo-600'}`}>
                         <option value={0.9}>0.9x Lambat</option><option value={1.0}>1.0x Normal</option><option value={1.2}>1.2x Cepat</option>
                       </select>
                    </div>
                  </div>
                  <audio ref={audioRef} controls src={audioUrl} className="w-full h-10 outline-none rounded-xl" />
                </div>
              )}

              <button onClick={handleGenerateAudio} disabled={isGeneratingAudio} className={`w-full mt-auto py-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg transition-all active:scale-[0.98] ${isDark ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-900/20' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200'}`}>
                {isGeneratingAudio ? <><Loader2 className="animate-spin" size={18} /> Mensintesis Audio...</> : <><AudioLines size={18} /> Tahap 2: Jadikan Voice Over Profesional</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENT: Video Pembelajaran
// ==========================================
function ToolLearningVideos({ isDark, db, firebaseUser, userRole }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', youtubeUrl: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!db || !firebaseUser) return;
    const videosRef = collection(db, 'artifacts', appId, 'public', 'data', 'learning_videos');
    const unsubscribe = onSnapshot(videosRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVideos(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setLoading(false);
    }, (err) => { setError(`Gagal memuat video: ${err.message}`); setLoading(false); });
    return () => unsubscribe();
  }, [db, firebaseUser]);

  const openModal = (video = null) => {
    if (video) { setEditId(video.id); setForm({ title: video.title, description: video.description, youtubeUrl: video.youtubeUrl || video.externalUrl || `https://www.youtube.com/watch?v=${video.youtubeId}` }); } 
    else { setEditId(null); setForm({ title: '', description: '', youtubeUrl: '' }); }
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setEditId(null); setForm({ title: '', description: '', youtubeUrl: '' }); };

  const handleSave = async (e) => {
    e.preventDefault(); if (!form.title || !form.youtubeUrl) return;
    const ytId = extractYouTubeId(form.youtubeUrl); if (!ytId) { alert("Format URL YouTube tidak valid."); return; }
    setIsSaving(true);
    try {
      if (editId) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'learning_videos', editId), { title: form.title, description: form.description, youtubeUrl: form.youtubeUrl, youtubeId: ytId, updatedAt: new Date().toISOString() }); } 
      else { await setDoc(doc(collection(db, 'artifacts', appId, 'public', 'data', 'learning_videos')), { title: form.title, description: form.description, youtubeUrl: form.youtubeUrl, youtubeId: ytId, createdAt: new Date().toISOString() }); }
      closeModal();
    } catch (err) { alert("Gagal menyimpan: " + err.message); } finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus video ini?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'learning_videos', id));
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Pusat Edukasi Afiliator</h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tonton materi teknis dan panduan bedah strategi untuk memaksimalkan komisi penjualan Anda.</p>
        </div>
        {userRole === 'admin' && (
          <button onClick={() => openModal()} className={`flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-2xl text-white transition-all shadow-lg active:scale-95 bg-indigo-600 hover:bg-indigo-700`}>
            <Plus size={18} /> Tambah Modul Video
          </button>
        )}
      </div>

      {loading ? ( <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-500" size={32} /></div> ) : videos.length === 0 ? (
        <div className={`flex flex-col items-center justify-center p-16 border-2 rounded-3xl border-dashed text-center ${isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-50 border-slate-300'}`}>
          <PlaySquare size={56} className={`mb-4 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
          <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Modul Edukasi Belum Tersedia</h3>
          <p className={`text-sm max-w-md ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{userRole === 'admin' ? 'Segera unggah materi kurikulum YouTube pertama Anda untuk membimbing para afiliator.' : 'Nantikan materi pembelajaran eksklusif yang sedang disiapkan oleh Admin.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {videos.map(video => (
            <div key={video.id} className={`flex flex-col overflow-hidden border rounded-3xl shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <a href={video.youtubeUrl || `https://www.youtube.com/watch?v=${video.youtubeId}`} target="_blank" rel="noreferrer" className="relative w-full aspect-video bg-black shrink-0 group block overflow-hidden">
                <img src={`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`} alt={video.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-40 transition-opacity duration-500" onError={(e) => { e.target.src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`; }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-red-600/90 text-white rounded-full flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-110 transition-transform duration-300 backdrop-blur-md"><Youtube size={32} className="ml-1" /></div>
                </div>
              </a>
              <div className="p-6 flex flex-col flex-1">
                <h3 className={`font-bold text-base mb-3 leading-snug line-clamp-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{video.title}</h3>
                <p className={`text-sm mb-5 line-clamp-3 flex-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{video.description}</p>
                <div className={`pt-5 mt-auto border-t flex items-center justify-between gap-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <a href={video.youtubeUrl || `https://www.youtube.com/watch?v=${video.youtubeId}`} target="_blank" rel="noreferrer" className={`flex items-center gap-2 text-xs font-bold transition-colors ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'}`}><ExternalLink size={16} /> Buka Kelas</a>
                  {userRole === 'admin' && (
                    <div className="flex gap-2">
                      <button onClick={() => openModal(video)} className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-indigo-500 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600'}`}><Edit size={16}/></button>
                      <button onClick={() => handleDelete(video.id)} className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-red-500 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600'}`}><Trash2 size={16}/></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && userRole === 'admin' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`px-8 py-5 border-b flex items-center justify-between ${isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-50'}`}>
              <h3 className={`font-bold text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}><Youtube size={24} className="text-red-500"/> {editId ? 'Edit Kurikulum Video' : 'Tambah Modul Edukasi'}</h3>
              <button onClick={closeModal} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div>
                <label className={`block text-xs font-bold mb-2 flex items-center ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Tautan YouTube Asli</label>
                <input type="url" required placeholder="https://www.youtube.com/watch?v=..." value={form.youtubeUrl} onChange={e => setForm({...form, youtubeUrl: e.target.value})} className={`w-full border rounded-2xl px-5 py-3.5 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`} />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Judul Pembelajaran</label>
                <input type="text" required placeholder="Contoh: Rahasia Algoritma TikTok" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className={`w-full border rounded-2xl px-5 py-3.5 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`} />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Keterangan / Sinopsis Singkat</label>
                <textarea required rows="4" placeholder="Di video ini, kita akan membahas teknik rahasia..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={`w-full border rounded-2xl px-5 py-4 text-sm outline-none resize-none transition-all focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`} />
              </div>
              <div className="pt-4 flex justify-end gap-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={closeModal} className={`px-6 py-3.5 text-sm font-bold rounded-2xl transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Batalkan</button>
                <button type="submit" disabled={isSaving} className="px-8 py-3.5 text-sm font-bold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-70">
                  {isSaving ? <><Loader2 size={18} className="animate-spin" /> Mengunggah...</> : 'Publikasikan Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// COMPONENT: Manage Clients (Admin Only)
// ==========================================
function ToolManageClients({ isDark, db, firebaseUser }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: '', password: '', role: 'client' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const fileInputImportRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(10);

  useEffect(() => {
    if (!window.XLSX) {
      const script = document.createElement('script'); script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; script.async = true; document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!db || !firebaseUser) return;
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'clients'), (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(c => c.role === 'client' || c.role === 'trial'));
      setLoading(false);
    }, (err) => { setError(`Gagal memuat: ${err.message}`); setLoading(false); });
    return () => unsubscribe();
  }, [db, firebaseUser]);

  const filteredClients = useMemo(() => clients.filter(c => c.username.toLowerCase().includes(searchQuery.toLowerCase()) || c.password.toLowerCase().includes(searchQuery.toLowerCase())), [clients, searchQuery]);

  const handleAdd = async (e) => {
    e.preventDefault(); const inputUsername = form.username.trim(); const inputPassword = form.password; const inputRole = form.role;
    if (!inputUsername || !inputPassword) return; setError('');
    if (clients.some(c => c.username.toLowerCase() === inputUsername.toLowerCase())) { setError('Username sudah digunakan.'); return; }
    try { 
      await setDoc(doc(collection(db, 'artifacts', appId, 'public', 'data', 'clients')), { username: inputUsername, password: inputPassword, role: inputRole, generateCount: 0, currentSessionId: null, createdAt: new Date().toISOString() }); 
      setForm({ username: '', password: '', role: 'client' }); 
      setSuccessMsg('Akses berhasil ditambahkan.'); setTimeout(() => setSuccessMsg(''), 3000); 
    } catch (err) { setError('Gagal menambah akses.'); }
  };

  const executeDelete = async (id) => {
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clients', id)); setDeletingId(null); setSuccessMsg('Berhasil dihapus.'); setTimeout(() => setSuccessMsg(''), 3000); } catch (err) { setError('Gagal menghapus.'); setDeletingId(null); }
  };

  const handleExportExcel = () => {
    if (!window.XLSX) { setError("Library Excel belum siap."); return; }
    try { const dataToExport = clients.map(c => ({ "Username": c.username, "Password": c.password, "Status": c.currentSessionId ? 'Online' : 'Offline', "Terdaftar": c.createdAt ? new Date(c.createdAt).toLocaleDateString('id-ID') : '-' })); const worksheet = window.XLSX.utils.json_to_sheet(dataToExport); const workbook = window.XLSX.utils.book_new(); window.XLSX.utils.book_append_sheet(workbook, worksheet, "Data_Client"); window.XLSX.writeFile(workbook, `Data_Client_${new Date().getTime()}.xlsx`); } catch (err) { setError('Gagal ekspor.'); }
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0]; if (!file || !window.XLSX) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result); const workbook = window.XLSX.read(data, { type: 'array' });
        const jsonData = window.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        if (jsonData.length < 2) return setError('File kosong.');
        const headers = jsonData[0].map(h => String(h).replace(/"/g, '').trim().toLowerCase());
        const userIdx = headers.findIndex(h => h.includes('user')); const passIdx = headers.findIndex(h => h.includes('pass'));
        if (userIdx === -1 || passIdx === -1) return setError('Format kolom salah.');
        let added = 0; let skipped = 0;
        for (let i = 1; i < jsonData.length; i++) {
          const r = jsonData[i]; if (!r || r.length === 0) continue;
          const u = String(r[userIdx] || '').replace(/"/g, '').trim(); const p = String(r[passIdx] || '').replace(/"/g, '').trim();
          if (!u || !p || u === 'undefined') continue;
          if (clients.some(c => c.username === u)) { skipped++; continue; }
          await setDoc(doc(collection(db, 'artifacts', appId, 'public', 'data', 'clients')), { username: u, password: p, role: 'client', currentSessionId: null, createdAt: new Date().toISOString() }); added++;
        }
        setSuccessMsg(`Import Selesai: ${added} sukses, ${skipped} duplikat.`); setTimeout(() => setSuccessMsg(''), 5000);
      } catch (err) { setError('Gagal import.'); }
      if (fileInputImportRef.current) fileInputImportRef.current.value = '';
    }; reader.readAsArrayBuffer(file);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="mb-8 flex flex-col gap-1">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Manajemen Member & Akses</h2>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Atur pendaftaran akun dan limit kuota peserta platform Anda.</p>
      </div>

      <div className={`border rounded-3xl p-8 mb-8 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}><UserPlus size={20} className="text-indigo-500"/> Tambah Akses Baru</h3>
          <div className="flex flex-wrap gap-2">
            <input type="file" ref={fileInputImportRef} hidden accept=".xlsx, .xls" onChange={handleImportExcel} />
            <button onClick={() => fileInputImportRef.current?.click()} className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 rounded-xl border transition-all active:scale-95 ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'}`}><FileUp size={16} className="text-emerald-500" /> Impor Excel</button>
            <button onClick={handleExportExcel} className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 rounded-xl border transition-all active:scale-95 ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'}`}><FileDown size={16} className="text-blue-500" /> Ekspor Data</button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4 font-medium">{error}</p>}
        {successMsg && <p className="text-emerald-500 text-sm mb-4 font-bold px-4 py-3 bg-emerald-500/10 rounded-xl inline-block border border-emerald-500/20">{successMsg}</p>}
        
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-5 items-end">
          <div className="flex-1 w-full">
            <label className={`block text-xs font-bold mb-2 flex items-center ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>Tipe Akses Member</label>
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className={`w-full border rounded-2xl px-5 py-4 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`}>
              <option value="client">Premium (Tanpa Batas)</option><option value="trial">Trial (Batas 2x Generate)</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className={`block text-xs font-bold mb-2 flex items-center ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>ID Username</label>
            <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className={`w-full border rounded-2xl px-5 py-4 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`} required placeholder="contoh: budi_afiliator" />
          </div>
          <div className="flex-1 w-full">
            <label className={`block text-xs font-bold mb-2 flex items-center ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>Kata Sandi</label>
            <input type="text" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className={`w-full border rounded-2xl px-5 py-4 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`} required placeholder="minimal 6 karakter" />
          </div>
          <button type="submit" className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 h-[52px]">Buat Akses</button>
        </form>
      </div>

      <div className={`border rounded-3xl overflow-hidden shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`px-8 py-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-5 ${isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-50'}`}>
          <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}><Users size={20} className="text-emerald-500"/> Buku Daftar Member ({filteredClients.length})</h3>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input type="text" placeholder="Pencarian spesifik..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none border transition-all ${isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-slate-300 text-slate-800 focus:border-indigo-500'}`} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`text-xs uppercase font-bold tracking-wider ${isDark ? 'bg-slate-950/50 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>
              <tr><th className="px-8 py-4">Username</th><th className="px-8 py-4">Password</th><th className="px-8 py-4">Status</th><th className="px-8 py-4 text-right">Otoritas</th></tr>
            </thead>
            <tbody>
              {loading ? ( <tr><td colSpan="4" className="text-center py-12"><Loader2 className="animate-spin mx-auto text-indigo-500" size={32}/></td></tr> ) : filteredClients.length === 0 ? ( <tr><td colSpan="4" className={`text-center py-12 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Tidak ada data member yang cocok.</td></tr> ) : (
                filteredClients.slice(0, displayLimit).map(c => (
                  <tr key={c.id} className={`border-b last:border-0 transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800/40' : 'border-slate-100 hover:bg-slate-50'}`}>
                    <td className={`px-8 py-5 font-bold flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{c.username} <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${c.role === 'trial' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'}`}>{c.role}</span></td>
                    <td className={`px-8 py-5 font-mono text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{c.password}</td>
                    <td className="px-8 py-5">{c.currentSessionId ? ( <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-500"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Terhubung</span> ) : ( <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-slate-500/10 text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-500"></span> Putus</span> )}</td>
                    <td className="px-8 py-5 text-right">
                      {deletingId === c.id ? (
                        <div className="flex items-center justify-end gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                          <button onClick={() => executeDelete(c.id)} className="px-4 py-2 bg-red-500 text-white text-[11px] font-bold rounded-xl hover:bg-red-600">Eksekusi Hapus!</button>
                          <button onClick={() => setDeletingId(null)} className={`px-4 py-2 text-[11px] font-bold rounded-xl ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>Batal</button>
                        </div>
                      ) : ( <button onClick={() => setDeletingId(c.id)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button> )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={`px-8 py-5 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-white'}`}>
          <p className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Tampil {Math.min(displayLimit, filteredClients.length)} / {filteredClients.length}</p>
          <div className="flex items-center gap-2">
            {[10, 50, 100].map((num) => (
              <button key={num} onClick={() => setDisplayLimit(num)} className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${displayLimit === num ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20' : (isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100')}`}>{num}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENT: Pengaturan Aplikasi (Admin Only)
// ==========================================
function ToolSettings({ isDark, db, appBranding }) {
  const [appName, setAppName] = useState(appBranding.appName);
  const [logoUrl, setLogoUrl] = useState(appBranding.logoUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleSave = async (e) => {
    e.preventDefault(); setIsSaving(true); setMsg({ text: '', type: '' });
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'branding'), { appName, logoUrl, updatedAt: new Date().toISOString() });
      setMsg({ text: 'Pengaturan Branding berhasil diperbarui secara global!', type: 'success' });
    } catch (err) { setMsg({ text: 'Gagal menyimpan: ' + err.message, type: 'error' }); } finally { setIsSaving(false); }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div className="mb-8 flex flex-col gap-1">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Pengaturan Aplikasi</h2>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sesuaikan identitas merek (*Branding*) sistem *White-Label* Anda di sini.</p>
      </div>

      <div className={`border rounded-3xl p-8 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-base font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}><Compass size={20} className="text-pink-500"/> Identitas Platform</h3>
        
        {msg.text && ( <div className={`p-4 mb-6 rounded-xl text-sm font-bold border ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{msg.text}</div> )}

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className={`block text-xs font-bold mb-2 flex items-center ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>Nama Perusahaan / Aplikasi</label>
            <input type="text" value={appName} onChange={e => setAppName(e.target.value)} required className={`w-full border rounded-2xl px-5 py-4 text-sm outline-none transition-all focus:ring-2 focus:ring-pink-500 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`} placeholder="Contoh: GenAffiliate Hub" />
          </div>
          <div>
            <label className={`block text-xs font-bold mb-2 flex items-center ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>URL Logo Eksternal (Opsional)</label>
            <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className={`w-full border rounded-2xl px-5 py-4 text-sm outline-none transition-all focus:ring-2 focus:ring-pink-500 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`} placeholder="https://..." />
            {logoUrl && <div className="mt-4 p-4 rounded-2xl bg-black/10 border border-slate-200 dark:border-slate-800 inline-block"><img src={logoUrl} alt="Preview" className="h-12 w-auto object-contain" onError={(e) => { e.target.style.display = 'none'; setMsg({ text: 'URL Gambar tidak dapat dimuat. Pastikan URL valid.', type: 'error' }); }} /></div>}
          </div>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <button type="submit" disabled={isSaving} className="px-8 py-4 bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-pink-500/20 active:scale-95 flex items-center gap-2">
              {isSaving ? <><Loader2 size={18} className="animate-spin" /> Menyimpan...</> : 'Terapkan Branding Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// LOGIN SCREEN COMPONENT
// ==========================================
function LoginScreen({ onLogin, initError, appBranding }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    const res = await onLogin(username, password);
    if (!res.success) setError(res.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center flex flex-col justify-center items-center p-6 selection:bg-indigo-500/30">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></div>
      
      <div className="w-full max-w-[400px] relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10">
          {appBranding.logoUrl ? (
            <img src={appBranding.logoUrl} alt="Logo" className="h-20 max-w-[200px] mx-auto object-contain mb-6 drop-shadow-2xl" />
          ) : (
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-6">
              <Wand2 size={40} className="text-white" />
            </div>
          )}
          <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-lg">{appBranding.appName}</h1>
          <p className="text-slate-300 font-medium text-sm mt-3 tracking-wide">Autentikasi Keamanan Sistem</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 sm:p-10 shadow-2xl">
          {initError && <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-orange-500 text-sm font-bold text-center flex gap-2"><AlertCircle className="shrink-0"/> {initError}</div>}
          {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold text-center flex gap-2"><AlertCircle className="shrink-0"/> {error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">ID Username</label>
              <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" placeholder="masukan username" />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Kata Sandi</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-2xl px-5 py-4 pr-12 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" placeholder="masukan password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-xl transition-all focus:outline-none active:scale-95" title={showPassword ? "Sembunyikan Sandi" : "Lihat Sandi"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-black tracking-wide shadow-xl shadow-indigo-500/20 transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-70 h-[56px]">{loading ? <><Loader2 size={20} className="animate-spin" /> Verifikasi...</> : 'Login'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN APPLICATION COMPONENT (Routing & Auth)
// ==========================================
export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Auth State
  const [db, setDb] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const timeBombRef = useRef(null);
  
  // App Settings (Branding) State
  const [appBranding, setAppBranding] = useState({ appName: 'GenAffiliate Hub', logoUrl: '' });

  const [activeMenu, setActiveMenu] = useState('home');

  useEffect(() => {
    let unsubscribeAuth = () => {};

    const firebaseConfig = {
  apiKey: "AIzaSyANAugZauhUtlmi_53l5zq76g-1kPuM9sE",
  authDomain: "genaffiliate-app.firebaseapp.com",
  projectId: "genaffiliate-app",
  storageBucket: "genaffiliate-app.firebasestorage.app",
  messagingSenderId: "774665896709",
  appId: "1:774665896709:web:0733c57fd7658b4dea6d6c"
};
        if (!firebaseConfig) { setInitError("Menunggu Konfigurasi Sistem. Hubungi Administrator."); setIsInitializing(false); return; }

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const firestoreDb = getFirestore(app);
        setDb(firestoreDb);

        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { await signInWithCustomToken(auth, __initial_auth_token).catch(e => console.error(e)); } 
        else { await signInAnonymously(auth).catch(e => console.error(e)); }

        unsubscribeAuth = onAuthStateChanged(auth, (user) => { setFirebaseUser(user); setIsInitializing(false); });
      } catch (err) { setInitError(err.message); setIsInitializing(false); }
    };
    initFirebase();
    return () => { unsubscribeAuth(); };
  }, []);

  useEffect(() => {
    if (!db || !firebaseUser) return;
    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'branding');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) { setAppBranding({ appName: docSnap.data().appName || 'GenAffiliate Hub', logoUrl: docSnap.data().logoUrl || '' }); }
    });
    return () => unsubscribe();
  }, [db, firebaseUser]);

  useEffect(() => {
    if (!loggedInUser || (loggedInUser.role !== 'client' && loggedInUser.role !== 'trial') || !db) return;
    const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'clients', loggedInUser.id);
    const unsubscribe = onSnapshot(userDocRef, (snap) => {
      if (!snap.exists()) { handleForcedLogout("Akun telah dihapus oleh sistem keamanan."); return; }
      const data = snap.data(); 
      if (data.currentSessionId && data.currentSessionId !== loggedInUser.sessionId) { handleForcedLogout("Akses terputus! Akun ini digunakan di perangkat lain."); return; }
      
      if (data.role === 'trial') {
         setLoggedInUser(prev => ({...prev, generateCount: data.generateCount || 0, limitReachedAt: data.limitReachedAt}));
         if (data.limitReachedAt) {
            const limitTime = new Date(data.limitReachedAt).getTime();
            const now = new Date().getTime();
            const timeLeft = (5 * 60 * 1000) - (now - limitTime);
            
            if (timeLeft <= 0) { executeTimeBomb(userDocRef); } 
            else {
               if (timeBombRef.current) clearTimeout(timeBombRef.current);
               timeBombRef.current = setTimeout(() => executeTimeBomb(userDocRef), timeLeft);
            }
         }
      }
    });
    return () => { unsubscribe(); if (timeBombRef.current) clearTimeout(timeBombRef.current); };
  }, [loggedInUser?.id, db]);

  const executeTimeBomb = async (userDocRef) => {
     try { await deleteDoc(userDocRef); } catch(e){}
     handleForcedLogout("Waktu 5 Menit Berakhir. Data akun Trial Anda telah otomatis dihapus oleh sistem.");
  }

  const handleForcedLogout = (message) => { setLoggedInUser(null); alert(message); };

  const handleGenerateAttempt = async () => {
    if (loggedInUser.role !== 'trial') return true;
    if (!db) return false;
    
    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'clients', loggedInUser.id);
    if (loggedInUser.generateCount >= 2) return false; 

    const newCount = (loggedInUser.generateCount || 0) + 1;
    const updates = { generateCount: newCount };
    if (newCount >= 2) { updates.limitReachedAt = new Date().toISOString(); }
    await updateDoc(userRef, updates);
    return true; 
  };

  const handleLogin = async (username, password) => {
    const trimmedUser = username.trim();
    if (trimmedUser === 'admin' && password === 'bayudhikap123') {
      setLoggedInUser({ id: 'admin-id', role: 'admin', username: 'Administrator' }); setActiveMenu('home'); return { success: true };
    }
    if (!db || !firebaseUser) return { success: false, message: 'Menunggu koneksi server aman. Muat ulang halaman.' };
    try {
      const snapshot = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'clients'));
      if (snapshot.empty) return { success: false, message: 'Identitas tidak ditemukan dalam basis data.' };
      const client = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).find(c => c.username.toLowerCase() === trimmedUser.toLowerCase() && c.password === password);
      
      if (client) {
        let updatePayload = {};
        if (client.role === 'trial') {
          let deviceId = localStorage.getItem('GenAffiliate_DeviceId');
          if (!deviceId) { deviceId = crypto.randomUUID(); localStorage.setItem('GenAffiliate_DeviceId', deviceId); }
          if (client.boundDeviceId && client.boundDeviceId !== deviceId) { return { success: false, message: 'Akses Ditolak: Akun Trial ini sudah terikat permanen dengan perangkat pertamanya.' }; }
          if (!client.boundDeviceId) { updatePayload.boundDeviceId = deviceId; }
        }
        
        const newSessionId = crypto.randomUUID();
        updatePayload.currentSessionId = newSessionId;
        
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clients', client.id), updatePayload);
        setLoggedInUser({ id: client.id, role: client.role, username: client.username, sessionId: newSessionId, generateCount: client.generateCount || 0, limitReachedAt: client.limitReachedAt });
        setActiveMenu('home'); return { success: true };
      }
    } catch (err) { return { success: false, message: `Server Timeout: ${err.message}` }; }
    return { success: false, message: 'Username atau Password salah.' };
  };

  const handleLogout = async () => {
    if (loggedInUser && loggedInUser.role === 'client' && db) { try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clients', loggedInUser.id), { currentSessionId: null }); } catch(e) {} }
    setLoggedInUser(null);
  };

  if (isInitializing) {
    return <div className="min-h-screen bg-slate-950 flex flex-col gap-6 items-center justify-center"><div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div><p className="text-slate-400 font-bold tracking-widest uppercase text-xs animate-pulse">Menghubungkan ke Jaringan...</p></div>;
  }

  if (!loggedInUser) {
    return <LoginScreen onLogin={handleLogin} initError={initError} appBranding={appBranding} />;
  }

  const NavItem = ({ id, icon: Icon, label }) => (
    <button onClick={() => setActiveMenu(id)} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${activeMenu === id ? (isDark ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20 text-white translate-x-1' : 'bg-indigo-600 shadow-xl shadow-indigo-200 text-white translate-x-1') : (isDark ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100/80')}`}>
      <Icon size={18} /> {label}
    </button>
  );

  const NavCategory = ({ title }) => (
    <p className={`px-4 mt-8 mb-3 text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{title}</p>
  );

  return (
    <div className={`min-h-screen flex font-sans selection:bg-indigo-500/30 transition-colors duration-500 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r transition-transform duration-300 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${isDark ? 'bg-slate-950/80 backdrop-blur-2xl border-slate-800/50' : 'bg-white/80 backdrop-blur-2xl border-slate-200/50'}`}>
        <div className={`h-20 flex items-center px-8 border-b shrink-0 ${isDark ? 'border-slate-800/50' : 'border-slate-200/50'}`}>
          {appBranding.logoUrl ? (
            <img src={appBranding.logoUrl} alt="Logo" className="h-8 max-w-[40px] object-contain mr-3" />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center mr-3 shadow-lg"><Wand2 size={20} className="text-white" /></div>
          )}
          <h1 className={`font-black text-lg tracking-tight truncate ${isDark ? 'text-white' : 'text-indigo-950'}`}>{appBranding.appName}</h1>
        </div>

        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          <NavItem id="home" icon={LayoutDashboard} label="Beranda Utama" />
          
          <NavCategory title="Riset & Perencanaan" />
          <NavItem id="product-research" icon={ShoppingBag} label="Riset Produk Tren" />

          <NavCategory title="Produksi Konten AI" />
          <NavItem id="generator-affiliate" icon={ImagePlus} label="Visual Generator" />
          <NavItem id="script-voice" icon={Mic} label="Script & Voice Over" />
          
          <NavCategory title="Optimasi Publikasi" />
          <NavItem id="seo" icon={Hash} label="Optimasi Konten" />
          
          {loggedInUser.role !== 'trial' && (
            <>
              <NavCategory title="Materi Edukasi" />
              <NavItem id="learning-videos" icon={PlaySquare} label="Video Pembelajaran" />
            </>
          )}

          {loggedInUser.role === 'admin' && (
            <>
              <NavCategory title="Manajemen Admin" />
              <NavItem id="manage-client" icon={Users} label="Member & Akses" />
              <NavItem id="settings" icon={Settings} label="Pengaturan Aplikasi" />
            </>
          )}
        </div>

        <div className={`p-5 border-t mt-auto ${isDark ? 'border-slate-800/50' : 'border-slate-200/50'}`}>
           <div className={`flex items-center gap-3 px-3 py-3 rounded-2xl mb-3 border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-indigo-50 border-indigo-100/50'}`}>
             <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-white shadow-md uppercase">{loggedInUser.username.substring(0,1)}</div>
             <div className="flex-1 overflow-hidden">
               <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-indigo-950'}`}>{loggedInUser.username}</p>
               <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${loggedInUser.role === 'admin' ? 'bg-pink-500' : 'bg-emerald-500'}`}></div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${loggedInUser.role === 'admin' ? 'text-pink-500' : 'text-emerald-500'}`}>{loggedInUser.role}</p>
               </div>
             </div>
           </div>
           <button onClick={handleLogout} className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${isDark ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
             <LogOut size={16} /> Keluar Sistem
           </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 lg:pl-72`}>
        <header className={`h-20 flex items-center justify-between px-6 sm:px-10 border-b sticky top-0 z-30 transition-colors duration-500 ${isDark ? 'border-slate-800/50 bg-slate-950/70 backdrop-blur-xl' : 'border-slate-200/50 bg-white/70 backdrop-blur-xl'}`}>
          <div className="flex items-center gap-5">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`lg:hidden p-2.5 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}><Menu size={22} /></button>
            <div>
               <h2 className={`text-base font-black tracking-wide ${isDark ? 'text-white' : 'text-indigo-950'}`}>
                 {activeMenu === 'home' ? 'Area Kerja' : 
                  activeMenu === 'product-research' ? 'Intelijen Riset Produk' :
                  activeMenu === 'generator-affiliate' ? 'Produksi Visual' : 
                  activeMenu === 'script-voice' ? 'Produksi Audio' :
                  activeMenu === 'seo' ? 'Optimasi Konten' :
                  activeMenu === 'learning-videos' ? 'Pusat Edukasi' :
                  activeMenu === 'settings' ? 'Pengaturan Sistem' : 'Manajemen Member'}
               </h2>
               <p className={`hidden sm:block text-[11px] font-medium tracking-wide mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Mari efisiensikan waktu dan cetak konversi tinggi</p>
            </div>
          </div>
          
          <button onClick={() => setIsDark(!isDark)} className={`p-3 rounded-2xl transition-all shadow-sm active:scale-90 ${isDark ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white border text-slate-600 hover:bg-slate-50'}`} title="Ubah Mode Tema">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <main className="p-6 sm:p-10 overflow-y-auto flex-1 custom-scrollbar">
          {activeMenu === 'home' && <DashboardHome isDark={isDark} username={loggedInUser.username} setActiveMenu={setActiveMenu} />}
          {activeMenu === 'product-research' && <ToolProductResearch isDark={isDark} userRole={loggedInUser.role} generateCount={loggedInUser.generateCount} onGenerateAttempt={handleGenerateAttempt} />}
          {activeMenu === 'generator-affiliate' && <ToolGeneratorAffiliate isDark={isDark} userRole={loggedInUser.role} generateCount={loggedInUser.generateCount} onGenerateAttempt={handleGenerateAttempt} />}
          {activeMenu === 'script-voice' && <ToolScriptVoice isDark={isDark} userRole={loggedInUser.role} generateCount={loggedInUser.generateCount} onGenerateAttempt={handleGenerateAttempt} />}
          {activeMenu === 'seo' && <ToolSEOGenerator isDark={isDark} userRole={loggedInUser.role} generateCount={loggedInUser.generateCount} onGenerateAttempt={handleGenerateAttempt} />}
          {activeMenu === 'learning-videos' && loggedInUser.role !== 'trial' && <ToolLearningVideos isDark={isDark} db={db} firebaseUser={firebaseUser} userRole={loggedInUser.role} />}
          {activeMenu === 'manage-client' && loggedInUser.role === 'admin' && <ToolManageClients isDark={isDark} db={db} firebaseUser={firebaseUser} />}
          {activeMenu === 'settings' && loggedInUser.role === 'admin' && <ToolSettings isDark={isDark} db={db} appBranding={appBranding} />}
        </main>
        
        <footer className={`py-6 text-center text-[10px] font-bold uppercase tracking-[0.2em] mt-auto ${isDark ? 'text-slate-600 bg-slate-950' : 'text-slate-400 bg-slate-50'}`}>
          @2026 {appBranding.appName}
        </footer>
      </div>

      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"></div>}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #64748b80; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `}} />
    </div>
  );
}