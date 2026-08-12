window.MatGame = window.MatGame || {};

/** Sons opcionais locais. Arquivos ausentes nunca interrompem a partida. */
MatGame.SoundEffects = class {
  constructor() {
    this.pasta = 'assets/audio/effects/';
    this.arquivos = Object.freeze({
      abertura: 'musica_abertura.ogg',
      gameOver: 'game_over.ogg',
      cliqueMenu: 'clique_menu.ogg',
      pulo: 'pulo.ogg',
      estrela: 'coletar_estrela.ogg',
      dragaoTiro: 'dragao_tiro_fogo.ogg',
      bumerangue: 'bumerangue_lancamento.ogg',
      bossAparece: 'boss_aparece.ogg',
      bossTiro: 'boss_tiro.ogg',
      gigantePule: 'gigante_pule.ogg'
    });
    this.indisponiveis = new Set();
    this.abertura = null;
  }

  tocar(nome) {
    const arquivo = this.arquivos[nome];
    if (!arquivo || this.indisponiveis.has(nome)) return;
    const audio = new Audio(this.pasta + arquivo);
    audio.volume = MatGame.CONFIG.audio.volumeEfeitos;
    audio.addEventListener('error', () => this.indisponiveis.add(nome), { once: true });
    const tentativa = audio.play();
    if (tentativa?.catch) tentativa.catch(() => {});
  }

  tocarAbertura() {
    if (this.abertura) {
      const novaTentativa = this.abertura.play();
      if (novaTentativa?.catch) novaTentativa.catch(() => {});
      return;
    }
    if (this.indisponiveis.has('abertura')) return;
    const audio = new Audio(this.pasta + this.arquivos.abertura);
    audio.loop = true;
    audio.volume = MatGame.CONFIG.audio.volumeAbertura;
    audio.addEventListener('error', () => {
      this.indisponiveis.add('abertura');
      if (this.abertura === audio) this.pararAbertura();
    }, { once: true });
    this.abertura = audio;
    const tentativa = audio.play();
    if (tentativa?.catch) tentativa.catch(() => {});
  }

  pararAbertura() {
    if (!this.abertura) return;
    this.abertura.pause();
    this.abertura.removeAttribute('src');
    this.abertura.load();
    this.abertura = null;
  }
};
