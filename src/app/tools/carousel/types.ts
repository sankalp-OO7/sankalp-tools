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
  tech:   {name:'Tech',   bg:'#050E1C',bg2:'#060820',bg3:'#080A2A',accent:'#00C8FF',accent2:'#7B61FF',accentDim:'rgba(0,200,255,0.15)', text:'#FFFFFF',textSec:'#8BA5C8',tagBg:'rgba(0,200,255,0.15)', tagColor:'#00C8FF',border:'rgba(0,200,255,0.2)',  card:'rgba(0,200,255,0.06)', footerBg:'rgba(5,14,28,0.97)',  grid:'rgba(0,200,255,0.04)', coverGrad:'linear-gradient(150deg,#050E1C 0%,#080A2A 55%,#060820 100%)'},
  viral:  {name:'Viral',  bg:'#0D0118',bg2:'#160225',bg3:'#1E0335',accent:'#FF3CAC',accent2:'#784BA0',accentDim:'rgba(255,60,172,0.22)', text:'#FFFFFF',textSec:'#D4A8E8',tagBg:'rgba(255,60,172,0.18)',tagColor:'#FF85E1',border:'rgba(255,60,172,0.3)', card:'rgba(255,60,172,0.08)',footerBg:'rgba(13,1,24,0.97)',  grid:'rgba(255,60,172,0.05)',coverGrad:'linear-gradient(150deg,#0D0118 0%,#1E0335 55%,#160225 100%)'},
  luxury: {name:'Luxury', bg:'#080710',bg2:'#0F0E1C',bg3:'#161428',accent:'#C0917A',accent2:'#E8C4A8',accentDim:'rgba(192,145,122,0.2)',text:'#F0EAE0',textSec:'#9C8E82',tagBg:'rgba(192,145,122,0.15)',tagColor:'#E8C4A8',border:'rgba(192,145,122,0.25)',card:'rgba(192,145,122,0.07)',footerBg:'rgba(8,7,16,0.97)',   grid:'rgba(192,145,122,0.04)',coverGrad:'linear-gradient(150deg,#080710 0%,#161428 55%,#0F0E1C 100%)'},
  mint:   {name:'Mint',   bg:'#021812',bg2:'#02261C',bg3:'#033326',accent:'#00E5A0',accent2:'#40FFB5',accentDim:'rgba(0,229,160,0.18)', text:'#FFFFFF',textSec:'#82C8AC',tagBg:'rgba(0,229,160,0.15)', tagColor:'#40FFB5',border:'rgba(0,229,160,0.25)', card:'rgba(0,229,160,0.07)', footerBg:'rgba(2,24,18,0.97)',   grid:'rgba(0,229,160,0.04)', coverGrad:'linear-gradient(150deg,#021812 0%,#033326 55%,#02261C 100%)'},
  hacker: {name:'Hacker', bg:'#0A0A0A',bg2:'#111111',bg3:'#181818',accent:'#00FF41',accent2:'#008F11',accentDim:'rgba(0,255,65,0.15)', text:'#FFFFFF',textSec:'#A0A0A0',tagBg:'rgba(0,255,65,0.15)', tagColor:'#00FF41',border:'rgba(0,255,65,0.2)', card:'rgba(0,255,65,0.05)', footerBg:'rgba(10,10,10,0.97)', grid:'rgba(0,255,65,0.03)', coverGrad:'linear-gradient(150deg,#0A0A0A 0%,#181818 55%,#111111 100%)'},
  ocean:  {name:'Ocean',  bg:'#001018',bg2:'#001828',bg3:'#002038',accent:'#00E5FF',accent2:'#00A2FF',accentDim:'rgba(0,229,255,0.15)', text:'#FFFFFF',textSec:'#B0D0E0',tagBg:'rgba(0,229,255,0.15)', tagColor:'#00E5FF',border:'rgba(0,229,255,0.2)', card:'rgba(0,229,255,0.05)', footerBg:'rgba(0,16,24,0.97)', grid:'rgba(0,229,255,0.03)', coverGrad:'linear-gradient(150deg,#001018 0%,#002038 55%,#001828 100%)'}
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
