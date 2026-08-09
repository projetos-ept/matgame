window.MatGame = window.MatGame || {};
MatGame.Seed = class Seed {
  constructor(seed) { this.inicial = String(seed || '1'); this.estado = this.hash(this.inicial) || 1; }
  hash(texto) { let h=2166136261; for (const c of texto) { h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }
  proximo() { let t=this.estado+=0x6D2B79F5; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }
  inteiro(min,max) { return Math.floor(this.proximo()*(max-min+1))+min; }
  escolher(lista) { return lista[Math.floor(this.proximo()*lista.length)]; }
  embaralhar(lista) { const r=[...lista]; for(let i=r.length-1;i;i--){const j=this.inteiro(0,i);[r[i],r[j]]=[r[j],r[i]];} return r; }
};
