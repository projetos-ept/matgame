window.MatGame = window.MatGame || {};
MatGame.Gerador = class Gerador {
 constructor(seed){this.rng=new MatGame.Seed(seed);this.indice=0;this.ultimoDesafio=-99;}
 dificuldade(){return Math.min(3,1+Math.floor(this.indice/MatGame.CONFIG.mundo.dificuldadeACada));}
 proximo(){let disponiveis=MatGame.CHUNKS.filter(c=>c.dificuldade<=this.dificuldade() && (!c.permiteDesafio || this.indice-this.ultimoDesafio>=MatGame.CONFIG.mundo.intervaloDesafioChunks));let urna=disponiveis.flatMap(c=>Array(c.peso).fill(c));let c=this.rng.escolher(urna);if(c.permiteDesafio)this.ultimoDesafio=this.indice;this.indice++;return c;}
 sequencia(n){return Array.from({length:n},()=>this.proximo().id);}
};
