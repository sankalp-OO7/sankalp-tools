import React from 'react';

export const LOGO_PATH = '/shamsgs-logo.jpg';
export const BRAND = { website:'shamsgs.com', cta:{ buttonText:'Visit shamsgs.com', linkInBio:'Link in bio \u2197' } };

// ── Aspect ratios ─────────────────────────────────────────────────────────────
export const RATIOS = {
  '1:1':  {w:1080,h:1080, label:'Square',    icon:'⬛'},
  '4:5':  {w:1080,h:1350, label:'Portrait',   icon:'📱'},
  '9:16': {w:1080,h:1920, label:'Story',      icon:'📲'},
  '16:9': {w:1080,h:608,  label:'Landscape',  icon:'🖥'},
} as const;
export type RatioKey = keyof typeof RATIOS;

// ── Themes ────────────────────────────────────────────────────────────────────
export interface ThemeDef { name:string;bg:string;bg2:string;bg3:string;accent:string;accent2:string;accentDim:string;text:string;textSec:string;tagBg:string;tagColor:string;border:string;card:string;footerBg:string;grid:string;coverGrad:string;bgGrad?:string;fontHeadline?:string;fontBody?:string;fontMono?:string;radius?:number; }
export const BUILTIN_THEMES: Record<string,ThemeDef> = {
  news:   {name:'News',   bg:'#050E1C',bg2:'#091628',bg3:'#0d1f38',accent:'#C9A84C',accent2:'#E8C96A',accentDim:'rgba(201,168,76,0.18)', text:'#FFFFFF',textSec:'#A3B8CC',tagBg:'rgba(201,168,76,0.18)', tagColor:'#E8C96A',border:'rgba(201,168,76,0.25)', card:'rgba(201,168,76,0.07)', footerBg:'rgba(5,14,28,0.97)',  grid:'rgba(201,168,76,0.04)', coverGrad:'linear-gradient(150deg,#050E1C 0%,#0d1f38 55%,#091628 100%)'},
  apple:  {name: 'Apple Glass Luxe', bg: '#F5F5F7', bgGrad: 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F7 35%, #E8EAED 100%)', bg2: '#FFFFFF', bg3: '#E8EAED', accent: '#0071E3', accent2: '#7DD3FC', accentDim: 'rgba(0, 113, 227, 0.14)', text: '#111111', textSec: '#6E6E73', tagBg: 'rgba(255, 255, 255, 0.75)', tagColor: '#0071E3', border: 'rgba(17, 17, 17, 0.08)', card: 'rgba(255, 255, 255, 0.7)', footerBg: 'rgba(255, 255, 255, 0.65)', grid: 'rgba(17, 17, 17, 0.04)', coverGrad: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(232,234,237,0.88) 50%, rgba(0,113,227,0.12) 100%)', fontHeadline: "'Syne', sans-serif", fontBody: "'Inter', sans-serif", fontMono: "'Space Mono', monospace", radius: 28},
  markets:{name: 'Markets', bg: '#0B0E14', bg2: '#151A22', bg3: '#1E2530', accent: '#4CAF50', accent2: '#81C784', accentDim: 'rgba(76, 175, 80, 0.15)', text: '#FFFFFF', textSec: '#A0AAB5', tagBg: 'rgba(76, 175, 80, 0.15)', tagColor: '#4CAF50', border: 'rgba(255, 255, 255, 0.1)', card: 'rgba(255, 255, 255, 0.03)', footerBg: 'rgba(11, 14, 20, 0.95)', grid: 'rgba(255, 255, 255, 0.02)', coverGrad: 'linear-gradient(150deg, #0B0E14 0%, #1E2530 55%, #151A22 100%)', fontHeadline: "'Playfair Display', serif", fontBody: "'Inter', sans-serif", fontMono: "'Space Mono', monospace", radius: 8},
  netflix:{name: 'Netflix', bg: '#000000', bg2: '#141414', bg3: '#222222', accent: '#E50914', accent2: '#FF4D4D', accentDim: 'rgba(229, 9, 20, 0.15)', text: '#FFFFFF', textSec: '#B3B3B3', tagBg: 'rgba(229, 9, 20, 0.2)', tagColor: '#E50914', border: 'rgba(255, 255, 255, 0.1)', card: 'rgba(255, 255, 255, 0.05)', footerBg: 'rgba(0, 0, 0, 0.95)', grid: 'rgba(255, 255, 255, 0.03)', coverGrad: 'linear-gradient(150deg, #000000 0%, #222222 55%, #141414 100%)', fontHeadline: "'Inter', sans-serif", fontBody: "'Inter', sans-serif", fontMono: "'Space Mono', monospace", radius: 4},
  spotify:{name: 'Spotify', bg: '#121212', bg2: '#181818', bg3: '#282828', accent: '#1DB954', accent2: '#1ED760', accentDim: 'rgba(29, 185, 84, 0.15)', text: '#FFFFFF', textSec: '#B3B3B3', tagBg: 'rgba(29, 185, 84, 0.15)', tagColor: '#1DB954', border: 'rgba(255, 255, 255, 0.1)', card: 'rgba(255, 255, 255, 0.05)', footerBg: 'rgba(18, 18, 18, 0.95)', grid: 'rgba(255, 255, 255, 0.02)', coverGrad: 'linear-gradient(150deg, #121212 0%, #282828 55%, #181818 100%)', fontHeadline: "'Syne', sans-serif", fontBody: "'Inter', sans-serif", fontMono: "'Space Mono', monospace", radius: 16},
  stripe: {name: 'Stripe', bg: '#F6F9FC', bgGrad: 'linear-gradient(135deg, #F6F9FC 0%, #E3E8EE 100%)', bg2: '#FFFFFF', bg3: '#E3E8EE', accent: '#635BFF', accent2: '#7971FF', accentDim: 'rgba(99, 91, 255, 0.12)', text: '#0A2540', textSec: '#425466', tagBg: 'rgba(99, 91, 255, 0.12)', tagColor: '#635BFF', border: 'rgba(10, 37, 64, 0.08)', card: 'rgba(255, 255, 255, 0.8)', footerBg: 'rgba(246, 249, 252, 0.9)', grid: 'rgba(10, 37, 64, 0.04)', coverGrad: 'linear-gradient(150deg, rgba(246, 249, 252, 0.9) 0%, rgba(227, 232, 238, 0.8) 55%, rgba(99, 91, 255, 0.1) 100%)', fontHeadline: "'Inter', sans-serif", fontBody: "'Inter', sans-serif", fontMono: "'Space Mono', monospace", radius: 12}
};
export function rTheme(key:string, custom:Record<string,ThemeDef>): ThemeDef {
  return BUILTIN_THEMES[key] ?? custom[key] ?? BUILTIN_THEMES.news;
}

// ── LocalStorage keys ─────────────────────────────────────────────────────────
export const LS = { STATE:'cc_state', HISTORY:'cc_history', THEMES:'cc_custom_themes' };

// ── Types ─────────────────────────────────────────────────────────────────────
export type Tab = 'creator'|'builder'|'prompt'|'themes'|'history';
export interface SlideData { slide_type:string;page:number;headline?:string;subheadline?:string;tag?:string;has_screenshot?:boolean;section_label?:string;body?:string;bullets?:string[];stat_number?:string;stat_label?:string;stat_context?:string;quote_text?:string;quote_source?:string;items?:{number:string;text:string}[];cta_headline?:string;cta_body?:string; }
export interface CarouselData { type:string;title:string;category:string;slides:SlideData[]; }
export interface ImgAdj { panX:number;panY:number;scale:number; }
export const defAdj:ImgAdj = {panX:0,panY:0,scale:1};
export type ExtraShape = 'circle'|'rounded'|'square';
export type ExtraPos   = 'tr'|'br'|'bl'|'tl'|'cr';
export interface ExtraImg { src:string;shape:ExtraShape;pos:ExtraPos;size:number;adj:ImgAdj; }
export interface HistoryItem { id:string;title:string;savedAt:string;jsonText:string;theme:string;ratio:RatioKey;align:{tag:number;bullet:number;footer:number;statNum:number;heading:number;subHead:number;secLabel:number;listNum:number;listText:number;quote:number;ctaBtn:number;coverFade?:number};imgAdjs:Record<number,ImgAdj>; }
export const defAlign = {tag:-9,bullet:9,footer:-9,statNum:-120,heading:-30,subHead:-9,secLabel:-9,listNum:-9,listText:-9,quote:-9,ctaBtn:-9,coverFade:240};
export function extraPos(p:ExtraPos,sz:number):React.CSSProperties{const m=50,hH=72,fH=58,b:React.CSSProperties={position:'absolute',width:sz,height:sz,zIndex:5};switch(p){case'tr':return{...b,top:hH+m,right:m};case'br':return{...b,bottom:fH+m,right:m};case'bl':return{...b,bottom:fH+m,left:m};case'tl':return{...b,top:hH+m,left:m};case'cr':return{...b,top:'50%',right:m,transform:'translateY(-50%)'};}}

export const clamp = (s:string|undefined, n:number) => s ? String(s).slice(0,n) : '';
