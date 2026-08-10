window.MatGame = window.MatGame || {};
MatGame.Placar = class Placar { constructor(){this.pontos=0;this.maximo=0;this.combo=0;this.comboMaximo=0;this.stats={tabuada:[0,0],expressao:[0,0],dinheiro:[0,0],problema:[0,0],interpretacao:[0,0],calculo:[0,0]};}
 adicionar(valor,maximo=valor){this.pontos+=valor;this.maximo+=maximo;}
 responder(cat,acertou,pontos,maximo=pontos){this.stats[cat][1]++;if(acertou){this.stats[cat][0]++;this.combo++;this.comboMaximo=Math.max(this.comboMaximo,this.combo);this.adicionar(pontos,maximo);}else{this.combo=0;this.maximo+=maximo;}}
 percentual(k){const [a,t]=this.stats[k];return t?Math.round(a/t*100):0;}
};
MatGame.Recordes={chave:'aventura-matematica-recordes-v1',ler(){try{return JSON.parse(localStorage.getItem(this.chave))||{};}catch(e){return{};}},salvar(modo,r){const todos=this.ler(),ant=todos[modo]||{};todos[modo]={pontos:Math.max(ant.pontos||0,r.pontos),distancia:Math.max(ant.distancia||0,r.distancia),combo:Math.max(ant.combo||0,r.comboMaximo)};try{localStorage.setItem(this.chave,JSON.stringify(todos));}catch(e){}return todos[modo];}};
