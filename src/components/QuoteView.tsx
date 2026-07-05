import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Printer, Image as ImageIcon, DollarSign, ChevronUp, ChevronDown, Edit2, Palette } from 'lucide-react';
import html2canvas from 'html2canvas';
import { QuoteProduct, QuoteConstructionItem } from '../types';
import { COMMON_CONSTRUCTION_ITEMS, CONSTRUCTION_ITEM_PRICES } from '../mockData';
import { calculateGroupUnitPrice, calculateProductsTotal } from '../quoteCalculations';
import { cn, getBrandDisplayName } from '../utils';
import { uiText, type AppLanguage } from '../i18n';

interface QuoteViewProps {
  products: QuoteProduct[];
  onUpdateProductQuantity: (id: string, diff: number) => void;
  onRemoveProduct: (id: string) => void;
  onReorderProducts?: (products: QuoteProduct[]) => void;
  onNavigateBack: (keepDetails: boolean) => void;
  language: AppLanguage;
  onToggleLanguage: () => void;
}

export const QuoteView: React.FC<QuoteViewProps> = ({
  products,
  onUpdateProductQuantity,
  onRemoveProduct,
  onReorderProducts,
  onNavigateBack,
  language,
  onToggleLanguage,
}) => {
  const t = uiText[language];
  const [showBackWarning, setShowBackWarning] = useState(false);
  const [title, setTitle] = useState(t.defaultQuoteTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [constructionItems, setConstructionItems] = useState<QuoteConstructionItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    address: '',
    phone: '',
    date: new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
  });
  
  // Local overrides for product details
  const [productDetails, setProductDetails] = useState<Record<string, { location: string, power?: string, notes: string, notes2?: string, priceAdjustment?: number, mergeWithNext?: boolean }>>({});

  const [activeAdjustmentId, setActiveAdjustmentId] = useState<string | null>(null);
  const [adjustmentInput, setAdjustmentInput] = useState<string>('');
  const [activeItemEditId, setActiveItemEditId] = useState<string | null>(null);
  const [itemEditInput, setItemEditInput] = useState<string>('');
  const [bgTheme, setBgTheme] = useState<'light' | 'dark'>('light');
  const [activeReorder, setActiveReorder] = useState<{
    type: 'product' | 'construction' | null;
    sourceIndex: number | null;
    hoverIndex: number | null;
  }>({ type: null, sourceIndex: null, hoverIndex: null });

  const quoteRef = useRef<HTMLDivElement>(null);
  const reorderTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setTitle(t.defaultQuoteTitle);
    setCustomerInfo(prev => ({
      ...prev,
      date: new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
    }));
  }, [language, t.defaultQuoteTitle]);

  useEffect(() => {
    return () => {
      if (reorderTimerRef.current !== null) {
        window.clearTimeout(reorderTimerRef.current);
      }
    };
  }, []);

  const clearReorderTimer = () => {
    if (reorderTimerRef.current !== null) {
      window.clearTimeout(reorderTimerRef.current);
      reorderTimerRef.current = null;
    }
  };

  const getAutoPower = (model: string) => {
    const match = model.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      return (num * 0.1).toFixed(1) + 'KW';
    }
    return '';
  };

  const handleExportImage = async () => {
    if (!quoteRef.current) return;
    try {
      const canvas = await html2canvas(quoteRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: bgTheme === 'dark' ? null : '#FFFFFF',
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `報價單_${new Date().toISOString().slice(0,10)}.png`;
      a.click();
    } catch (error) {
      console.error('Export failed', error);
      alert('匯出圖檔失敗，請稍後再試。');
    }
  };

  const handleProductDetailChange = (id: string, field: 'location' | 'power' | 'notes' | 'notes2' | 'priceAdjustment', value: any) => {
    setProductDetails(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || { location: '', notes: '' }),
        [field]: value
      }
    }));
  };

  const openAdjustment = (id: string, currentVal: number) => {
    setActiveAdjustmentId(id);
    setAdjustmentInput(currentVal ? String(currentVal) : '');
  };

  const handleAdjustmentSave = (id: string) => {
    const val = parseInt(adjustmentInput, 10);
    handleProductDetailChange(id, 'priceAdjustment', isNaN(val) ? 0 : val);
    setActiveAdjustmentId(null);
  };

  const handleBatchAdjustment = () => {
    const val = parseInt(adjustmentInput, 10);
    const numVal = isNaN(val) ? 0 : val;
    setProductDetails(prev => {
       const next = { ...prev };
       products.forEach(p => {
         next[p.id] = { ...(next[p.id] || { location: '', notes: '' }), priceAdjustment: numVal };
       });
       return next;
    });
    setActiveAdjustmentId(null);
  };

  const openItemEdit = (id: string, currentVal: string) => {
    setActiveItemEditId(id);
    setItemEditInput(currentVal);
  };

  const handleItemEditSave = (id: string) => {
    handleUpdateConstructionItem(id, 'name', itemEditInput);
    setActiveItemEditId(null);
  };

  const productGroups = useMemo(() => {
    const groups: QuoteProduct[][] = [];
    let currentGroup: QuoteProduct[] = [];
    products.forEach((p, i) => {
      currentGroup.push(p);
      const details = productDetails[p.id] || { location: '', notes: '' };
      if (!details.mergeWithNext || i === products.length - 1) {
        groups.push(currentGroup);
        currentGroup = [];
      }
    });
    return groups;
  }, [products, productDetails]);

  // 計算產品總計
  const productsTotal = useMemo(() => {
    return calculateProductsTotal(productGroups, productDetails);
  }, [productGroups, productDetails]);

  const calculateConstructionItemAmount = (item: QuoteConstructionItem) => {
    return Math.round((item.price || 0) * (item.quantity || 0));
  };

  // 計算施工總計
  const constructionTotal = useMemo(() => {
    return constructionItems.reduce((sum, item) => sum + calculateConstructionItemAmount(item), 0);
  }, [constructionItems]);

  const grandTotal = productsTotal + constructionTotal;

  // Equipment section header title
  const equipmentTitle = useMemo(() => {
    if (products.length > 0) {
       const brands = Array.from(new Set(products.map(p => p.brand)));
       if (brands.length === 1 && (brands[0].includes('Mitsubishi') || brands[0].includes('重工'))) {
          return t.equipmentGroup;
       } else if (brands.length === 1) {
          return `${brands[0]}${t.equipmentGroupDefault}`;
       }
    }
    return t.equipmentDetail;
  }, [products, t]);

  const handleMoveProductGroup = (groupIndex: number, direction: 'up' | 'down') => {
    if (!onReorderProducts) return;

    const nextGroups = [...productGroups];
    if (direction === 'up' && groupIndex > 0) {
      [nextGroups[groupIndex - 1], nextGroups[groupIndex]] = [nextGroups[groupIndex], nextGroups[groupIndex - 1]];
    } else if (direction === 'down' && groupIndex < nextGroups.length - 1) {
      [nextGroups[groupIndex + 1], nextGroups[groupIndex]] = [nextGroups[groupIndex], nextGroups[groupIndex + 1]];
    } else {
      return;
    }

    onReorderProducts(nextGroups.flat());
  };

  const moveProductGroupToIndex = (sourceIndex: number, targetIndex: number) => {
    if (!onReorderProducts) return;
    if (sourceIndex === targetIndex) return;

    const nextGroups = [...productGroups];
    const [movedGroup] = nextGroups.splice(sourceIndex, 1);
    const adjustedTarget = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
    nextGroups.splice(adjustedTarget, 0, movedGroup);
    onReorderProducts(nextGroups.flat());
  };

  const moveConstructionItemToIndex = (sourceIndex: number, targetIndex: number) => {
    if (sourceIndex === targetIndex) return;

    setConstructionItems(items => {
      const nextItems = [...items];
      const [movedItem] = nextItems.splice(sourceIndex, 1);
      const adjustedTarget = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      nextItems.splice(adjustedTarget, 0, movedItem);
      return nextItems;
    });
  };

  const handleReorderTouchStart = (type: 'product' | 'construction', sourceIndex: number) => (event: React.TouchEvent) => {
    if (event.touches.length === 0) return;
    event.preventDefault();
    event.stopPropagation();
    clearReorderTimer();
    reorderTimerRef.current = window.setTimeout(() => {
      setActiveReorder({ type, sourceIndex, hoverIndex: sourceIndex });
    }, 350);
  };

  const handleReorderTouchMove = (event: React.TouchEvent) => {
    if (!activeReorder.type || activeReorder.sourceIndex === null) return;

    const touch = event.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest<HTMLElement>('[data-reorder-index]');
    const nextIndex = target ? Number(target.dataset.reorderIndex) : NaN;
    if (!Number.isInteger(nextIndex) || nextIndex === activeReorder.hoverIndex) return;

    if (activeReorder.type === 'product') {
      moveProductGroupToIndex(activeReorder.sourceIndex, nextIndex);
    } else {
      moveConstructionItemToIndex(activeReorder.sourceIndex, nextIndex);
    }

    setActiveReorder(prev => prev.type ? { ...prev, hoverIndex: nextIndex } : prev);
  };

  const handleReorderTouchEnd = () => {
    clearReorderTimer();
    setActiveReorder({ type: null, sourceIndex: null, hoverIndex: null });
  };

  const handleAddConstructionItem = () => {
    const newItem: QuoteConstructionItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      spec: '',
      price: 0,
      quantity: 1
    };
    setConstructionItems([...constructionItems, newItem]);
  };

  const handleUpdateConstructionItem = (id: string, field: keyof QuoteConstructionItem, value: any) => {
    setConstructionItems(items => items.map(item => {
      if (item.id === id) {
        if (field === 'name') {
          const newPrice = CONSTRUCTION_ITEM_PRICES[value as string];
          if (newPrice !== undefined) {
             return { ...item, [field]: value, price: newPrice };
          }
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleRemoveConstructionItem = (id: string) => {
    setConstructionItems(items => items.filter(item => item.id !== id));
  };

  const handleMoveConstructionItem = (index: number, direction: 'up' | 'down') => {
    setConstructionItems(items => {
      const newItems = [...items];
      if (direction === 'up' && index > 0) {
        [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      } else if (direction === 'down' && index < newItems.length - 1) {
        [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
      }
      return newItems;
    });
  };
  
  const InputCell = ({ value, onChange, placeholder = "", className = "" }: { value: string, onChange: (val: string) => void, placeholder?: string, className?: string }) => (
    <input 
      type="text" 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      placeholder={placeholder}
      className={cn("w-full bg-transparent border-none focus:ring-0 p-0 text-center print:placeholder-transparent outline-none", className)}
    />
  );

  return (
    <div className="flex flex-col min-h-full bg-slate-100 text-slate-900 pb-20">
      {/* Header toolbar */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm sticky top-0 z-10 flex justify-between items-center print:hidden">
        <button 
          onClick={() => setShowBackWarning(true)}
          className="flex items-center gap-2 text-slate-600 hover:text-[#1e6ebb] font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {t.quoteBack}
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors border bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
          >
            {t.switchLanguage}
          </button>
          <button
            onClick={() => setBgTheme(prev => prev === 'light' ? 'dark' : 'light')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors border ${bgTheme === 'dark' ? 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}
          >
            <Palette className="w-4 h-4" />
            {t.quoteTheme}: {bgTheme === 'dark' ? t.quoteThemeDark : t.quoteThemeLight}
          </button>
          <button 
            onClick={handleExportImage}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <ImageIcon className="w-4 h-4" />
            {t.exportImage}
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#1e6ebb] hover:bg-[#155694] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            {t.printPreview}
          </button>
        </div>
      </div>

      <div className="flex-1 w-full overflow-x-auto pb-8 print:overflow-visible print:pb-0">
        <div className="min-w-full w-fit print:w-full">
          <div 
            ref={quoteRef}
            className={cn(
              "w-[900px] mx-auto p-10 mt-8 mb-8 bg-white shadow-md print:shadow-none print:mt-0 print:p-0 transition-colors duration-500 print:w-full",
              bgTheme === 'dark' && "quote-dark shadow-2xl ring-1 ring-slate-800"
            )}
            style={{ minHeight: '1050px' }}
          >
            <div className="mb-6 flex justify-center items-center">
              <div className="relative group flex items-center">
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingTitle(false); }}
                    className="text-3xl font-bold tracking-[0.2em] text-[#1e6ebb] font-serif bg-transparent border-b-2 border-[#1e6ebb] focus:outline-none text-center outline-none w-full min-w-[300px]"
                    autoFocus
                  />
                ) : (
                  <>
                    <h1 className="text-3xl font-bold tracking-[0.2em] text-[#1e6ebb] font-serif">{title}</h1>
                    <button 
                      onClick={() => setIsEditingTitle(true)}
                      className="absolute -right-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-400 hover:text-[#1e6ebb] print:hidden transition-opacity bg-white p-1 rounded shadow-sm border border-slate-200"
                      title={t.editTitle}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

        {/* Customer Info Section */}
        <div className="border border-black mb-6 flex flex-col font-sans">
          <div className="flex border-b border-black">
            <div className="px-2 py-1 whitespace-nowrap hidden md:block">{t.customerName}：</div>
            <div className="px-2 py-1 whitespace-nowrap block md:hidden">{t.customerName}：</div>
            <input 
              type="text" 
              value={customerInfo.name} 
              onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} 
              className="flex-1 border-none focus:ring-0 p-0 pl-1 outline-none print:placeholder-transparent"
              placeholder={t.placeholderName}
            />
          </div>
          <div className="flex border-b border-black">
            <div className="px-2 py-1 whitespace-nowrap hidden md:block">{t.customerAddress}：</div>
             <div className="px-2 py-1 whitespace-nowrap block md:hidden">{t.customerAddress}：</div>
            <input 
              type="text" 
              value={customerInfo.address} 
              onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} 
              className="flex-1 border-none focus:ring-0 p-0 pl-1 outline-none print:placeholder-transparent"
              placeholder={t.placeholderAddress}
            />
          </div>
          <div className="flex border-b border-black">
            <div className="px-2 py-1 whitespace-nowrap hidden md:block">{t.customerPhone}：</div>
            <div className="px-2 py-1 whitespace-nowrap block md:hidden">{t.customerPhone}：</div>
            <input 
              type="text" 
              value={customerInfo.phone} 
              onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} 
              className="flex-1 border-none focus:ring-0 p-0 pl-1 outline-none print:placeholder-transparent"
              placeholder={t.placeholderPhone}
            />
          </div>
          <div className="flex">
            <div className="px-2 py-1 whitespace-nowrap hidden md:block">{t.quoteDate}：</div>
            <div className="px-2 py-1 whitespace-nowrap block md:hidden">{t.quoteDate}：</div>
            <input 
              type="text" 
              value={customerInfo.date} 
              onChange={e => setCustomerInfo({...customerInfo, date: e.target.value})} 
              className="flex-1 border-none focus:ring-0 p-0 pl-1 outline-none print:placeholder-transparent"
              placeholder={t.placeholderDate}
            />
          </div>
        </div>

        {/* Equipment Section */}
        <div className="border border-black mb-6">
          <div className="text-center py-2 border-b border-black">
             <h2 className="text-2xl font-bold tracking-widest text-[#1e6ebb] font-serif">{equipmentTitle}</h2>
          </div>
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b border-black text-sm">
                <th className="py-2 border-r border-black w-24">{t.location}</th>
                <th className="py-2 border-r border-black">{t.model}</th>
                <th className="py-2 border-r border-black w-20">{t.power}</th>
                <th className="py-2 border-r border-black w-24">{t.unitPrice}</th>
                <th className="py-2 border-r border-black w-16">{t.quantity}</th>
                <th className="py-2 border-r border-black w-28">{t.amount}</th>
                <th className="py-2 w-24">{t.note}</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {productGroups.map((group, groupIndex) => {
                const mainProduct = group[0];
                const mainDetails = productDetails[mainProduct.id] || { location: '', notes: '' };
                const isLast = groupIndex === productGroups.length - 1;
                
                const unitPrice = calculateGroupUnitPrice(group, productDetails);
                
                let maxPowerValue = -1;
                let autoPower = '';
                group.forEach(p => {
                  const match = p.model.match(/\d+/);
                  if (match) {
                    const num = parseInt(match[0], 10);
                    if (num > maxPowerValue) {
                      maxPowerValue = num;
                      autoPower = (num * 0.1).toFixed(1) + 'KW';
                    }
                  }
                });
                
                const isReorderTarget = activeReorder.type === 'product' && activeReorder.hoverIndex === groupIndex;

                return (
                  <tr
                    key={mainProduct.id}
                    className={cn("group", !isLast && "border-b border-black", isReorderTarget && "bg-amber-50/70")}
                    data-reorder-index={groupIndex}
                  >
                    <td
                      className="border-r border-black p-1 align-middle relative touch-none"
                      onTouchStart={handleReorderTouchStart('product', groupIndex)}
                      onTouchMove={handleReorderTouchMove}
                      onTouchEnd={handleReorderTouchEnd}
                      onTouchCancel={handleReorderTouchEnd}
                    >
                       <div className="flex items-center justify-center h-full min-h-[3.5rem]">
                         <InputCell 
                           value={mainDetails.location} 
                           onChange={v => handleProductDetailChange(mainProduct.id, 'location', v)} 
                           placeholder={t.placeholderLocation}
                           className="font-bold"
                         />
                       </div>
                       <button onClick={() => onRemoveProduct(mainProduct.id)} className="absolute top-1 left-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 text-red-500 print:hidden transition-opacity">
                         <Trash2 className="w-3 h-3" />
                       </button>
                    </td>
                    <td className="border-r border-black p-0 h-full align-middle">
                      <div className="flex flex-col h-full justify-center min-h-[3.5rem] py-1">
                        {group.map((product, pIndex) => {
                          const renderCount = pIndex === 0 ? 1 : product.quantity;
                          return Array.from({ length: renderCount }).map((_, repeatIndex) => (
                            <div key={`${product.id}-${repeatIndex}`} className="flex flex-col relative group/merge">
                               {pIndex === 0 && repeatIndex === 0 && (
                                 <div className="text-center text-xs text-slate-500 mb-0.5">
                                    {[getBrandDisplayName(product.brand), product.type, product.kind, product.environment === '暖氣' ? '冷暖' : product.environment === '冷氣' ? '冷專' : product.environment].filter(Boolean).join(' - ')}
                                 </div>
                               )}
                               <div className="font-mono text-center mb-1">
                                  {product.model}
                               </div>
                               {pIndex === 0 && repeatIndex === 0 && (
                                 <div className="mb-1 flex flex-wrap justify-center gap-1.5 md:hidden">
                                   <button
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       onRemoveProduct(mainProduct.id);
                                     }}
                                     className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-medium text-red-600"
                                   >
                                     刪除
                                   </button>
                                   {groupIndex !== productGroups.length - 1 ? (
                                     <button
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         handleProductDetailChange(mainProduct.id, 'mergeWithNext', true);
                                       }}
                                       className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-600"
                                     >
                                       合併
                                     </button>
                                   ) : null}
                                   <button
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       openAdjustment(mainProduct.id, mainDetails.priceAdjustment || 0);
                                     }}
                                     className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-600"
                                   >
                                     調整
                                   </button>
                                 </div>
                               )}
                               {pIndex === group.length - 1 && groupIndex !== productGroups.length - 1 && repeatIndex === renderCount - 1 && (
                                   <button
                                     onClick={() => handleProductDetailChange(product.id, 'mergeWithNext', true)}
                                     className="absolute -bottom-4 right-0 z-10 bg-white text-[10px] shadow-sm text-blue-600 border border-blue-200 rounded px-1 min-w-max print:hidden transition-opacity opacity-100 md:opacity-0 md:group-hover/merge:opacity-100"
                                   >{t.mergeDown}</button>
                               )}
                               {pIndex !== group.length - 1 && repeatIndex === renderCount - 1 && (
                                   <button
                                     onClick={() => handleProductDetailChange(product.id, 'mergeWithNext', false)}
                                     className="absolute -bottom-4 right-0 z-10 bg-white text-[10px] shadow-sm text-red-500 border border-red-200 rounded px-1 min-w-max print:hidden transition-opacity opacity-100 md:opacity-0 md:group-hover/merge:opacity-100"
                                   >{t.unmerge}</button>
                               )}
                            </div>
                          ));
                        })}
                      </div>
                    </td>
                    <td className="border-r border-black p-0 h-full align-middle">
                       <div className="flex items-center justify-center h-full min-h-[3.5rem] font-mono">
                          <InputCell 
                            value={mainDetails.power !== undefined ? mainDetails.power : autoPower} 
                            onChange={v => handleProductDetailChange(mainProduct.id, 'power', v)} 
                            placeholder={t.placeholderPower}
                          />
                       </div>
                    </td>
                    <td className="border-r border-black p-1 font-mono tracking-wide align-middle">
                      <div className={cn("flex items-center justify-center h-full min-h-[3.5rem]", mainProduct.quantity === 1 ? "print:hidden" : "")}>
                         {unitPrice.toLocaleString()}
                      </div>
                    </td>
                    <td className="border-r border-black p-1 align-middle">
                      <div className="flex items-center justify-center gap-1 print:hidden">
                         <button onClick={() => onUpdateProductQuantity(mainProduct.id, -1)} className="text-slate-400 hover:text-black">-</button>
                         <span className="w-6 text-center">{mainProduct.quantity}</span>
                         <button onClick={() => onUpdateProductQuantity(mainProduct.id, 1)} className="text-slate-400 hover:text-black">+</button>
                      </div>
                      <span className={cn("hidden", mainProduct.quantity === 1 ? "" : "print:inline")}>{mainProduct.quantity} {language === 'fr' ? 'unité' : '組'}</span>
                    </td>
                    <td className="border-r border-black p-1 font-mono tracking-wide align-middle">
                      <div className="flex items-center justify-center min-h-[3.5rem] h-full">{((unitPrice || 0) * (mainProduct.quantity || 1)).toLocaleString()}</div>
                    </td>
                    <td className="p-1 align-middle relative group/note text-center">
                       <div className="flex flex-col items-center justify-center min-h-[3.5rem] w-full">
                         <InputCell 
                           value={mainDetails.notes} 
                           onChange={v => handleProductDetailChange(mainProduct.id, 'notes', v)} 
                           placeholder={t.placeholderNote}
                         />
                         {mainDetails.priceAdjustment ? (
                           <div className={cn(
                             "print:hidden text-[11px] font-mono mt-0.5",
                             mainDetails.priceAdjustment > 0 ? "text-green-600" : "text-red-500"
                           )}>
                             {mainDetails.priceAdjustment > 0 ? '+' : ''}{mainDetails.priceAdjustment}
                           </div>
                         ) : null}
                       </div>
                       <div className="absolute top-1 right-1 flex gap-1 opacity-100 md:opacity-0 md:group-hover/note:opacity-100 transition-opacity print:hidden">
                         <button
                           onClick={() => handleMoveProductGroup(groupIndex, 'up')}
                           disabled={groupIndex === 0}
                           className="p-0.5 rounded text-slate-400 hover:text-[#1e6ebb] disabled:opacity-30 disabled:hover:text-slate-400 bg-white/80 hover:bg-white border border-slate-200"
                           title="上移項目"
                         >
                           <ChevronUp className="w-3.5 h-3.5" />
                         </button>
                         <button
                           onClick={() => handleMoveProductGroup(groupIndex, 'down')}
                           disabled={groupIndex === productGroups.length - 1}
                           className="p-0.5 rounded text-slate-400 hover:text-[#1e6ebb] disabled:opacity-30 disabled:hover:text-slate-400 bg-white/80 hover:bg-white border border-slate-200"
                           title="下移項目"
                         >
                           <ChevronDown className="w-3.5 h-3.5" />
                         </button>
                       </div>
                       <button 
                         onClick={() => openAdjustment(mainProduct.id, mainDetails.priceAdjustment || 0)}
                         className="absolute bottom-1 right-1 p-0.5 rounded opacity-100 md:opacity-0 md:group-hover/note:opacity-100 text-slate-400 hover:text-green-600 bg-white/80 hover:bg-white print:hidden transition-opacity"
                         title="調整價格"
                       >
                         <DollarSign className="w-3.5 h-3.5" />
                       </button>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                   <td colSpan={7} className="py-4 text-slate-400 italic font-sans text-center">{t.noEquipment}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Construction Section */}
        <div className="border border-black mb-6">
          <div className="text-center py-2 border-b border-black">
             <h2 className="text-2xl font-bold tracking-widest text-[#1e6ebb] font-serif">施工暨材料明細列表</h2>
          </div>
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b border-black text-sm">
                <th className="py-2 border-r border-black text-center">{t.itemName}</th>
                <th className="py-2 border-r border-black w-32">{t.spec}</th>
                <th className="py-2 border-r border-black w-24">{t.quantity}</th>
                <th className="py-2 border-r border-black w-24">{t.unitPrice}</th>
                <th className="py-2 w-28">{t.amount}</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {constructionItems.map((item, index) => {
                const isLast = index === Math.max(constructionItems.length - 1, 4);
                const isReorderTarget = activeReorder.type === 'construction' && activeReorder.hoverIndex === index;

                return (
                  <tr
                    key={item.id}
                    className={cn("group h-8", !isLast && "border-b border-black", isReorderTarget && "bg-amber-50/70")}
                    data-reorder-index={index}
                  >
                    <td
                      className="border-r border-black px-1 relative text-center align-middle group/name touch-none"
                      onTouchStart={handleReorderTouchStart('construction', index)}
                      onTouchMove={handleReorderTouchMove}
                      onTouchEnd={handleReorderTouchEnd}
                      onTouchCancel={handleReorderTouchEnd}
                    >
                      <div className="relative print:hidden flex items-center justify-center w-full h-full min-h-[2rem]">
                        <select
                          value={COMMON_CONSTRUCTION_ITEMS.includes(item.name) ? item.name : ""}
                          onChange={(e) => handleUpdateConstructionItem(item.id, 'name', e.target.value)}
                          className="w-full h-full bg-transparent border-none focus:ring-0 p-0 outline-none text-center text-sm cursor-pointer appearance-none bg-none"
                          style={{ textAlignLast: "center" }}
                        >
                          <option value="" disabled className="hidden">{item.name || t.placeholderItem}</option>
                          {COMMON_CONSTRUCTION_ITEMS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => openItemEdit(item.id, item.name)}
                          className="absolute right-0 opacity-100 md:opacity-0 md:group-hover/name:opacity-100 text-slate-400 hover:text-[#1e6ebb] print:hidden transition-opacity bg-white p-0.5 rounded shadow-sm border border-slate-200"
                          title="編輯自訂內容"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="hidden print:inline">{item.name}</span>
                      <div className="mt-2 flex flex-wrap justify-center gap-1.5 md:hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openItemEdit(item.id, item.name);
                          }}
                          className="rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 shadow-sm"
                        >
                          編輯
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveConstructionItem(index, 'up');
                          }}
                          disabled={index === 0}
                          className="rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 shadow-sm disabled:opacity-40"
                        >
                          上移
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveConstructionItem(index, 'down');
                          }}
                          disabled={index === constructionItems.length - 1}
                          className="rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 shadow-sm disabled:opacity-40"
                        >
                          下移
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveConstructionItem(item.id);
                          }}
                          className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-medium text-red-600 shadow-sm"
                        >
                          刪除
                        </button>
                      </div>
                      <button onClick={() => handleRemoveConstructionItem(item.id)} className="absolute top-1 left-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 text-red-500 print:hidden transition-opacity -ml-6">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="border-r border-black px-1 align-middle">
                       <InputCell 
                         value={item.spec || ''} 
                         onChange={v => handleUpdateConstructionItem(item.id, 'spec', v)} 
                         placeholder="規格"
                       />
                    </td>
                    <td className="border-r border-black px-1 align-middle">
                       <input 
                          type="text" 
                          value={item.quantity || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, ''); // Allow float for materials
                            handleUpdateConstructionItem(item.id, 'quantity', val ? parseFloat(val) : 0);
                          }}
                          className="w-full bg-transparent border-none focus:ring-0 p-0 outline-none text-center print:hidden"
                          placeholder="0"
                        />
                       <span className="hidden print:inline">{item.quantity}</span>
                    </td>
                    <td className="border-r border-black px-1 font-mono tracking-wide align-middle">
                        <input 
                          type="number" 
                          value={item.price || ''}
                          onChange={(e) => handleUpdateConstructionItem(item.id, 'price', parseInt(e.target.value) || 0)}
                          className="w-full bg-transparent border-none focus:ring-0 p-0 outline-none text-center print:hidden font-mono"
                          placeholder="0"
                        />
                       <span className="hidden print:inline">{(item.price || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-1 font-mono tracking-wide align-middle relative">
                      {(calculateConstructionItemAmount(item) || 0).toLocaleString()}
                      
                      <div className="absolute top-1/2 left-full -translate-y-1/2 ml-2 flex flex-col gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity print:hidden">
                        <button 
                          onClick={() => handleMoveConstructionItem(index, 'up')} 
                          disabled={index === 0} 
                          className="p-0.5 text-slate-400 hover:text-[#1e6ebb] disabled:opacity-30 disabled:hover:text-slate-400 bg-white rounded shadow-sm border border-slate-200 focus:outline-none"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleMoveConstructionItem(index, 'down')} 
                          disabled={index === constructionItems.length - 1} 
                          className="p-0.5 text-slate-400 hover:text-[#1e6ebb] disabled:opacity-30 disabled:hover:text-slate-400 bg-white rounded shadow-sm border border-slate-200 focus:outline-none"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {/* Add item row */}
              <tr className="border-b border-black h-8 print:hidden group cursor-pointer hover:bg-slate-50 transition-colors" onClick={handleAddConstructionItem}>
                <td className="border-r border-black relative">
                   <div className="absolute inset-0 flex items-center justify-center text-slate-400 group-hover:text-[#1e6ebb]">
                     <Plus className="w-4 h-4 mr-1" />
                     <span className="text-sm font-medium">{t.addConstructionItem}</span>
                   </div>
                </td>
                <td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td>
              </tr>
              {/* Optional: Padding rows to make it look like a full page standard invoice */}
              {[...Array(Math.max(0, 5 - constructionItems.length))].map((_, i) => (
                <tr key={`pad-${i}`} className="border-b border-black h-8">
                  <td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td>
                </tr>
              ))}
              {/* Spacer Row before footer */}
              <tr className="border-b border-black h-8">
                <td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td>
              </tr>
              {/* Footer Rows integrated into the table */}
              <tr className="border-b border-black">
                <td colSpan={1} rowSpan={3} className="border-r border-black text-left px-6 py-4 align-top">
                  <div className="text-[17px] space-y-1.5 text-slate-800 font-medium tracking-wide">
                    <p>
                      ◎ {t.deposit} <span className="font-mono ml-0.5">{productsTotal.toLocaleString()}</span>
                    </p>
                    <p>
                      ◎ {t.balance} <span className="font-mono ml-0.5">{constructionTotal.toLocaleString()}</span>
                    </p>
                    <p className="mt-2.5">{t.taxNote}</p>
                  </div>
                </td>
                <td colSpan={2} className="py-2.5 border-r border-black font-medium tracking-wide text-center">{t.constructionTotal}</td>
                <td colSpan={2} className="py-2.5 font-mono tracking-wider font-medium text-center">{constructionTotal.toLocaleString()}</td>
              </tr>
              <tr className="border-b border-black">
                <td colSpan={2} className="py-2.5 border-r border-black font-medium tracking-wide text-center">{t.productTotal}</td>
                <td colSpan={2} className="py-2.5 font-mono tracking-wider font-medium text-center">{productsTotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td colSpan={2} className="py-2.5 border-r border-black font-medium tracking-wide text-center">{t.grandTotal}</td>
                <td colSpan={2} className="py-2.5 font-mono tracking-wider font-medium text-center text-red-600">{grandTotal.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

          </div>
        </div>
      </div>

      {/* Adjustment Modal */}
      {activeAdjustmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 print:hidden">
          <div className="bg-white p-5 rounded-lg shadow-xl border border-slate-200">
            <h3 className="font-bold mb-4 flex items-center text-slate-800">
              <DollarSign className="w-5 h-5 mr-1 text-green-600" />
              {t.adjustmentTitle}
            </h3>
            <div className="flex items-center gap-3 mb-5">
              <input 
                type="number" 
                value={adjustmentInput}
                onChange={e => setAdjustmentInput(e.target.value)}
                className="border border-slate-300 rounded-md px-3 py-1.5 outline-none focus:border-[#1e6ebb] w-36 text-center shadow-inner"
                placeholder={t.placeholderAdjustment}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdjustmentSave(activeAdjustmentId);
                }}
              />
              <button 
                onClick={handleBatchAdjustment}
                className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-md text-sm hover:bg-purple-100 font-medium transition-colors whitespace-nowrap"
              >
                {t.batchAdjust}
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setActiveAdjustmentId(null)} className="px-4 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors">{t.cancel}</button>
              <button onClick={() => handleAdjustmentSave(activeAdjustmentId)} className="bg-[#1e6ebb] text-white px-4 py-1.5 rounded-md hover:bg-[#155694] transition-colors shadow-sm">{t.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {/* Item Edit Modal */}
      {activeItemEditId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 print:hidden">
          <div className="bg-white p-5 rounded-lg shadow-xl border border-slate-200 w-80 max-w-full m-4">
            <h3 className="font-bold mb-4 flex items-center text-slate-800">
              <Edit2 className="w-5 h-5 mr-1 text-[#1e6ebb]" />
              {t.itemEditTitle}
            </h3>
            <div className="mb-5">
              <input 
                type="text" 
                value={itemEditInput}
                onChange={e => setItemEditInput(e.target.value)}
                className="border border-slate-300 rounded-md px-3 py-1.5 outline-none focus:border-[#1e6ebb] w-full shadow-inner"
                placeholder={t.itemEditPlaceholder}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleItemEditSave(activeItemEditId);
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setActiveItemEditId(null)} className="px-4 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors">{t.cancel}</button>
              <button onClick={() => handleItemEditSave(activeItemEditId)} className="bg-[#1e6ebb] text-white px-4 py-1.5 rounded-md hover:bg-[#155694] transition-colors shadow-sm">{t.confirm}</button>
            </div>
          </div>
        </div>
      )}
      {/* Back Warning Modal */}
      {showBackWarning && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 print:hidden">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[30rem]">
            <h3 className="text-xl font-bold mb-4 text-slate-800">{t.backWarningTitle}</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">{t.backWarningMessage}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowBackWarning(false)} 
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                {t.cancelBack}
              </button>
              <button 
                onClick={() => {
                  setShowBackWarning(false);
                  onNavigateBack(false);
                }} 
                className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors font-medium"
              >
                {t.clearAndBack}
              </button>
              <button 
                onClick={() => {
                  setShowBackWarning(false);
                  onNavigateBack(true);
                }} 
                className="px-4 py-2 bg-[#1e6ebb] text-white rounded-md hover:bg-[#155694] transition-colors font-medium shadow-sm"
              >
                {t.keepDetails}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
