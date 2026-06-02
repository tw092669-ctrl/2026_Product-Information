export type ACType = 
  | '壁掛' 
  | '埋入' 
  | '窗型' 
  | '落地' 
  | '四方吹' 
  | '多聯內機' 
  | '多聯外機';

export type ACMode = '整組' | '多聯';

export interface ACProduct {
  id: string;
  brand: string;        // 品牌
  model: string;        // 產品名稱
  type: ACType | string; // 樣式 (維持 filtering compatibility)
  kind?: string;        // 種類 (e.g. 變頻)
  pipeSize?: string;    // 管徑 (e.g. 2/3)
  environment?: string; // 環境 (e.g. 暖氣)
  indoorDimensions?: string;  // 室內機尺寸
  outdoorDimensions?: string; // 室外機尺寸
  dimensions?: string;  // 舊版尺寸 (Fallback)
  price: number;        // 價格
  note?: string;        // 備註
}

export interface QuoteProduct extends ACProduct {
  quantity: number;
  originalId?: string;
  location?: string; // 位置
  power?: string;    // 功率(KW)
  notes?: string;    // 備註
}

export interface QuoteConstructionItem {
  id: string;
  name: string;
  spec?: string;     // 規格
  price: number;
  quantity: number;
}

export interface AppState {
  selectedProducts: QuoteProduct[];
}
