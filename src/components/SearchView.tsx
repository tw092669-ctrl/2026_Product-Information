import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Info, LayoutDashboard, Layers, Link as LinkIcon, Download, X, Sun, Snowflake, Copy } from 'lucide-react';
import Papa from 'papaparse';
import { ACProduct, ACMode, ACType } from '../types';
import { cn, getBrandColor, getBrandDisplayName } from '../utils';
import { uiText, type AppLanguage } from '../i18n';

const DEFAULT_GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1_-nf2oUtNDKDZ60ad4BDDpRK9l7U0TQmt9a_It6urok/edit?usp=drive_link';

interface SearchViewProps {
  products: ACProduct[];
  setProducts: React.Dispatch<React.SetStateAction<ACProduct[]>>;
  selectedProducts: ACProduct[];
  onToggleProduct: (product: ACProduct, action?: 'add' | 'remove') => void;
  onNavigateToQuote: () => void;
  language: AppLanguage;
  onToggleLanguage: () => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  products,
  setProducts,
  selectedProducts,
  onToggleProduct,
  onNavigateToQuote,
  language,
  onToggleLanguage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [acMode, setAcMode] = useState<ACMode>('整組');
  const [selectedBrand, setSelectedBrand] = useState<string>('全部');
  const [selectedType, setSelectedType] = useState<string>('全部');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('全部');
  const t = uiText[language];
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [isSimplified, setIsSimplified] = useState(false);
  const [duplicatePromptProduct, setDuplicatePromptProduct] = useState<ACProduct | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copiedProductName, setCopiedProductName] = useState<string | null>(null);

  const availableBrands = useMemo(() => {
    return Array.from(new Set(products.map(p => getBrandDisplayName(p.brand)))).sort();
  }, [products]);

  const availableEnvironments = useMemo(() => {
    return Array.from(new Set(products.map(p => p.environment).filter((e): e is string => !!e))).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Filter by Search Term
      const matchesSearch = 
        product.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
        product.brand.includes(searchTerm) ||
        (product.type || '').includes(searchTerm);
      
      if (!matchesSearch) return false;

      // Filter by Brand
      if (selectedBrand !== '全部' && getBrandDisplayName(product.brand) !== selectedBrand) return false;

      // Filter by AC Mode (多聯 vs 整組)
      const isMulti = product.type?.includes('多聯');
      if (acMode === '多聯' && !isMulti) return false;
      if (acMode === '整組' && isMulti) return false;

      // Filter by Type
      if (selectedType !== '全部' && product.type !== selectedType) return false;

      // Filter by Environment
      if (selectedEnvironment !== '全部' && product.environment !== selectedEnvironment) return false;

      return true;
    });
  }, [products, searchTerm, acMode, selectedBrand, selectedType, selectedEnvironment]);

  const handleModeChange = (mode: ACMode) => {
    setAcMode(mode);
    setSelectedType('全部'); // Reset sub-type when mode changes
  };

  const currentLabel = language === 'zh' ? '中文' : 'Français';

  const handleCopyProductName = async (product: ACProduct, event: React.MouseEvent) => {
    event.stopPropagation();
    const textToCopy = product.model;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedProductName(textToCopy);
      window.setTimeout(() => setCopiedProductName(null), 1200);
    } catch (error) {
      console.error('Copy failed', error);
    }
  };

  // Auto-load Google Sheets on component mount
  useEffect(() => {
    const autoLoadUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL || DEFAULT_GOOGLE_SHEETS_URL;
    if (autoLoadUrl) {
      setSheetUrl(autoLoadUrl);
      setIsLoadingProducts(true);
      setLoadError(null);

      const loadProducts = async () => {
        let csvUrl = autoLoadUrl;
        
        // Convert google sheet URL to CSV export
        if (autoLoadUrl.includes('/edit')) {
          csvUrl = autoLoadUrl.replace(/\/edit.*$/, '/export?format=csv');
        }

        try {
          Papa.parse(csvUrl, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              const parsedProducts: ACProduct[] = results.data.map((row: any, index) => {
                return {
                  id: `imported-${index}`,
                  model: row['產品名稱'] || row['型號'] || '',
                  brand: row['品牌'] || '',
                  type: row['樣式'] || row['種類'] || '整組',
                  kind: row['種類'] || '',
                  pipeSize: row['管徑'] || '',
                  environment: row['環境'] || '',
                  indoorDimensions: row['室內機尺寸'] || '',
                  outdoorDimensions: row['室外機尺寸'] || '',
                  price: parseInt(row['價格'], 10) || 0,
                  note: row['備註'] || '',
                };
              }).filter(p => p.model);

              if (parsedProducts.length > 0) {
                setProducts(parsedProducts);
                setIsLoadingProducts(false);
                console.log(`✓ Auto-loaded ${parsedProducts.length} products from Google Sheets`);
              } else {
                setProducts([]);
                setIsLoadingProducts(false);
                setLoadError('無法從試算表讀取產品資料。');
              }
            },
            error: (err) => {
              console.error('Auto-load failed:', err);
              setProducts([]);
              setIsLoadingProducts(false);
              setLoadError('無法讀取雲端試算表，請確認網址可存取。');
            }
          });
        } catch (e) {
          console.error('Auto-load error:', e);
          setProducts([]);
          setIsLoadingProducts(false);
          setLoadError('無法讀取雲端試算表，請確認網址可存取。');
        }
      };
      
      loadProducts();
    } else {
      setProducts([]);
      setIsLoadingProducts(false);
      setLoadError('尚未設定可用的試算表來源。');
    }
  }, []);

  const handleImport = async () => {
    if (!sheetUrl) return;
    setImportLoading(true);
    let csvUrl = sheetUrl;
    
    // Convert common google sheet urls to csv export
    if (sheetUrl.includes('/edit')) {
      csvUrl = sheetUrl.replace(/\/edit.*$/, '/export?format=csv');
    }

    try {
      Papa.parse(csvUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedProducts: ACProduct[] = results.data.map((row: any, index) => {
            return {
              id: `imported-${index}`,
              model: row['產品名稱'] || row['型號'] || '',
              brand: row['品牌'] || '',
              type: row['樣式'] || row['種類'] || '整組',
              kind: row['種類'] || '',
              pipeSize: row['管徑'] || '',
              environment: row['環境'] || '',
              indoorDimensions: row['室內機尺寸'] || '',
              outdoorDimensions: row['室外機尺寸'] || '',
              price: parseInt(row['價格'], 10) || 0,
              note: row['備註'] || '',
            };
          }).filter(p => p.model); // Filter out rows without a model name

          if (parsedProducts.length > 0) {
            setProducts(parsedProducts);
            setShowImportDialog(false);
            setSheetUrl('');
            setSelectedBrand('全部');
            setSelectedType('全部');
          } else {
            alert('無法解析資料，請確認試算表格式包含：「產品名稱、品牌、樣式、價格」等欄位。');
          }
        },
        error: (err) => {
          console.error(err);
          alert('匯入失敗，請確認網址是否正確且是公開的試算表。');
        }
      });
    } catch (e) {
      console.error(e);
      alert('發生錯誤。');
    } finally {
      setImportLoading(false);
    }
  };

  const currentAvailableTypes = acMode === '整組' 
    ? Array.from(new Set(products.filter(p => !p.type?.includes('多聯')).map(p => p.type || '未分類')))
    : Array.from(new Set(products.filter(p => p.type?.includes('多聯')).map(p => p.type || '未分類')));

  return (
    <div className="flex flex-col h-full bg-[#0F1115]">
      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1A202C] border border-[#2D3748] rounded-xl shadow-xl w-full max-w-lg p-6 relative">
            <button onClick={() => setShowImportDialog(false)} className="absolute right-4 top-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
              <Download className="w-5 h-5 text-blue-400" />
              {t.importDialogTitle}
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              {t.importDialogDescription}<br />
              <span className="text-gray-300 font-mono text-xs bg-[#2D3748] px-1 py-0.5 rounded">產品名稱</span>, 
              <span className="text-gray-300 font-mono text-xs bg-[#2D3748] px-1 py-0.5 rounded mx-1">品牌</span>, 
              <span className="text-gray-300 font-mono text-xs bg-[#2D3748] px-1 py-0.5 rounded mx-1">樣式</span>, 
              <span className="text-gray-300 font-mono text-xs bg-[#2D3748] px-1 py-0.5 rounded mx-1">管徑</span>, 
              <span className="text-gray-300 font-mono text-xs bg-[#2D3748] px-1 py-0.5 rounded mx-1">價格</span> 等等。<br/>
              如果連結有誤，試算表必須設定為「知道連結的人皆可查看」。
            </p>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                className="w-full px-3 py-2 bg-[#2D3748] border border-[#4A5568] focus:border-blue-500 rounded-lg text-[#E2E8F0] text-sm focus:outline-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button 
                  onClick={() => setShowImportDialog(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  {t.importDialogCancel}
                </button>
                <button 
                  onClick={handleImport}
                  disabled={!sheetUrl || importLoading}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {importLoading ? t.importDialogLoading : t.importDialogConfirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header / Search Controls */}
      <div className="bg-[#0B101E]/60 backdrop-blur-xl px-6 py-5 border-b border-[#D4AF37]/20 shadow-lg z-10 sticky top-0 shrink-0">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Top Elegant Branding */}
          <div className="flex flex-col items-center justify-center space-y-1 mb-2">
             <h2 className="font-serif italic text-sm text-[#D4AF37]/60 tracking-widest">Our Delicate Collection, Exclusive Choices</h2>
             <h1 className="flex items-center gap-2 text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#f1e5ac] to-[#D4AF37] tracking-wider uppercase drop-shadow-md">
                {t.appTitle} <span className="text-base lowercase tracking-normal text-[#D4AF37]/80">{t.version}</span>
             </h1>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowImportDialog(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#151B2E] hover:bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-md transition-all text-[#D4AF37]/70 hover:text-[#D4AF37]"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                {t.importSpreadsheet}
              </button>
              <button
                onClick={onToggleLanguage}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#151B2E] hover:bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-md transition-all text-[#D4AF37]/70 hover:text-[#D4AF37]"
              >
                {t.switchLanguage} · {currentLabel}
              </button>
              <button
                onClick={() => setIsSimplified(!isSimplified)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md transition-all whitespace-nowrap",
                  isSimplified 
                    ? "bg-[#D4AF37]/20 border-[#D4AF37]/60 text-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.2)]" 
                    : "bg-[#151B2E] border-[#D4AF37]/30 text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10"
                )}
              >
                {isSimplified ? t.fullMode : t.simplifiedMode}
              </button>
            </div>
            
            <div className="relative w-full md:w-80 group">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-[#D4AF37]/30 rounded-md bg-[#151B2E] text-sm text-slate-200 placeholder-[#D4AF37]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-[#D4AF37]/50 absolute left-3 top-2.5 group-focus-within:text-[#D4AF37] transition-colors" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-semibold text-[#D4AF37]/70 uppercase tracking-widest whitespace-nowrap">{t.brand}</span>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <button
                  onClick={() => setSelectedBrand('全部')}
                  className={cn(
                    "px-3 py-1.5 text-xs md:text-sm font-medium rounded-full transition-all duration-300 border",
                    selectedBrand === '全部'
                      ? "bg-gradient-to-r from-[#D4AF37] to-[#e6ca7b] text-[#0B101E] shadow-sm font-bold border-[#D4AF37]"
                      : "bg-[#151B2E] text-[#D4AF37]/70 border-[#D4AF37]/30 hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5"
                  )}
                >
                  {t.all}
                </button>
                {availableBrands.map(brand => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    className={cn(
                      "px-3 py-1.5 text-xs md:text-sm font-medium rounded-full transition-all duration-300",
                      selectedBrand === brand
                        ? cn(getBrandColor(brand), "shadow-sm font-bold ring-2 ring-offset-1 ring-offset-[#0B101E]")
                        : cn(getBrandColor(brand), "opacity-70 hover:opacity-100")
                    )}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 bg-[#0A0E1A]/80 p-2 md:p-3 rounded-lg border border-[#D4AF37]/20 w-full shadow-inner ring-1 ring-white/5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[#D4AF37]/70 uppercase tracking-widest">{t.type}</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedType('全部')}
                    className={cn(
                      "px-3 py-1.5 text-xs md:text-sm font-medium rounded-full transition-all duration-300 border",
                      selectedType === '全部'
                        ? "bg-gradient-to-r from-[#D4AF37] to-[#e6ca7b] text-[#0B101E] shadow-sm font-bold border-[#D4AF37]"
                        : "bg-[#151B2E] text-[#D4AF37]/70 border-[#D4AF37]/30 hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5"
                    )}
                  >
                    {t.allModels}
                  </button>
                  {currentAvailableTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        "px-3 py-1.5 text-xs md:text-sm font-medium rounded-full transition-all duration-300 border",
                        selectedType === type
                          ? "bg-[#D4AF37] text-[#0B101E] shadow-sm font-bold border-[#D4AF37]"
                          : "bg-[#151B2E] text-[#D4AF37]/70 border-[#D4AF37]/30 hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-nowrap items-center gap-2 md:gap-4">
                {/* Mode Selection */}
                <div className="flex items-center gap-2 border-r border-[#D4AF37]/20 pr-2 md:pr-4 shrink-0">
                  <span className="hidden md:inline text-xs font-semibold text-[#D4AF37]/70 uppercase tracking-widest">{t.type}</span>
                  <div className="flex p-0.5 bg-[#151B2E] rounded-md border border-[#D4AF37]/10">
                    {(['整組', '多聯'] as ACMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => handleModeChange(mode)}
                        className={cn(
                          "px-2 md:px-3 py-1 text-xs md:text-sm font-medium rounded transition-all shadow-none duration-300",
                          acMode === mode ? "bg-gradient-to-r from-[#D4AF37] to-[#e6ca7b] text-[#0B101E] shadow-sm font-bold" : "text-[#D4AF37]/60 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5"
                        )}
                      >
                        {mode === '整組' ? <LayoutDashboard className="w-3 md:w-3.5 h-3 md:h-3.5 inline-block mr-1 align-text-bottom" /> : <Layers className="w-3 md:w-3.5 h-3 md:h-3.5 inline-block mr-1 align-text-bottom" />}
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Environment Filter */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <label className="hidden md:inline text-xs font-semibold text-[#D4AF37]/70 uppercase tracking-widest whitespace-nowrap shrink-0">{t.environment}</label>
                  <select 
                    value={selectedEnvironment} 
                    onChange={e => setSelectedEnvironment(e.target.value)}
                    className="block w-full min-w-0 md:w-28 px-1 md:px-2 py-1.5 border border-[#D4AF37]/30 bg-[#151B2E] text-slate-200 rounded-md focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 transition-colors text-xs md:text-sm truncate"
                  >
                    <option value="全部">{t.all}</option>
                    {availableEnvironments.map(env => (
                      <option key={env} value={env}>{env}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto flex-1 flex flex-col bg-[#151B2E] rounded-xl overflow-hidden border border-[#D4AF37]/30 shadow-[0_0_40px_rgba(0,0,0,0.5)] ring-1 ring-inset ring-white/5 relative">
          <div className="absolute inset-1.5 border border-[#D4AF37]/10 pointer-events-none rounded-lg z-0"></div>
          {isLoadingProducts ? (
            <div className="flex flex-col items-center justify-center p-12 text-[#D4AF37]/70 bg-[#151B2E] rounded-xl border border-dashed border-[#D4AF37]/30 relative z-10 m-3">
              <Info className="w-8 h-8 mb-3" />
              <p>正在讀取雲端試算表資料...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-[#D4AF37]/50 bg-[#151B2E] rounded-xl border border-dashed border-[#D4AF37]/30 relative z-10 m-3">
              <Info className="w-8 h-8 mb-3" />
              <p>{loadError || t.emptyState}</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto rounded-xl relative z-10 m-1.5 bg-[#0B101E]/50">
              <table className="w-full text-left border-collapse block md:table">
                <thead className="hidden md:table-header-group sticky top-0 bg-[#0B101E]/95 backdrop-blur-md text-[#D4AF37] text-[11px] tracking-wider uppercase z-10 shadow-md border-b border-[#D4AF37]/30">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center font-display font-medium"></th>
                    <th className="px-4 py-3 font-display font-medium shrink-0 text-center">產品名稱</th>
                    {!isSimplified && (
                      <>
                        <th className="px-4 py-3 font-display font-medium text-center">管徑</th>
                        <th className="px-4 py-3 font-display font-medium text-center">室內機尺寸</th>
                        <th className="px-4 py-3 font-display font-medium text-center">室外機尺寸</th>
                      </>
                    )}
                    <th className="px-4 py-3 text-center font-display font-medium">單價</th>
                  </tr>
                </thead>
                <tbody className="block md:table-row-group divide-y md:divide-y divide-[#D4AF37]/10 text-sm font-sans tracking-tight">
                  {filteredProducts.map(product => {
                    const isSelected = selectedProducts.some(p => p.id === product.id || p.originalId === product.id);
                    return (
                      <tr 
                        key={product.id} 
                        className={cn(
                          "transition-all cursor-pointer group block md:table-row relative pb-3 md:pb-0 border-b md:border-none border-[#D4AF37]/10",
                          isSelected ? "bg-[#D4AF37]/10 border-l-2 md:border-l-2 border-[#D4AF37]" : "hover:bg-[#D4AF37]/5"
                        )}
                        onClick={() => {
                          if (isSelected && (product.type === '多聯內機' || (typeof product.type === 'string' && product.type.includes('多聯內機')))) {
                            setDuplicatePromptProduct(product);
                          } else {
                            onToggleProduct(product);
                          }
                        }}
                      >
                        <td className="p-3 md:p-4 absolute right-2 top-3 md:static block md:table-cell align-middle md:text-center shrink-0">
                          <div className={cn("w-4 h-4 rounded md:mx-auto border transition-colors flex items-center justify-center", isSelected ? "bg-[#D4AF37] border-[#D4AF37]" : "bg-[#151B2E] border-[#D4AF37]/50 group-hover:border-[#D4AF37]")}>
                            {isSelected && <div className="w-2 h-2 bg-[#0B101E] rounded-sm"></div>}
                          </div>
                        </td>
                        <td className="p-3 md:p-4 pr-10 md:pr-4 block md:table-cell align-middle text-left pt-3 md:pt-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            <div className="flex items-center gap-2">
                              <span className={cn("font-semibold font-sans text-xs tracking-wide px-1.5 py-0.5 rounded", getBrandColor(product.brand))}>{getBrandDisplayName(product.brand)}</span>
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-medium border",
                                product.type?.includes('多聯') ? "bg-indigo-900/40 text-indigo-300 border-indigo-700/50" : "bg-[#151B2E] text-gray-300 border-[#D4AF37]/30"
                              )}>
                                {product.type}
                              </span>
                              {product.kind && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0A0E1A] text-gray-400 border border-[#D4AF37]/20">{product.kind}</span>
                              )}
                            </div>
                            <div
                              className="flex items-center justify-start gap-1.5 font-mono text-sm text-slate-200 font-medium group-hover:text-white transition-colors flex-wrap"
                            >
                              {product.environment === '暖氣' && <Sun className="w-4 h-4 text-orange-400 shrink-0" />}
                              {product.environment === '冷氣' && <Snowflake className="w-4 h-4 text-blue-300 shrink-0" />}
                              <span>{product.model}</span>
                              <button
                                onClick={(e) => handleCopyProductName(product, e)}
                                className="ml-1 p-1 rounded hover:bg-[#D4AF37]/20 text-[#D4AF37]/70 hover:text-[#D4AF37] transition-all duration-200 flex-shrink-0"
                                title="複製產品名稱"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                        {!isSimplified && (
                          <>
                            <td className="px-3 py-1 md:p-4 text-sm text-gray-400 block md:table-cell align-middle md:text-center whitespace-normal md:whitespace-nowrap">
                              <div className="flex md:block items-start">
                                <span className="md:hidden w-16 text-[#D4AF37]/70 font-medium text-xs shrink-0 text-left">管徑</span>
                                <span className="text-left flex-1 md:text-center">{product.pipeSize || '-'}</span>
                              </div>
                            </td>
                            <td className="px-3 py-1 md:p-4 text-xs text-gray-400 block md:table-cell align-middle md:text-center whitespace-normal md:whitespace-nowrap">
                              <div className="flex md:block items-start">
                                <span className="md:hidden w-16 text-[#D4AF37]/70 font-medium text-xs shrink-0 text-left">室內機</span>
                                <span className="text-left flex-1 md:text-center">{product.indoorDimensions || product.dimensions || '-'}</span>
                              </div>
                            </td>
                            <td className="px-3 py-1 md:p-4 text-xs text-gray-400 block md:table-cell align-middle md:text-center whitespace-normal md:whitespace-nowrap">
                              <div className="flex md:block items-start">
                                <span className="md:hidden w-16 text-[#D4AF37]/70 font-medium text-xs shrink-0 text-left">室外機</span>
                                <span className="text-left flex-1 md:text-center">{product.outdoorDimensions || '-'}</span>
                              </div>
                            </td>
                          </>
                        )}
                        <td className="p-3 mt-2 md:mt-0 py-2 md:p-4 text-left md:text-center font-mono font-bold text-lg md:text-lg text-[#E8D099] block md:table-cell align-middle tracking-wide whitespace-normal md:whitespace-nowrap border-t md:border-none border-[#D4AF37]/10">
                          <div className="flex md:block items-center">
                            <span className="md:hidden w-16 text-[#D4AF37]/70 font-medium text-xs shrink-0 text-left font-sans">單價</span>
                            <span className="text-left flex-1 md:text-center">{product.price.toLocaleString()}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {copiedProductName && (
        <div className="fixed bottom-24 right-6 z-[60] rounded-full border border-[#D4AF37]/40 bg-[#151B2E]/90 px-4 py-2 text-sm text-[#E8D099] shadow-lg backdrop-blur">
          已複製：{copiedProductName}
        </div>
      )}

      {/* Floating Action Bar */}
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-[#151B2E]/90 backdrop-blur-md border border-[#D4AF37]/40 text-slate-200 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.8)] px-4 md:px-6 py-3 flex items-center gap-4 md:gap-6 animate-in slide-in-from-bottom-5 z-50">
           <div className="flex items-center gap-2">
             <ShoppingCart className="w-5 h-5 text-[#D4AF37]" />
             <span className="font-medium text-xs md:text-sm tracking-wide">{t.selectedCount} <span className="text-[#D4AF37] font-bold text-base md:text-lg">{selectedProducts.length}</span> 項</span>
           </div>
           <button 
             onClick={onNavigateToQuote}
             className="bg-gradient-to-r from-[#D4AF37] to-[#e6ca7b] hover:from-[#e6ca7b] hover:to-[#D4AF37] text-[#0B101E] px-4 md:px-6 py-2 rounded-full font-bold transition-all text-xs md:text-sm shadow-[0_0_15px_rgba(212,175,55,0.4)] active:scale-95 whitespace-nowrap"
           >
             {t.createQuote}
           </button>
        </div>
      )}

      {/* Duplicate Prompt Dialog */}
      {duplicatePromptProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151B2E] border border-[#D4AF37]/30 rounded-xl max-w-sm w-full shadow-2xl overflow-hidden flex flex-col p-6 animate-in zoom-in-95">
            <h3 className="text-[#D4AF37] font-semibold text-lg border-b border-[#D4AF37]/10 pb-3 mb-4">
              {t.duplicateTitle}
            </h3>
            <p className="text-gray-300 text-sm mb-6">
              <span className="text-[#E8D099] font-mono">{duplicatePromptProduct.model}</span> {t.duplicateMessage}
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  onToggleProduct(duplicatePromptProduct, 'add');
                  setDuplicatePromptProduct(null);
                }}
                className="w-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 py-2 rounded-lg transition-colors font-medium text-sm"
              >
                {t.duplicateAdd}
              </button>
              <button 
                onClick={() => {
                  onToggleProduct(duplicatePromptProduct, 'remove');
                  setDuplicatePromptProduct(null);
                }}
                className="w-full text-red-400 hover:text-red-300 border border-red-500/20 hover:bg-red-500/10 py-2 rounded-lg transition-colors font-medium text-sm"
              >
                {t.duplicateRemove}
              </button>
              <button 
                onClick={() => setDuplicatePromptProduct(null)}
                className="w-full text-gray-400 hover:text-gray-200 py-2 rounded-lg transition-colors font-semibold text-sm mt-1"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
