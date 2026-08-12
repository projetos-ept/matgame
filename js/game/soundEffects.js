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
      gigantePule: 'gigante_pule.ogg',
      acerto: 'resposta_correta.ogg',
      erro: 'resposta_errada.ogg',
      fantasma: 'fantasma_aparece.ogg'
    });
    this.indisponiveis = new Set();
    this.abertura = null;
    this.pools = new Map();
    // Pré-carrega pequenos pools. A rajada tripla do dragão reutiliza elementos
    // já decodificados em vez de criar três Audio e decodificar OGG no ataque.
    this.pools.set('dragaoTiro', Array.from({ length: 3 }, () => this.criarAudio('dragaoTiro')));
  }

  criarAudio(nome) {
    const audio = new Audio(this.pasta + this.arquivos[nome]);
    audio.volume = MatGame.CONFIG.audio.volumeEfeitos;
    audio.preload = 'auto';
    audio.addEventListener('error', () => this.indisponiveis.add(nome), { once: true });
    return audio;
  }

  tocar(nome) {
    const arquivo = this.arquivos[nome];
    if (!arquivo || this.indisponiveis.has(nome)) return;
    if (!this.pools.has(nome)) this.pools.set(nome, Array.from({ length: 2 }, () => this.criarAudio(nome)));
    const pool = this.pools.get(nome);
    let audio = pool.find((item) => item.paused || item.ended);
    if (!audio) audio = pool[0];
    try { audio.currentTime = 0; } catch (erro) { /* metadados ainda carregando */ }
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
