import { ACProduct } from './types';

// 模擬從雲端試算表匯入的資料
// 實務上這段可以使用 fetch('https://docs.google.com/spreadsheets/d/.../export?format=csv')
// 來取得最新資料並透過 papaparse 解析
export const MOCK_AC_PRODUCTS: ACProduct[] = [
  // === 日立 (Hitachi) ===
  { id: 'h-1', brand: '日立 (Hitachi)', model: 'RAS-22NJP1/RAC-22NP', type: '壁掛型', kind: '變頻', pipeSize: '2/3', environment: '暖氣', indoorDimensions: '840 × 315 × 270', outdoorDimensions: '730 × 600 × 290', price: 26300, note: 'H22' },
  { id: 'h-2', brand: '日立 (Hitachi)', model: 'RAS-28NJP1/RAC-28NP', type: '壁掛型', kind: '變頻', pipeSize: '2/3', environment: '暖氣', indoorDimensions: '840 × 315 × 270', outdoorDimensions: '730 × 600 × 290', price: 30200, note: 'H28' },
  { id: 'h-3', brand: '日立 (Hitachi)', model: 'RAS-36NJP1/RAC-36JP', type: '壁掛型', kind: '變頻', pipeSize: '2/3', environment: '冷氣', indoorDimensions: '940 × 315 × 270', outdoorDimensions: '810 × 685 × 300', price: 35700, note: 'H36' },
  { id: 'h-4', brand: '日立 (Hitachi)', model: 'RAD-50NJP1/RAC-50NP', type: '埋入型', kind: '變頻', pipeSize: '2/4', environment: '暖氣', indoorDimensions: '', outdoorDimensions: '810 × 685 × 300', price: 44000, note: 'H50' },
  { id: 'h-5', brand: '日立 (Hitachi)', model: 'RAM-50YP', type: '多聯', kind: '變頻', pipeSize: '2/3*2', environment: '暖氣', indoorDimensions: '', outdoorDimensions: '810 × 685 × 300', price: 24100, note: 'Hivx' },
  { id: 'h-6', brand: '日立 (Hitachi)', model: 'RAS-22NJP1', type: '多聯', kind: '變頻', pipeSize: '2/3', environment: '內機', indoorDimensions: '', outdoorDimensions: '', price: 14500, note: 'Hivx' },

  // === 國際 (Panasonic) ===
  { id: 'p-1', brand: '國際 (Panasonic)', model: 'CS-UK22BA2/CU-UK22BHA2', type: '壁掛型', kind: '變頻', pipeSize: '2/3', environment: '暖氣', indoorDimensions: '798 × 295 × 241', outdoorDimensions: '780 × 582 × 289', price: 17700, note: 'P22' },
  { id: 'p-2', brand: '國際 (Panasonic)', model: 'CS-UK28BA2/CU-UK28BHA2', type: '壁掛型', kind: '變頻', pipeSize: '2/3', environment: '暖氣', indoorDimensions: '798 × 295 × 241', outdoorDimensions: '780 × 582 × 289', price: 21300, note: 'P28' },
  { id: 'p-3', brand: '國際 (Panasonic)', model: 'CS-UK22BA2/CU-UK22BCA2', type: '壁掛型', kind: '變頻', pipeSize: '2/3', environment: '冷氣', indoorDimensions: '798 × 295 × 241', outdoorDimensions: '780 × 582 × 289', price: 15900, note: 'P22' },
  { id: 'p-4', brand: '國際 (Panasonic)', model: 'CW-R22H(L)A2', type: '窗型', kind: '變頻', pipeSize: '', environment: '暖氣', indoorDimensions: '560 × 346 × 655', outdoorDimensions: '', price: 19700, note: 'P22' },
  { id: 'p-5', brand: '國際 (Panasonic)', model: 'CS-J22BDA2/CU-UX22FHA2', type: '埋入型', kind: '變頻', pipeSize: '2/3', environment: '暖氣', indoorDimensions: '', outdoorDimensions: '780 × 582 × 289', price: 22700, note: 'P22' },
  { id: 'p-6', brand: '國際 (Panasonic)', model: 'CU-2J45FHA2', type: '多聯', kind: '變頻', pipeSize: '2/3*2', environment: '暖氣', indoorDimensions: '', outdoorDimensions: '780 × 540 × 289', price: 23000, note: 'Pivx' },

  // === 金鼎 (Jin Ting) ===
  { id: 'j-1', brand: '金鼎 (Jin Ting)', model: 'JSV-28XT/JCV-28XT', type: '壁掛型', kind: '變頻', pipeSize: '2/3', environment: '暖氣', indoorDimensions: '870 × 295 × 190', outdoorDimensions: '785 × 530 × 290', price: 14200, note: 'J28' },
  { id: 'j-2', brand: '金鼎 (Jin Ting)', model: 'HRV-36XT/JCV-36XT', type: '埋入型', kind: '變頻', pipeSize: '2/3', environment: '暖氣', indoorDimensions: '930 × 290 × 550', outdoorDimensions: '785 × 530 × 290', price: 22800, note: 'J36' },
  { id: 'j-3', brand: '金鼎 (Jin Ting)', model: 'JW-282H', type: '窗型', kind: '變頻', pipeSize: '', environment: '暖氣', indoorDimensions: '580 × 360 × 655', outdoorDimensions: '', price: 17500, note: 'J28' },

  // === 聲寶 (Sampo) ===
  { id: 's-1', brand: '聲寶 (Sampo)', model: 'AW-PF28D(右吹)', type: '窗型', kind: '變頻', pipeSize: '', environment: '冷氣', indoorDimensions: '470 × 360 × 675', outdoorDimensions: '', price: 16600, note: 'S28' },
  { id: 's-2', brand: '聲寶 (Sampo)', model: 'AW-R(L)H28DC', type: '窗型', kind: '變頻', pipeSize: '', environment: '暖氣', indoorDimensions: '580 × 360 × 655', outdoorDimensions: '', price: 17500, note: 'S28' },

  // === 重工 (Mitsubishi Heavy) ===
  { id: 'm-1', brand: '重工 (Mitsubishi Heavy)', model: 'DXK25ZST2-W/DXC25ZST2-W', type: '壁掛型', kind: '變頻', pipeSize: '2/3', environment: '暖氣', indoorDimensions: '870 × 290 × 230', outdoorDimensions: '780 × 540 × 290', price: 29000, note: 'D28' },
  { id: 'm-2', brand: '重工 (Mitsubishi Heavy)', model: 'DXM45ZST-W', type: '多聯', kind: '變頻', pipeSize: '2/3*2', environment: '暖氣', indoorDimensions: '', outdoorDimensions: '', price: 34400, note: 'Zivx' },

  // === 華菱 (Hawrin) ===
  { id: 'hw-1', brand: '華菱 (Hawrin)', model: 'RS-28IHU / RO-28IHU', type: '壁掛型', kind: '變頻', pipeSize: '2/3', environment: '暖氣', indoorDimensions: '805 × 270 × 215', outdoorDimensions: '870 × 540 × 320', price: 14800, note: 'B28' },
  { id: 'hw-2', brand: '華菱 (Hawrin)', model: 'RS-28ICU / RO-28ICU', type: '壁掛型', kind: '變頻', pipeSize: '2/3', environment: '冷氣', indoorDimensions: '805 × 270 × 215', outdoorDimensions: '870 × 540 × 320', price: 13600, note: 'B28' },
  { id: 'hw-3', brand: '華菱 (Hawrin)', model: 'RNR(L)-29IHU', type: '窗型', kind: '變頻', pipeSize: '', environment: '暖氣', indoorDimensions: '560 × 350 × 655', outdoorDimensions: '', price: 18100, note: 'B28' },
];

export const COMMON_CONSTRUCTION_ITEMS = [
  '銅管含電源線&控制線',
  '室外機安裝架',
  '牆體洗孔',
  '分離式安裝工資',
  '保養工資',
  '移機工資',
  '美化管槽',
  '外牆高空作業',
  '切溝配管含水泥回填',
  '排水器',
  '其他'
];

export const CONSTRUCTION_ITEM_PRICES: Record<string, number> = {
  '牆體洗孔': 1000,
  '分離式安裝工資': 3500,
  '外牆高空作業': 6000,
  '排水器': 2000
};

export const BRANDS = Array.from(new Set(MOCK_AC_PRODUCTS.map(p => p.brand)));
