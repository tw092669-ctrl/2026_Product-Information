import React, { useState, useMemo, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Printer, Image as ImageIcon, DollarSign, ChevronUp, ChevronDown, Edit2, Palette } from 'lucide-react';
import html2canvas from 'html2canvas';
import { QuoteProduct, QuoteConstructionItem } from '../types';
import { COMMON_CONSTRUCTION_ITEMS, CONSTRUCTION_ITEM_PRICES } from '../mockData';
import { cn, getBrandDisplayName } from '../utils';

interface QuoteViewProps {
  products: QuoteProduct[];
  onUpdateProductQuantity: (id: string, diff: number) => void;
  onRemoveProduct: (id: string) => void;
  onNavigateBack: (keepDetails: boolean) => void;
}

export const QuoteView: React.FC<QuoteViewProps> = ({
  products,
  onUpdateProductQuantity,
  onRemoveProduct,
  onNavigateBack
}) => {
  const [showBackWarning, setShowBackWarning] = useState(false);
  const [title, setTitle] = useState('冷氣工程估價單');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [constructionItems, setConstructionItems] = useState<QuoteConstructionItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    address: '',
    phone: '',
    date: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
  });
  
  // Local overrides for product details
  const [productDetails, setProductDetails] = useState<Record<string, { location: string, power?: string, notes: string, notes2?: string, priceAdjustment?: number, mergeWithNext?: boolean }>>({});

  const [activeAdjustmentId, setActiveAdjustmentId] = useState<string | null>(null);
  const [adjustmentInput, setAdjustmentInput] = useState<string>('');
  const [activeItemEditId, setActiveItemEditId] = useState<string | null>(null);
  const [itemEditInput, setItemEditInput] = useState<string>('');
  const [bgTheme, setBgTheme] = useState<'light' | 'dark'>('light');

  const quoteRef = useRef<HTMLDivElement>(null);

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
    return productGroups.reduce((sum, group) => {
      // Calculate total group unit price
      const groupUnitPrice = group.reduce((groupSum, p) => {
        const adj = productDetails[p.id]?.priceAdjustment || 0;
        return groupSum + p.price + adj;
      }, 0);
      // Multiply by main product's quantity
      return sum + groupUnitPrice * group[0].quantity;
    }, 0);
  }, [productGroups, productDetails]);

  // 計算施工總計
  const constructionTotal = useMemo(() => {
    return constructionItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [constructionItems]);

  const grandTotal = productsTotal + constructionTotal;

  // Equipment section header title
  const equipmentTitle = useMemo(() => {
    if (products.length > 0) {
       const brands = Array.from(new Set(products.map(p => p.brand)));
       if (brands.length === 1 && (brands[0].includes('Mitsubishi') || brands[0].includes('三菱'))) {
          return '三菱重工系列空調設備';
       } else if (brands.length === 1) {
          return `${brands[0]}系列空調設備`;
       }
    }
    return '空調設備明細';
  }, [products]);

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
          返回
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setBgTheme(prev => prev === 'light' ? 'dark' : 'light')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors border ${bgTheme === 'dark' ? 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}
          >
            <Palette className="w-4 h-4" />
            風格: {bgTheme === 'dark' ? '漸層黑' : '一般(白)'}
          </button>
          <button 
            onClick={handleExportImage}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <ImageIcon className="w-4 h-4" />
            匯出圖檔
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#1e6ebb] hover:bg-[#155694] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            預覽列印
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
                      className="absolute -right-10 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[#1e6ebb] print:hidden transition-opacity bg-white p-1 rounded shadow-sm border border-slate-200"
                      title="編輯標題"
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
            <div className="px-2 py-1 whitespace-nowrap hidden md:block">顧客姓名：</div>
            <div className="px-2 py-1 whitespace-nowrap block md:hidden">姓名：</div>
            <input 
              type="text" 
              value={customerInfo.name} 
              onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} 
              className="flex-1 border-none focus:ring-0 p-0 pl-1 outline-none print:placeholder-transparent"
              placeholder="輸入顧客姓名"
            />
          </div>
          <div className="flex border-b border-black">
            <div className="px-2 py-1 whitespace-nowrap hidden md:block">顧客地址：</div>
             <div className="px-2 py-1 whitespace-nowrap block md:hidden">地址：</div>
            <input 
              type="text" 
              value={customerInfo.address} 
              onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} 
              className="flex-1 border-none focus:ring-0 p-0 pl-1 outline-none print:placeholder-transparent"
              placeholder="輸入顧客地址"
            />
          </div>
          <div className="flex border-b border-black">
            <div className="px-2 py-1 whitespace-nowrap hidden md:block">顧客電話：</div>
            <div className="px-2 py-1 whitespace-nowrap block md:hidden">電話：</div>
            <input 
              type="text" 
              value={customerInfo.phone} 
              onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} 
              className="flex-1 border-none focus:ring-0 p-0 pl-1 outline-none print:placeholder-transparent"
              placeholder="輸入顧客電話"
            />
          </div>
          <div className="flex">
            <div className="px-2 py-1 whitespace-nowrap hidden md:block">估價日期：</div>
            <div className="px-2 py-1 whitespace-nowrap block md:hidden">日期：</div>
            <input 
              type="text" 
              value={customerInfo.date} 
              onChange={e => setCustomerInfo({...customerInfo, date: e.target.value})} 
              className="flex-1 border-none focus:ring-0 p-0 pl-1 outline-none print:placeholder-transparent"
              placeholder="YYYY/MM/DD"
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
                <th className="py-2 border-r border-black w-24">位 置</th>
                <th className="py-2 border-r border-black">機 型</th>
                <th className="py-2 border-r border-black w-20">功率(KW)</th>
                <th className="py-2 border-r border-black w-24">單 價</th>
                <th className="py-2 border-r border-black w-16">數 量</th>
                <th className="py-2 border-r border-black w-28">價 錢</th>
                <th className="py-2 w-24">備 註</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {productGroups.map((group, groupIndex) => {
                const mainProduct = group[0];
                const mainDetails = productDetails[mainProduct.id] || { location: '', notes: '' };
                const isLast = groupIndex === productGroups.length - 1;
                
                const unitPrice = group.reduce((sum, p) => {
                  const qty = p.id === mainProduct.id ? 1 : p.quantity;
                  return sum + (p.price + (productDetails[p.id]?.priceAdjustment || 0)) * qty;
                }, 0);
                
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
                
                return (
                  <tr key={mainProduct.id} className={cn("group", !isLast && "border-b border-black")}>
                    <td className="border-r border-black p-1 align-middle relative">
                       <div className="flex items-center justify-center h-full min-h-[3.5rem]">
                         <InputCell 
                           value={mainDetails.location} 
                           onChange={v => handleProductDetailChange(mainProduct.id, 'location', v)} 
                           placeholder="位置"
                           className="font-bold"
                         />
                       </div>
                       <button onClick={() => onRemoveProduct(mainProduct.id)} className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 text-red-500 print:hidden transition-opacity">
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
                               {pIndex === group.length - 1 && groupIndex !== productGroups.length - 1 && repeatIndex === renderCount - 1 && (
                                   <button
                                     onClick={() => handleProductDetailChange(product.id, 'mergeWithNext', true)}
                                     className="absolute -bottom-4 right-0 z-10 opacity-0 group-hover/merge:opacity-100 bg-white text-[10px] shadow-sm text-blue-600 border border-blue-200 rounded px-1 min-w-max print:hidden transition-opacity"
                                   >向下合併</button>
                               )}
                               {pIndex !== group.length - 1 && repeatIndex === renderCount - 1 && (
                                   <button
                                     onClick={() => handleProductDetailChange(product.id, 'mergeWithNext', false)}
                                     className="absolute -bottom-4 right-0 z-10 opacity-0 group-hover/merge:opacity-100 bg-white text-[10px] shadow-sm text-red-500 border border-red-200 rounded px-1 min-w-max print:hidden transition-opacity"
                                   >取消合併</button>
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
                            placeholder="KW"
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
                      <span className={cn("hidden", mainProduct.quantity === 1 ? "" : "print:inline")}>{mainProduct.quantity} 組</span>
                    </td>
                    <td className="border-r border-black p-1 font-mono tracking-wide align-middle">
                      <div className="flex items-center justify-center min-h-[3.5rem] h-full">{(unitPrice * mainProduct.quantity).toLocaleString()}</div>
                    </td>
                    <td className="p-1 align-middle relative group/note text-center">
                       <div className="flex flex-col items-center justify-center min-h-[3.5rem] w-full">
                         <InputCell 
                           value={mainDetails.notes} 
                           onChange={v => handleProductDetailChange(mainProduct.id, 'notes', v)} 
                           placeholder="備註"
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
                       <button 
                         onClick={() => openAdjustment(mainProduct.id, mainDetails.priceAdjustment || 0)}
                         className="absolute bottom-1 right-1 p-0.5 rounded opacity-0 group-hover/note:opacity-100 text-slate-400 hover:text-green-600 bg-white/80 hover:bg-white print:hidden transition-opacity"
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
                   <td colSpan={7} className="py-4 text-slate-400 italic font-sans text-center">尚未加入設備...</td>
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
                <th className="py-2 border-r border-black text-center">項 目</th>
                <th className="py-2 border-r border-black w-32">規 格</th>
                <th className="py-2 border-r border-black w-24">數 量</th>
                <th className="py-2 border-r border-black w-24">單 價</th>
                <th className="py-2 w-28">合 計</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {constructionItems.map((item, index) => {
                const isLast = index === Math.max(constructionItems.length - 1, 4);
                return (
                  <tr key={item.id} className={cn("group h-8", !isLast && "border-b border-black")}>
                    <td className="border-r border-black px-1 relative text-center align-middle group/name">
                      <div className="relative print:hidden flex items-center justify-center w-full h-full min-h-[2rem]">
                        <select
                          value={COMMON_CONSTRUCTION_ITEMS.includes(item.name) ? item.name : ""}
                          onChange={(e) => handleUpdateConstructionItem(item.id, 'name', e.target.value)}
                          className="w-full h-full bg-transparent border-none focus:ring-0 p-0 outline-none text-center text-sm cursor-pointer appearance-none bg-none"
                          style={{ textAlignLast: "center" }}
                        >
                          <option value="" disabled className="hidden">{item.name || "選擇施工項目"}</option>
                          {COMMON_CONSTRUCTION_ITEMS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => openItemEdit(item.id, item.name)}
                          className="absolute right-0 opacity-0 group-hover/name:opacity-100 text-slate-400 hover:text-[#1e6ebb] print:hidden transition-opacity bg-white p-0.5 rounded shadow-sm border border-slate-200"
                          title="編輯自訂內容"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="hidden print:inline">{item.name}</span>
                      <button onClick={() => handleRemoveConstructionItem(item.id)} className="absolute top-1 left-0 opacity-0 group-hover:opacity-100 text-red-500 print:hidden transition-opacity -ml-6">
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
                       <span className="hidden print:inline">{item.price ? item.price.toLocaleString() : ''}</span>
                    </td>
                    <td className="px-1 font-mono tracking-wide align-middle relative">
                      {item.price && item.quantity ? Math.round(item.price * item.quantity).toLocaleString() : ''}
                      
                      <div className="absolute top-1/2 left-full -translate-y-1/2 ml-2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
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
                     <span className="text-sm font-medium">新增施工項目</span>
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
                      ◎ 訂金為設備款： <span className="font-mono ml-0.5">{productsTotal.toLocaleString()}</span>
                    </p>
                    <p>
                      ◎ 完工驗收後尾款： <span className="font-mono ml-0.5">{constructionTotal.toLocaleString()}</span>
                    </p>
                    <p className="mt-2.5">＊ 設備金額含稅、施工金額外加5%</p>
                  </div>
                </td>
                <td colSpan={2} className="py-2.5 border-r border-black font-medium tracking-wide text-center">施工總價</td>
                <td colSpan={2} className="py-2.5 font-mono tracking-wider font-medium text-center">{constructionTotal.toLocaleString()}</td>
              </tr>
              <tr className="border-b border-black">
                <td colSpan={2} className="py-2.5 border-r border-black font-medium tracking-wide text-center">設備總價</td>
                <td colSpan={2} className="py-2.5 font-mono tracking-wider font-medium text-center">{productsTotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td colSpan={2} className="py-2.5 border-r border-black font-medium tracking-wide text-center">完工總價</td>
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
              調整價格
            </h3>
            <div className="flex items-center gap-3 mb-5">
              <input 
                type="number" 
                value={adjustmentInput}
                onChange={e => setAdjustmentInput(e.target.value)}
                className="border border-slate-300 rounded-md px-3 py-1.5 outline-none focus:border-[#1e6ebb] w-36 text-center shadow-inner"
                placeholder="例如: 3000 或 -3000"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdjustmentSave(activeAdjustmentId);
                }}
              />
              <button 
                onClick={handleBatchAdjustment}
                className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-md text-sm hover:bg-purple-100 font-medium transition-colors whitespace-nowrap"
              >
                批量調整
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setActiveAdjustmentId(null)} className="px-4 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors">取消</button>
              <button onClick={() => handleAdjustmentSave(activeAdjustmentId)} className="bg-[#1e6ebb] text-white px-4 py-1.5 rounded-md hover:bg-[#155694] transition-colors shadow-sm">確定</button>
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
              自訂項目內容
            </h3>
            <div className="mb-5">
              <input 
                type="text" 
                value={itemEditInput}
                onChange={e => setItemEditInput(e.target.value)}
                className="border border-slate-300 rounded-md px-3 py-1.5 outline-none focus:border-[#1e6ebb] w-full shadow-inner"
                placeholder="輸入項目名稱"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleItemEditSave(activeItemEditId);
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setActiveItemEditId(null)} className="px-4 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors">取消</button>
              <button onClick={() => handleItemEditSave(activeItemEditId)} className="bg-[#1e6ebb] text-white px-4 py-1.5 rounded-md hover:bg-[#155694] transition-colors shadow-sm">確定</button>
            </div>
          </div>
        </div>
      )}
      {/* Back Warning Modal */}
      {showBackWarning && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 print:hidden">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[30rem]">
            <h3 className="text-xl font-bold mb-4 text-slate-800">確定返回？</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">您即將返回商品目錄。請問是否要保留目前的報價明細（包含客戶資料與施工項目）以便繼續使用？</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowBackWarning(false)} 
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                取消返回
              </button>
              <button 
                onClick={() => {
                  setShowBackWarning(false);
                  onNavigateBack(false);
                }} 
                className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors font-medium"
              >
                清除明細並返回
              </button>
              <button 
                onClick={() => {
                  setShowBackWarning(false);
                  onNavigateBack(true);
                }} 
                className="px-4 py-2 bg-[#1e6ebb] text-white rounded-md hover:bg-[#155694] transition-colors font-medium shadow-sm"
              >
                保留明細繼續使用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
