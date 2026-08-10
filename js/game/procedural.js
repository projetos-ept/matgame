window.MatGame = window.MatGame || {};

MatGame.Gerador = class Gerador {
  constructor(seed) {
    this.rng = new MatGame.Seed(seed);
    this.indice = 0;
    this.ultimoDesafio = -99;
    this.tempoDecorrido = 0;
  }

  dificuldade() {
    const porDistancia = Math.floor(this.indice / MatGame.CONFIG.mundo.dificuldadeACada);
    return Math.min(3, 1 + porDistancia);
  }

  dificuldadeMotora() {
    const porTempo = Math.floor(this.tempoDecorrido / MatGame.CONFIG.mundo.dificuldadeTempoSegundos);
    return Math.min(3, Math.max(this.dificuldade(), 1 + porTempo));
  }

  proximo() {
    const disponiveis = MatGame.CHUNKS.filter((chunk) =>
      chunk.dificuldade <= this.dificuldade()
      && (!chunk.permiteDesafio
        || this.indice - this.ultimoDesafio >= MatGame.CONFIG.mundo.intervaloDesafioChunks)
    );
    const urna = disponiveis.flatMap((chunk) => Array(chunk.peso).fill(chunk));
    const chunk = this.rng.escolher(urna);
    if (chunk.permiteDesafio) this.ultimoDesafio = this.indice;
    this.indice += 1;
    return chunk;
  }

  sequencia(quantidade) {
    return Array.from({ length: quantidade }, () => this.proximo().id);
  }
};
