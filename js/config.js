window.MatGame = window.MatGame || {};

MatGame.CONFIG = Object.freeze({
  largura: 1280,
  altura: 720,
  gravidade: 1900,
  velocidade: 300,
  pulo: 680,
  debug: false,
  mundo: {
    larguraChunk: 960,
    gerarAdiante: 2200,
    intervaloDesafioChunks: 3,
    moedasPorChunk: 5,
    dificuldadeACada: 5,
    dificuldadeTempoSegundos: 55
  },
  tempo: {
    inicial: 80,
    moeda: 1.5,
    estrela: 12,
    pisarBicho: 5,
    colisaoBicho: 3,
    mago: 30,
    magoDuracao: 10,
    magoIntervalo: 45,
    perguntaBonusMaximo: 18,
    respostaMuitoRapidaAte: 6,
    respostaRapidaAte: 12,
    bonusMuitoRapido: 8,
    bonusRapido: 5,
    bonusComCalma: 3
  },
  pontos: {
    moeda: 10,
    tabuada: 100,
    expressao: 100,
    dinheiro: 100,
    interpretacao: 150,
    calculo: 50,
    primeiraTentativa: 50,
    especial: 50,
    checkpoint: 200
  },
  categorias: { tabuada: 30, expressao: 25, dinheiro: 20, problema: 25 },
  cores: { ceu: '#13294b', ceu2: '#24527a', chao: '#38a169', ouro: '#ffd166', tinta: '#f7fafc' }
});
