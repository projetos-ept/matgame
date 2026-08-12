window.addEventListener('DOMContentLoaded', async () => {
  const app = {
    canvas: document.querySelector('#game'),
    panel: document.querySelector('#panel'),
    hud: document.querySelector('#hud'),
    pause: document.querySelector('#pause'),
    debug: false,
    pausado: false,
    cena: null,

    parar() {
      document.querySelector('#app').classList.remove('alerta-tempo', 'urgencia');
      const avisoTempo = document.querySelector('#time-warning');
      avisoTempo.classList.add('hidden');
      avisoTempo.textContent = '';
      if (this.cena) this.cena.destruir();
      this.soundtrack?.parar();
      this.cena = null;
      this.hud.classList.add('hidden');
      this.pause.classList.add('hidden');
    },

    iniciar(seed, modo, aluno, personagem) {
      this.parar();
      this.seed = String(seed);
      this.modo = modo;
      this.aluno = aluno;
      this.personagem = personagem;
      this.distancia = 0;
      this.tempoRestante = MatGame.CONFIG.tempo.inicial;
      this.tempoDecorrido = 0;
      this.coringa = false;
      this.reciclagens = 0;
      this.placar = new MatGame.Placar();
      this.gerador = new MatGame.Gerador(this.seed);
      this.powerRng = new MatGame.Seed(`${this.seed}-poderes`);
      this.seletor = new MatGame.SeletorQuestoes(this.banco, new MatGame.Seed(`${this.seed}-questoes`));
      this.panel.classList.add('hidden');
      this.hud.classList.remove('hidden');
      this.pause.classList.remove('hidden');
      this.cena = new MatGame.GameScene(this);
      this.cena.iniciar();
      this.soundtrack ||= new MatGame.Soundtrack();
      this.soundtrack.iniciar();
    },

    adicionarTempo(segundos) {
      this.tempoRestante += segundos;
      this.ultimoBonusTempo = { segundos, ate: performance.now() + 1300 };
    },

    atualizarHud() {
      const recorde = MatGame.Recordes.ler()[this.modo]?.pontos || 0;
      const bonusAtivo = this.ultimoBonusTempo && performance.now() < this.ultimoBonusTempo.ate;
      const valorBonus = bonusAtivo ? this.ultimoBonusTempo.segundos.toFixed(1).replace('.0', '') : '';
      const bonus = bonusAtivo
        ? `<span class="pill bonus-tempo">${this.ultimoBonusTempo.segundos > 0 ? '+' : ''}${valorBonus} s</span>`
        : '';
      this.hud.innerHTML = `
        <span class="pill">👤 ${this.aluno}</span>
        <span class="pill">⏱️ ${Math.max(0, Math.ceil(this.tempoRestante))} s</span>
        ${bonus}
        <span class="pill">⭐ ATUAL ${this.placar.pontos}</span>
        <span class="pill">🏆 MELHOR ${recorde}</span>
        <span class="pill">🔥 ×${this.placar.combo}</span>
        ${this.coringa ? '<span class="pill joker-hud">🃏 CORINGA</span>' : ''}
        ${this.reciclagens ? `<span class="pill">♻ TROCAS ×${this.reciclagens}</span>` : ''}
        ${this.cena?.jogador && performance.now() < this.cena.jogador.poderAte ? '<span class="pill">🌟 PODER ATIVO</span>' : ''}
        <span class="pill">📏 ${this.distancia} m</span>
        <span class="pill">SEED ${this.seed}</span>`;
    },

    alternarPausa(forcarRetomada = false) {
      if (!this.cena) return;
      // Durante a pausa o painel está visível. O botão Continuar recebe uma
      // permissão explícita para atravessar a proteção contra outros modais.
      if (!forcarRetomada && !this.panel.classList.contains('hidden')) return;
      this.pausado = !this.pausado;
      if (this.pausado) {
        this.soundtrack?.pausar();
        this.panel.className = 'panel compact';
        this.panel.classList.remove('hidden');
        this.panel.innerHTML = '<h2>JOGO PAUSADO</h2><p>Respire um pouco. Sua aventura está esperando!</p><button id="resume">CONTINUAR</button><button id="quit" class="secondary">ENCERRAR PARTIDA</button>';
        this.panel.querySelector('#resume').onclick = () => this.alternarPausa(true);
        this.panel.querySelector('#quit').onclick = () => MatGame.ResultScene.mostrar(this, 'pausa');
      } else {
        this.soundtrack?.continuar();
        this.panel.classList.add('hidden');
      }
    }
  };

  app.pause.onclick = () => app.alternarPausa();
  try {
    // Mantém o suporte offline por file://. Não remover durante resoluções de conflito.
    if (window.MatGameContent) app.banco = window.MatGameContent;
    else {
      const resposta = await fetch('banco/conteudo.json');
      if (!resposta.ok) throw Error('Banco indisponível');
      app.banco = await resposta.json();
    }
    const edicoes = JSON.parse(localStorage.getItem('aventura-matematica-banco-editor-v1') || 'null');
    if (edicoes) app.banco = edicoes;
    new Phaser.Game({ start: () => MatGame.MenuScene.mostrar(app) });
  } catch (erro) {
    app.panel.innerHTML = '<h2>Não foi possível abrir o banco</h2><p>Verifique se a pasta <b>banco</b> foi copiada junto com o jogo.</p>';
  }
});
