import React, { useEffect, useState } from 'react';
import { ACProduct, QuoteProduct } from './types';
import { SearchView } from './components/SearchView';
import { QuoteView } from './components/QuoteView';
import type { AppLanguage } from './i18n';

interface AppVersionInfo {
  code: string;
  date: string;
  generatedAt: string;
}

export default function App() {
  const [currentView, setCurrentView] = useState<'search' | 'quote'>('search');
  const [selectedProducts, setSelectedProducts] = useState<QuoteProduct[]>([]);
  const [products, setProducts] = useState<ACProduct[]>([]);
  const [language, setLanguage] = useState<AppLanguage>('zh');
  const [versionInfo, setVersionInfo] = useState<AppVersionInfo | null>(null);
  const [showVersionToast, setShowVersionToast] = useState(false);

  const [quoteKey, setQuoteKey] = useState(0);

  const handleToggleProduct = (product: ACProduct, action?: 'add' | 'remove') => {
    setSelectedProducts(prev => {
      const isMatch = (p: QuoteProduct) => p.originalId === product.id || p.id === product.id;
      if (action === 'remove') {
        return prev.filter(p => !isMatch(p));
      }
      
      const exists = prev.find(isMatch);
      if (exists && action !== 'add') {
        return prev.filter(p => !isMatch(p));
      } else {
        const newId = exists ? `${product.id}-${Math.random().toString(36).substr(2, 5)}` : product.id;
        return [...prev, { ...product, id: newId, originalId: product.id, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (id: string, diff: number) => {
    setSelectedProducts(prev => prev.map(p => {
      if (p.id === id) {
        const newQty = Math.max(1, p.quantity + diff);
        return { ...p, quantity: newQty };
      }
      return p;
    }));
  };

  const handleRemoveProduct = (id: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleReorderProducts = (nextProducts: QuoteProduct[]) => {
    setSelectedProducts(nextProducts);
  };

  const handleNavigateBack = (keepDetails: boolean) => {
    setCurrentView('search');
    if (!keepDetails) {
      setSelectedProducts([]);
      setQuoteKey(k => k + 1);
    }
  };

  useEffect(() => {
    const loadVersionInfo = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}version.json`);
        if (!response.ok) return;
        const latestVersion = await response.json() as AppVersionInfo;
        setVersionInfo(latestVersion);

        const storedVersionRaw = localStorage.getItem('app-version-code');
        const storedVersionDate = localStorage.getItem('app-version-date');

        if (storedVersionRaw && storedVersionDate) {
          const isChanged = storedVersionRaw !== latestVersion.code || storedVersionDate !== latestVersion.date;
          if (isChanged) {
            setShowVersionToast(true);
            window.setTimeout(() => setShowVersionToast(false), 3000);
          }
        }

        localStorage.setItem('app-version-code', latestVersion.code);
        localStorage.setItem('app-version-date', latestVersion.date);
      } catch (error) {
        console.error('Failed to load app version info:', error);
      }
    };

    loadVersionInfo();
  }, []);

  return (
    <div className="h-screen w-full font-sans text-[#E2E8F0] bg-[#080d1e] overflow-auto flex flex-col relative selection:bg-[#C5A059]/30">
      {/* Background Gradients and Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#19274e]/40 via-[#080d1e] to-[#050813]"></div>
        
        {/* Subtle Gold Frame */}
        <div className="absolute inset-4 border border-[#D4AF37]/10 rounded-xl"></div>
        <div className="absolute inset-[18px] border border-[#D4AF37]/5 rounded-lg"></div>

        {/* Decorative Sparkles (Top Left & Top Right) */}
        <svg className="absolute top-12 left-1/4 w-6 h-6 text-[#D4AF37]/40 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L13.5 8.5L22 10L13.5 11.5L12 20L10.5 11.5L2 10L10.5 8.5L12 0Z" />
        </svg>
        <svg className="absolute top-24 right-1/4 w-4 h-4 text-[#D4AF37]/30 animate-pulse delay-75" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L13.5 8.5L22 10L13.5 11.5L12 20L10.5 11.5L2 10L10.5 8.5L12 0Z" />
        </svg>
        <svg className="absolute top-1/3 left-12 w-3 h-3 text-[#D4AF37]/20 animate-pulse delay-150" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L13.5 8.5L22 10L13.5 11.5L12 20L10.5 11.5L2 10L10.5 8.5L12 0Z" />
        </svg>

        {/* Blossom Accents (Abstract Shapes) */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-radial from-pink-500/10 via-pink-300/5 to-transparent rounded-full blur-3xl mix-blend-screen"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-radial from-[#D4AF37]/10 via-[#D4AF37]/5 to-transparent rounded-full blur-3xl mix-blend-screen"></div>
      </div>

      {showVersionToast && versionInfo && (
        <div className="fixed bottom-4 left-4 z-[60] rounded-lg border border-[#D4AF37]/40 bg-[#0B101E]/95 px-4 py-3 text-sm text-[#E8D099] shadow-lg backdrop-blur-md animate-in fade-in">
          <div className="font-semibold">發現新版本</div>
          <div className="text-xs text-[#D4AF37]/80 mt-1">push 日期：{versionInfo.date}</div>
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        <div style={{ display: currentView === 'search' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
          <SearchView 
            products={products}
            setProducts={setProducts}
            selectedProducts={selectedProducts} 
            onToggleProduct={handleToggleProduct}
            onNavigateToQuote={() => setCurrentView('quote')}
            language={language}
            onToggleLanguage={() => setLanguage(prev => prev === 'zh' ? 'fr' : 'zh')}
          />
        </div>
        <div style={{ display: currentView === 'quote' ? 'flex' : 'none', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
          <QuoteView 
            key={quoteKey}
            products={selectedProducts}
            onUpdateProductQuantity={handleUpdateQuantity}
            onRemoveProduct={handleRemoveProduct}
            onReorderProducts={handleReorderProducts}
            onNavigateBack={handleNavigateBack}
            language={language}
            onToggleLanguage={() => setLanguage(prev => prev === 'zh' ? 'fr' : 'zh')}
          />
        </div>
      </div>
    </div>
  );
}
