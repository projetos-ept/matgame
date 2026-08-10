window.MatGame = window.MatGame || {};

/**
 * Trilha local por cenário. O navegador pode não possuir decodificador MIDI;
 * nesse caso a falha é silenciosa e nunca impede o jogo de continuar.
 */
MatGame.Soundtrack = class {
  constructor() {
    this.faixas = [
      'assets/audio/soundtrack/NinjaForest.mid',
      'assets/audio/soundtrack/T_SoldierBlade_Track03.mid',
      'assets/audio/soundtrack/Zone1-MG.mid',
      'assets/audio/soundtrack/City_Hunter_Level_1.mid',
      'assets/audio/soundtrack/salalvl2.mid'
    ];
    this.indice = -1;
    this.audio = null;
    this.indisponiveis = new Set();
    this.pausada = false;
  }

  iniciar() {
    this.pausada = false;
    this.tocar(0);
  }

  atualizar(distancia) {
    this.tocar(Math.floor(distancia / 500) % this.faixas.length);
  }

  tocar(indice) {
    if (indice === this.indice || this.indisponiveis.has(indice)) return;
    this.pararAudioAtual();
    this.indice = indice;
    const audio = new Audio(this.faixas[indice]);
    audio.loop = true;
    audio.volume = MatGame.CONFIG.audio.volumeTrilha;
    audio.preload = 'none';
    const ignorarFalha = () => {
      this.indisponiveis.add(indice);
      if (this.audio === audio) this.pararAudioAtual();
    };
    audio.addEventListener('error', ignorarFalha, { once: true });
    this.audio = audio;
    if (!this.pausada) {
      const tentativa = audio.play();
      if (tentativa?.catch) tentativa.catch(ignorarFalha);
    }
  }

  pausar() {
    this.pausada = true;
    this.audio?.pause();
  }

  continuar() {
    this.pausada = false;
    if (!this.audio) return;
    const tentativa = this.audio.play();
    if (tentativa?.catch) tentativa.catch(() => {});
  }

  pararAudioAtual() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
    this.audio = null;
  }

  parar() {
    this.pausada = false;
    this.indice = -1;
    this.pararAudioAtual();
  }
};
