import React from 'react';
import { HistoryItem, RATIOS } from '../types';

export default function HistoryPanel({ history, loadHistory, delHistory }:{ history:HistoryItem[]; loadHistory:(h:HistoryItem)=>void; delHistory:(id:string)=>void; }) {
  return (
    <div style={{display:'flex',gap:24,height:'calc(100vh - 160px)',flexWrap:'wrap',alignContent:'flex-start'}}>
      {history.length===0 && <div style={{width:'100%',textAlign:'center',paddingTop:100,color:'#6b6b80',fontFamily:"'Space Mono',monospace",fontSize:14}}>No history saved yet. Use "💾 Save to History" in the Creator tab.</div>}
      {history.map(h=>(
        <div key={h.id} style={{width:340,padding:20,borderRadius:12,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#fff',marginBottom:8}}>{h.title}</div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:'#6b6b80',marginBottom:16}}>{new Date(h.savedAt).toLocaleString()}</div>
          <div style={{display:'flex',gap:8,marginBottom:20}}>
            <span style={{background:'rgba(201,168,76,0.15)',color:'#E8C96A',border:'1px solid rgba(201,168,76,0.3)',padding:'4px 10px',borderRadius:20,fontSize:10,fontFamily:"'Space Mono',monospace"}}>{h.theme}</span>
            <span style={{background:'rgba(255,255,255,0.05)',color:'#A3B8CC',border:'1px solid rgba(255,255,255,0.1)',padding:'4px 10px',borderRadius:20,fontSize:10,fontFamily:"'Space Mono',monospace"}}>{RATIOS[h.ratio].label}</span>
          </div>
          <div style={{display:'flex',gap:12}}>
            <button onClick={()=>loadHistory(h)} style={{flex:1,background:'linear-gradient(135deg,#1a6fa8,#2a8fd4)',color:'#fff',border:'none',padding:'8px 0',borderRadius:6,cursor:'pointer',fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700}}>▶ LOAD</button>
            <button onClick={()=>delHistory(h.id)} style={{background:'rgba(224,92,92,.1)',border:'1px solid rgba(224,92,92,.3)',color:'#e05c5c',padding:'8px 16px',borderRadius:6,cursor:'pointer',fontFamily:"'Space Mono',monospace",fontSize:11}}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}
