MatGame.GameScene = class {
  constructor(app) {
    this.app = app;
    this.ctx = app.canvas.getContext('2d');
    this.teclas = {};
    this.plataformas = [];
    this.moedas = [];
    this.estacoes = [];
    this.obstaculos = [];
    this.estrelas = [];
    this.bichos = [];
    this.fimGerado = 0;
    this.camera = 0;
    this.rodando = false;
  }

  iniciar() {
    this.rodando = true;
    this.app.pausado = false;
    this.jogador = { x: 90, y: 460, w: 38, h: 56, vx: 0, vy: 0, noChao: false, invulneravelAte: 0 };
    this.gerarAte(3200);
    this.ouvir();
    this.ultimo = performance.now();
    requestAnimationFrame((tempo) => this.loop(tempo));
  }

  ouvir() {
    this.down = (evento) => {
      this.teclas[evento.code] = true;
      if (evento.code === 'Escape') this.app.alternarPausa();
    };
    this.up = (evento) => { this.teclas[evento.code] = false; };
    addEventListener('keydown', this.down);
    addEventListener('keyup', this.up);
  }

  destruir() {
    this.rodando = false;
    removeEventListener('keydown', this.down);
    removeEventListener('keyup', this.up);
  }

  gerarAte(posicao) {
    while (this.fimGerado < posicao) {
      const chunk = this.app.gerador.proximo();
      const base = this.fimGerado;
      const nivel = this.app.gerador.dificuldadeMotora();

      for (const plataforma of chunk.plataformas) {
        const item = { x: base + plataforma[0], y: plataforma[1], w: plataforma[2], h: plataforma[3] };
        this.plataformas.push(item);
        // Bichos surgem apenas em pisos largos e planos, nunca em saltos estreitos.
        if (nivel >= 2 && item.y === 620 && item.w >= 210) {
          const quantidade = nivel >= 3 && item.w >= 500 ? 2 : 1;
          for (let i = 0; i < quantidade; i += 1) {
            const inicio = item.x + 70 + i * Math.min(260, item.w / 2);
            this.bichos.push({
              x: Math.min(inicio, item.x + item.w - 70), y: 584, w: 42, h: 36,
              inicio: item.x + 35, fim: item.x + item.w - 35,
              vx: 55 + nivel * 20, nivel
            });
          }
        }
      }

      for (let i = 0; i < MatGame.CONFIG.mundo.moedasPorChunk; i += 1) {
        this.moedas.push({ x: base + 160 + i * 130, y: 500 - (i % 2) * 45, r: 11, ativa: true });
      }
      for (const obstaculo of chunk.obstaculos || []) {
        this.obstaculos.push({ x: base + obstaculo[0], y: obstaculo[1], w: obstaculo[2], h: obstaculo[3] });
      }
      if (chunk.estacao) this.estacoes.push({ x: base + chunk.estacao[0], y: chunk.estacao[1], ativa: true });
      if (chunk.checkpoint) this.estrelas.push({ x: base + chunk.checkpoint[0], y: chunk.checkpoint[1], ativa: true });
      this.fimGerado += chunk.largura;
      this.chunkAtual = chunk.id;
    }
  }

  loop(agora) {
    if (!this.rodando) return;
    const delta = Math.min(0.033, (agora - this.ultimo) / 1000);
    this.ultimo = agora;
    if (!this.app.pausado) this.atualizar(delta, agora);
    this.desenhar();
    requestAnimationFrame((tempo) => this.loop(tempo));
  }

  atualizar(delta, agora) {
    const jogador = this.jogador;
    const config = MatGame.CONFIG;
    this.app.tempoRestante -= delta;
    this.app.tempoDecorrido += delta;
    this.app.gerador.tempoDecorrido = this.app.tempoDecorrido;

    if (this.app.tempoRestante <= 0) {
      this.app.tempoRestante = 0;
      MatGame.ResultScene.mostrar(this.app, 'tempo');
      return;
    }

    const esquerda = this.teclas.ArrowLeft || this.teclas.KeyA;
    const direita = this.teclas.ArrowRight || this.teclas.KeyD;
    jogador.vx = (direita ? config.velocidade : 0) - (esquerda ? config.velocidade : 0);
    if ((this.teclas.ArrowUp || this.teclas.KeyW || this.teclas.Space) && jogador.noChao) {
      jogador.vy = -config.pulo;
      jogador.noChao = false;
    }

    const yAnterior = jogador.y;
    jogador.vy += config.gravidade * delta;
    jogador.x = Math.max(0, jogador.x + jogador.vx * delta);
    jogador.y += jogador.vy * delta;
    jogador.noChao = false;
    for (const plataforma of this.plataformas) {
      if (jogador.x + jogador.w > plataforma.x && jogador.x < plataforma.x + plataforma.w
        && yAnterior + jogador.h <= plataforma.y + 8 && jogador.y + jogador.h >= plataforma.y
        && jogador.vy >= 0) {
        jogador.y = plataforma.y - jogador.h;
        jogador.vy = 0;
        jogador.noChao = true;
      }
    }

    for (const bicho of this.bichos) {
      bicho.x += bicho.vx * delta;
      if (bicho.x <= bicho.inicio || bicho.x + bicho.w >= bicho.fim) bicho.vx *= -1;
      if (agora >= jogador.invulneravelAte && this.toca(jogador, bicho)) {
        jogador.invulneravelAte = agora + 1500;
        jogador.vy = -360;
        jogador.x -= Math.sign(bicho.vx || 1) * 45;
        this.app.tempoRestante = Math.max(1, this.app.tempoRestante - config.tempo.colisaoBicho);
        this.app.placar.combo = 0;
      }
    }

    this.camera = Math.max(0, jogador.x - 330);
    this.app.distancia = Math.max(this.app.distancia, Math.floor(jogador.x / 10));
    this.gerarAte(jogador.x + config.mundo.gerarAdiante);

    for (const moeda of this.moedas) {
      if (moeda.ativa && this.toca(jogador, { x: moeda.x - moeda.r, y: moeda.y - moeda.r, w: moeda.r * 2, h: moeda.r * 2 })) {
        moeda.ativa = false;
        this.app.placar.adicionar(config.pontos.moeda);
        this.app.adicionarTempo(config.tempo.moeda);
      }
    }
    for (const obstaculo of this.obstaculos) {
      if (this.toca(jogador, obstaculo)) {
        jogador.vx = -180;
        jogador.vy = -350;
        jogador.x -= 35;
        this.app.placar.combo = 0;
      }
    }
    for (const estrela of this.estrelas) {
      if (estrela.ativa && Math.abs(jogador.x - estrela.x) < 45) {
        estrela.ativa = false;
        this.app.placar.adicionar(config.pontos.checkpoint);
        this.app.adicionarTempo(config.tempo.estrela);
      }
    }
    for (const estacao of this.estacoes) {
      if (estacao.ativa && Math.abs(jogador.x - estacao.x) < 50) {
        estacao.ativa = false;
        this.desafio();
      }
    }

    if (jogador.y > 800) MatGame.ResultScene.mostrar(this.app, 'queda');
    this.app.atualizarHud();
  }

  toca(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  desafio() {
    const categoria = this.app.seletor.categoria();
    const questao = this.app.seletor.selecionar(categoria, this.app.gerador.dificuldade());
    this.app.questaoDebug = questao;
    MatGame.ChallengeScene.mostrar(this.app, questao, categoria, () => {
      this.app.panel.classList.add('hidden');
      this.app.pausado = false;
    });
  }

  desenhar() {
    const camera = this.camera;
    const ctx = this.ctx;
    const largura = this.app.canvas.width;
    const altura = this.app.canvas.height;
    const ceu = ctx.createLinearGradient(0, 0, 0, altura);
    ceu.addColorStop(0, '#112c50');
    ceu.addColorStop(1, '#4e9cc0');
    ctx.fillStyle = ceu;
    ctx.fillRect(0, 0, largura, altura);

    ctx.fillStyle = '#ffffff18';
    for (let i = 0; i < 8; i += 1) {
      const x = ((i * 270 - camera * 0.15) % 1500 + 1500) % 1500;
      ctx.beginPath();
      ctx.arc(x, 120 + (i % 3) * 65, 50 + (i % 2) * 30, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#184b55';
    ctx.beginPath();
    ctx.moveTo(0, 620);
    for (let x = 0; x <= largura; x += 100) ctx.lineTo(x, 510 + Math.sin((x + camera * 0.25) / 130) * 50);
    ctx.lineTo(largura, altura);
    ctx.lineTo(0, altura);
    ctx.fill();

    for (const plataforma of this.plataformas) {
      if (plataforma.x - camera > largura || plataforma.x + plataforma.w - camera < 0) continue;
      ctx.fillStyle = '#216e4e';
      ctx.fillRect(plataforma.x - camera, plataforma.y, plataforma.w, plataforma.h);
      ctx.fillStyle = '#63d471';
      ctx.fillRect(plataforma.x - camera, plataforma.y, plataforma.w, 12);
    }
    for (const moeda of this.moedas) if (moeda.ativa) {
      ctx.fillStyle = '#6ee7ff';
      ctx.beginPath();
      ctx.arc(moeda.x - camera, moeda.y, moeda.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e8fbff';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#174d6f';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('+s', moeda.x - camera - 7, moeda.y + 4);
    }
    for (const obstaculo of this.obstaculos) {
      ctx.fillStyle = '#ef476f';
      ctx.beginPath();
      ctx.moveTo(obstaculo.x - camera, obstaculo.y + obstaculo.h);
      ctx.lineTo(obstaculo.x + obstaculo.w / 2 - camera, obstaculo.y);
      ctx.lineTo(obstaculo.x + obstaculo.w - camera, obstaculo.y + obstaculo.h);
      ctx.fill();
    }
    for (const bicho of this.bichos) {
      ctx.fillStyle = bicho.nivel >= 3 ? '#9b5de5' : '#ef476f';
      ctx.beginPath();
      ctx.ellipse(bicho.x + bicho.w / 2 - camera, bicho.y + 21, bicho.w / 2, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(bicho.x + 10 - camera, bicho.y + 10, 7, 8);
      ctx.fillRect(bicho.x + 27 - camera, bicho.y + 10, 7, 8);
      ctx.fillStyle = '#102a43';
      ctx.fillRect(bicho.x + 13 - camera, bicho.y + 12, 3, 4);
      ctx.fillRect(bicho.x + 30 - camera, bicho.y + 12, 3, 4);
    }
    for (const estacao of this.estacoes) if (estacao.ativa) {
      ctx.fillStyle = '#6ee7ff';
      ctx.fillRect(estacao.x - camera - 25, estacao.y - 65, 50, 75);
      ctx.fillStyle = '#102a43';
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText('?', estacao.x - camera - 13, estacao.y - 15);
    }
    for (const estrela of this.estrelas) if (estrela.ativa) {
      ctx.fillStyle = '#ffd166';
      ctx.font = '52px sans-serif';
      ctx.fillText('★', estrela.x - camera - 20, estrela.y - 25);
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`+${MatGame.CONFIG.tempo.estrela}s`, estrela.x - camera - 18, estrela.y + 5);
    }

    const jogador = this.jogador;
    ctx.globalAlpha = performance.now() < jogador.invulneravelAte && Math.floor(performance.now() / 100) % 2 ? 0.35 : 1;
    ctx.fillStyle = '#ff8c42';
    ctx.fillRect(jogador.x - camera, jogador.y, jogador.w, jogador.h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(jogador.x - camera + 23, jogador.y + 10, 8, 9);
    ctx.fillStyle = '#102a43';
    ctx.fillRect(jogador.x - camera + 26, jogador.y + 12, 4, 5);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(jogador.x - camera - 5, jogador.y + 42, 18, 14);
    ctx.globalAlpha = 1;

    if (this.app.debug) {
      ctx.fillStyle = '#000b';
      ctx.fillRect(12, 650, 620, 55);
      ctx.fillStyle = '#fff';
      ctx.font = '18px monospace';
      ctx.fillText(`chunk=${this.chunkAtual} dificuldade=${this.app.gerador.dificuldadeMotora()} bichos=${this.bichos.length} resposta=${this.app.questaoDebug?.resposta ?? '-'}`, 20, 682);
    }
  }
};
