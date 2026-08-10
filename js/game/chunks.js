window.MatGame = window.MatGame || {};
MatGame.CHUNKS = [
 {id:'CHAO',dificuldade:1,largura:960,pontoEntrada:560,pontoSaida:560,peso:4,permiteDesafio:false,pontuacaoMaxima:50,plataformas:[[0,620,960,100],[260,510,170,24],[570,450,180,24]]},
 {id:'DEGRAUS',dificuldade:1,largura:960,pontoEntrada:560,pontoSaida:560,peso:3,permiteDesafio:false,pontuacaoMaxima:50,plataformas:[[0,620,250,100],[310,550,160,24],[530,490,160,24],[750,620,210,100]]},
 {id:'PONTES',dificuldade:2,largura:960,pontoEntrada:560,pontoSaida:560,peso:3,permiteDesafio:false,pontuacaoMaxima:50,plataformas:[[0,620,220,100],[280,520,200,24],[550,440,160,24],[770,620,190,100]],obstaculos:[[820,580,22,40],[844,580,22,40],[868,580,22,40]]},
 {id:'ESTACAO',dificuldade:1,largura:960,pontoEntrada:560,pontoSaida:560,peso:2,permiteDesafio:true,pontuacaoMaxima:250,plataformas:[[0,620,960,100],[310,500,170,24],[600,530,150,24]],estacao:[790,550]},
 {id:'BONUS',dificuldade:2,largura:960,pontoEntrada:560,pontoSaida:560,peso:1,permiteDesafio:false,pontuacaoMaxima:100,plataformas:[[0,620,180,100],[240,540,150,24],[450,470,150,24],[660,540,150,24],[870,620,90,100]]},
 {id:'CHECKPOINT',dificuldade:1,largura:960,pontoEntrada:560,pontoSaida:560,peso:1,permiteDesafio:false,pontuacaoMaxima:250,checkpoint:[500,540],plataformas:[[0,620,960,100]]}
];
