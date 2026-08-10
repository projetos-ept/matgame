window.MatGame = window.MatGame || {};

MatGame.Placar = class Placar {
  constructor() {
    this.pontos = 0;
    this.maximo = 0;
    this.combo = 0;
    this.comboMaximo = 0;
    this.stats = { tabuada: [0, 0], expressao: [0, 0], dinheiro: [0, 0], problema: [0, 0], interpretacao: [0, 0], calculo: [0, 0] };
  }
  adicionar(valor, maximo = valor) { this.pontos += valor; this.maximo += maximo; }
  responder(categoria, acertou, pontos, maximo = pontos) {
    this.stats[categoria][1] += 1;
    if (acertou) {
      this.stats[categoria][0] += 1;
      this.combo += 1;
      this.comboMaximo = Math.max(this.comboMaximo, this.combo);
      this.adicionar(pontos, maximo);
    } else {
      this.combo = 0;
      this.maximo += maximo;
    }
  }
  percentual(categoria) {
    const [acertos, tentativas] = this.stats[categoria];
    return tentativas ? Math.round(acertos / tentativas * 100) : 0;
  }
};

MatGame.Recordes = {
  chave: 'aventura-matematica-recordes-v1',
  chaveRanking: 'aventura-matematica-ranking-v1',
  ler() {
    try { return JSON.parse(localStorage.getItem(this.chave)) || {}; } catch (erro) { return {}; }
  },
  salvar(modo, resultado) {
    const todos = this.ler();
    const anterior = todos[modo] || {};
    todos[modo] = {
      pontos: Math.max(anterior.pontos || 0, resultado.pontos),
      distancia: Math.max(anterior.distancia || 0, resultado.distancia),
      combo: Math.max(anterior.combo || 0, resultado.comboMaximo)
    };
    try { localStorage.setItem(this.chave, JSON.stringify(todos)); } catch (erro) { /* armazenamento indisponível */ }
    return todos[modo];
  },
  ranking() {
    try { return JSON.parse(localStorage.getItem(this.chaveRanking)) || []; } catch (erro) { return []; }
  },
  registrarAluno(resultado) {
    const ranking = this.ranking();
    const entrada = { aluno: resultado.aluno, pontos: resultado.pontos, distancia: resultado.distancia, seed: resultado.seed, data: Date.now() };
    ranking.push(entrada);
    ranking.sort((a, b) => b.pontos - a.pontos || b.distancia - a.distancia);
    const melhores = ranking.slice(0, 50);
    try { localStorage.setItem(this.chaveRanking, JSON.stringify(melhores)); } catch (erro) { /* armazenamento indisponível */ }
    const posicao = melhores.indexOf(entrada);
    return posicao >= 0 ? posicao + 1 : null;
  }
};
