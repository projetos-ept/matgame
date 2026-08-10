window.MatGame = window.MatGame || {};
MatGame.formatarReais=c=>`R$ ${Math.floor(c/100)},${String(c%100).padStart(2,'0')}`;
MatGame.SeletorQuestoes=class {constructor(banco,rng){this.banco=banco;this.rng=rng;this.ultimas=[];}
 categoria(){const urna=Object.entries(MatGame.CONFIG.categorias).flatMap(([c,p])=>Array(p).fill(c));return this.rng.escolher(urna);}
 selecionar(cat,nivel=1){const mapa={tabuada:'tabuadas',expressao:'expressoes',dinheiro:'dinheiro',problema:'problemas'};let pool=this.banco[mapa[cat]].filter(q=>q.dificuldade<=nivel+1&&!this.ultimas.includes(q.id));if(!pool.length)pool=this.banco[mapa[cat]];return this.preparar(this.rng.escolher(pool),cat);}
 selecionarDificil(){let pool=this.banco.problemas.filter(q=>q.dificuldade>=3&&!this.ultimas.includes(q.id));if(!pool.length)pool=this.banco.problemas.filter(q=>q.dificuldade>=3);return this.preparar(this.rng.escolher(pool),'problema');}
 preparar(original,cat){const q=JSON.parse(JSON.stringify(original));this.ultimas.push(q.id);if(this.ultimas.length>5)this.ultimas.shift();q.alternativas=this.rng.embaralhar(q.alternativas);if(cat==='dinheiro')q.alternativasExibicao=q.alternativas.map(MatGame.formatarReais);return q;}}
