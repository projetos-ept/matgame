window.MatGame = window.MatGame || {};

/** Trilha OGG local por cenário, reproduzida nativamente pelo navegador. */
MatGame.Soundtrack = class {
  constructor() {
    this.faixas = [
      'assets/audio/soundtrack/NinjaForest.ogg',
      'assets/audio/soundtrack/T_SoldierBlade_Track03.ogg',
      'assets/audio/soundtrack/Zone1-MG.ogg',
      'assets/audio/soundtrack/City_Hunter_Level_1.ogg',
      'assets/audio/soundtrack/salalvl2.ogg'
    ];
    this.indice = -1;
    this.audio = null;
    this.pausada = false;
    this.indisponiveis = new Set();
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
    audio.preload = 'auto';
    audio.addEventListener('error', () => {
      this.indisponiveis.add(indice);
      if (this.audio === audio) this.pararAudioAtual();
    }, { once: true });
    this.audio = audio;
    if (!this.pausada) this.reproduzir(audio);
  }

  reproduzir(audio = this.audio) {
    if (!audio) return;
    const tentativa = audio.play();
    // Autoplay bloqueado não é arquivo inválido: uma retomada posterior tenta de novo.
    if (tentativa?.catch) tentativa.catch(() => {});
  }

  pausar() {
    this.pausada = true;
    this.audio?.pause();
  }

  continuar() {
    this.pausada = false;
    this.reproduzir();
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
