import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBrandDisplayName(brand: string): string {
  let name = brand.split(' ')[0];
  if (name === '重工' || name.includes('重工')) return '重工';
  return name;
}

export function getBrandColor(brand: string, isLightBg: boolean = false): string {
  const name = brand.split(' ')[0];
  if (name.includes('日立')) return isLightBg ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400 border border-red-500/30';
  if (name.includes('國際')) return isLightBg ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
  if (name.includes('聲寶')) return isLightBg ? 'bg-orange-100 text-orange-700' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
  if (name.includes('重工')) return isLightBg ? 'bg-rose-100 text-rose-800' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
  if (name.includes('華菱')) return isLightBg ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
  if (name.includes('大金')) return isLightBg ? 'bg-cyan-100 text-cyan-700' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
  if (name.includes('金鼎')) return isLightBg ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
  
  return isLightBg ? 'bg-slate-100 text-slate-700' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
}
