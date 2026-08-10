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
    this.magos = [];
    this.estrelasPoder = [];
    this.cartasCoringa = [];
    this.fantasmas = [];
    this.gigantes = [];
    this.particulas = [];
    this.ultimoDesafioTempo = 0;
    this.proximoGigante = MatGame.CONFIG.tempo.giganteIntervalo;
    this.ultimaCartaX = -2000;
    this.proximaEstrelaPoder = 0;
    this.proximoMago = 20;
    this.fimGerado = 0;
    this.camera = 0;
    this.rodando = false;
  }

  iniciar() {
    this.rodando = true;
    this.app.pausado = false;
    this.jogador = { x: 90, y: 460, w: 38, h: 56, vx: 0, vy: 0, noChao: false, invulneravelAte: 0, poderAte: 0, danoAte: 0 };
    this.pontoRetorno = { x: 90, y: 460 };
    this.gerarAte(3200);
    this.agendarEstrelaPoder();
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
          const quantidade = nivel >= 3 ? Math.min(2, Math.max(1, Math.floor(item.w / 230))) : 1;
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

      const quantidadeMoedas = Math.max(2, MatGame.CONFIG.mundo.moedasPorChunk + 1 - nivel);
      for (let i = 0; i < quantidadeMoedas; i += 1) {
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
    document.querySelector('#app').classList.toggle('urgencia', this.app.tempoRestante <= 20);

    if (this.app.tempoRestante <= 0) {
      this.app.tempoRestante = 0;
      MatGame.ResultScene.mostrar(this.app, 'tempo');
      return;
    }

    const esquerda = this.teclas.ArrowLeft || this.teclas.KeyA;
    const direita = this.teclas.ArrowRight || this.teclas.KeyD;
    const multiplicadorVelocidade = agora < jogador.poderAte ? config.tempo.estrelaPoderVelocidade : 1;
    jogador.vx = ((direita ? config.velocidade : 0) - (esquerda ? config.velocidade : 0)) * multiplicadorVelocidade;
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
        const margem = Math.min(35, plataforma.w / 4);
        this.pontoRetorno = {
          x: Math.max(plataforma.x + margem, Math.min(jogador.x, plataforma.x + plataforma.w - jogador.w - margem)),
          y: plataforma.y - jogador.h
        };
      }
    }

    for (const bicho of this.bichos) {
      if (bicho.derrotado) {
        bicho.y -= 45 * delta;
        if (agora >= bicho.derrotadoAte) bicho.invisivel = true;
        continue;
      }
      bicho.x += bicho.vx * delta;
      if (bicho.x <= bicho.inicio || bicho.x + bicho.w >= bicho.fim) bicho.vx *= -1;
      if (agora >= Math.max(jogador.invulneravelAte, jogador.poderAte) && this.toca(jogador, bicho)) {
        const pisouPorCima = jogador.vy > 0 && yAnterior + jogador.h <= bicho.y + 14;
        if (pisouPorCima) {
          bicho.derrotado = true;
          bicho.derrotadoAte = agora + 800;
          jogador.vy = -430;
          this.app.adicionarTempo(config.tempo.pisarBicho);
          this.app.placar.adicionar(config.pontos.especial);
        } else {
          jogador.invulneravelAte = agora + 1500;
          jogador.danoAte = agora + 500;
          jogador.vy = -360;
          jogador.x -= Math.sign(bicho.vx || 1) * 45;
          this.app.tempoRestante = Math.max(1, this.app.tempoRestante - config.tempo.colisaoBicho);
          this.app.placar.combo = 0;
        }
      }
    }

    if (this.app.tempoDecorrido >= this.proximaEstrelaPoder) this.criarEstrelaPoder();
    for (const estrela of this.estrelasPoder) {
      if (!estrela.ativa) continue;
      if (this.app.tempoDecorrido - estrela.nascimento > 12) { estrela.ativa = false; continue; }
      if (this.toca(jogador, { x: estrela.x - 24, y: estrela.y - 24, w: 48, h: 48 })) {
        estrela.ativa = false;
        jogador.poderAte = agora + config.tempo.estrelaPoderDuracao * 1000;
        for (const bicho of this.bichos) if (!bicho.derrotado && Math.abs(bicho.x - jogador.x) < this.app.canvas.width) {
          bicho.derrotado = true;
          bicho.derrotadoAte = agora + 900;
          this.criarExplosao(bicho.x + bicho.w / 2, bicho.y + bicho.h / 2);
        }
        this.app.placar.adicionar(config.pontos.especial);
      }
    }

    this.criarCartaSePossivel();
    for (const carta of this.cartasCoringa) {
      if (carta.ativa && !this.app.coringa && this.toca(jogador, { x: carta.x - 20, y: carta.y - 28, w: 40, h: 56 })) {
        carta.ativa = false;
        this.app.coringa = true;
        this.app.placar.adicionar(config.pontos.especial);
      }
    }

    if (this.app.tempoDecorrido >= this.proximoMago) {
      this.magos.push({ nascimento: this.app.tempoDecorrido, y: 210, ativa: true });
      this.proximoMago += config.tempo.magoIntervalo;
    }
    for (const mago of this.magos) {
      if (!mago.ativa) continue;
      const idade = this.app.tempoDecorrido - mago.nascimento;
      if (idade >= config.tempo.magoDuracao) { mago.ativa = false; continue; }
      mago.x = this.camera + this.app.canvas.width - 100 - idade * 72;
      mago.y = 220 + Math.sin(idade * 3) * 55;
      if (this.toca(jogador, { x: mago.x - 30, y: mago.y - 30, w: 60, h: 60 })) {
        mago.ativa = false;
        this.app.adicionarTempo(config.tempo.mago);
        this.app.placar.adicionar(config.pontos.especial);
      }
    }

    if (this.app.tempoDecorrido - this.ultimoDesafioTempo >= config.tempo.fantasmaApos && !this.fantasmas.some((fantasma) => fantasma.ativa)) {
      this.fantasmas.push({ x: jogador.x - 420, y: jogador.y, ativa: true });
    }
    for (const fantasma of this.fantasmas) {
      if (!fantasma.ativa) continue;
      const dx = jogador.x - fantasma.x;
      const dy = jogador.y - fantasma.y;
      const distancia = Math.max(1, Math.hypot(dx, dy));
      fantasma.x += dx / distancia * 155 * delta;
      fantasma.y += dy / distancia * 90 * delta;
      if (this.toca(jogador, { x: fantasma.x - 24, y: fantasma.y - 30, w: 48, h: 60 })) {
        fantasma.ativa = false;
        this.desafioFantasma();
        this.app.atualizarHud();
        return;
      }
    }

    if (this.app.tempoDecorrido >= this.proximoGigante) {
      this.gigantes.push({ nascimento: this.app.tempoDecorrido, ativa: true, atingiu: false });
      this.proximoGigante += config.tempo.giganteIntervalo;
    }
    for (const gigante of this.gigantes) {
      if (!gigante.ativa) continue;
      const idade = this.app.tempoDecorrido - gigante.nascimento;
      gigante.x = this.camera + this.app.canvas.width + 100 - idade * 330;
      gigante.y = 520;
      if (idade > 6) { gigante.ativa = false; continue; }
      if (!gigante.atingiu && agora >= jogador.invulneravelAte && this.toca(jogador, { x: gigante.x, y: gigante.y, w: 82, h: 100 })) {
        gigante.atingiu = true;
        jogador.danoAte = agora + 650;
        jogador.invulneravelAte = agora + 1600;
        jogador.vy = -420;
        this.app.tempoRestante = Math.max(1, this.app.tempoRestante - config.tempo.colisaoGigante);
      }
    }
    for (const particula of this.particulas) {
      particula.x += particula.vx * delta;
      particula.y += particula.vy * delta;
      particula.vy += 260 * delta;
      particula.vida -= delta;
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
        jogador.danoAte = agora + 500;
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

    if (jogador.y > 800) this.tratarQueda();
    this.app.atualizarHud();
  }

  desafioFantasma() {
    this.ultimoDesafioTempo = this.app.tempoDecorrido;
    const questao = this.app.seletor.selecionarDificil();
    this.app.questaoDebug = questao;
    MatGame.ChallengeScene.mostrar(this.app, questao, 'problema', () => {
      this.app.panel.classList.add('hidden');
      this.app.pausado = false;
    }, { bonusMultiplicador: 0.4, origem: 'fantasma' });
  }

  criarExplosao(x, y) {
    for (let i = 0; i < 12; i += 1) {
      const angulo = i / 12 * Math.PI * 2;
      this.particulas.push({ x, y, vx: Math.cos(angulo) * 150, vy: Math.sin(angulo) * 150, vida: 0.8 });
    }
  }

  agendarEstrelaPoder() {
    const config = MatGame.CONFIG.tempo;
    this.proximaEstrelaPoder = this.app.tempoDecorrido
      + this.app.powerRng.inteiro(config.estrelaPoderMinimo, config.estrelaPoderMaximo);
  }

  criarEstrelaPoder() {
    const plataforma = this.plataformas.find((item) => item.x > this.jogador.x + 260 && item.x < this.jogador.x + 950 && item.w >= 125);
    if (plataforma) {
      this.estrelasPoder.push({ x: plataforma.x + plataforma.w / 2, y: plataforma.y - 45, nascimento: this.app.tempoDecorrido, ativa: true });
    }
    this.agendarEstrelaPoder();
  }

  criarCartaSePossivel() {
    if (this.app.coringa || this.cartasCoringa.some((carta) => carta.ativa) || this.jogador.x - this.ultimaCartaX < 1800) return;
    const plataforma = this.plataformas.find((item) => item.x > this.jogador.x + 500 && item.x < this.jogador.x + 1500 && item.y <= 490 && item.w >= 120);
    if (plataforma) {
      this.cartasCoringa.push({ x: plataforma.x + plataforma.w / 2, y: plataforma.y - 38, ativa: true });
      this.ultimaCartaX = plataforma.x;
    }
  }

  tratarQueda() {
    const custo = MatGame.CONFIG.tempo.queda;
    if (this.app.tempoRestante < custo + 1) {
      MatGame.ResultScene.mostrar(this.app, 'queda');
      return;
    }
    this.app.tempoRestante -= custo;
    this.app.placar.combo = 0;
    Object.assign(this.jogador, { x: this.pontoRetorno.x, y: this.pontoRetorno.y, vx: 0, vy: 0, invulneravelAte: performance.now() + 1800 });
    this.camera = Math.max(0, this.jogador.x - 330);
    this.app.ultimoBonusTempo = { segundos: -custo, ate: performance.now() + 1500 };
  }

  toca(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  desafio() {
    const categoria = this.app.seletor.categoria();
    const questao = this.app.seletor.selecionar(categoria, this.app.gerador.dificuldade());
    if (categoria === 'problema') this.ultimoDesafioTempo = this.app.tempoDecorrido;
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
    const nivelVisual = this.app.gerador.dificuldadeMotora();
    const paletas = { 1: ['#79c9ef', '#d8f3ff'], 2: ['#f28f6b', '#674d82'], 3: ['#07152f', '#243b67'] };
    const paleta = paletas[nivelVisual];
    ceu.addColorStop(0, paleta[0]);
    ceu.addColorStop(1, paleta[1]);
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
      if (bicho.invisivel) continue;
      ctx.fillStyle = bicho.nivel >= 3 ? '#9b5de5' : '#ef476f';
      ctx.beginPath();
      ctx.arc(bicho.x + bicho.w / 2 - camera, bicho.y + 18, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(bicho.x + 10 - camera, bicho.y + 10, 7, 8);
      ctx.fillRect(bicho.x + 27 - camera, bicho.y + 10, 7, 8);
      ctx.fillStyle = '#102a43';
      ctx.fillRect(bicho.x + 13 - camera, bicho.y + 12, 3, 4);
      ctx.fillRect(bicho.x + 30 - camera, bicho.y + 12, 3, 4);
      if (bicho.derrotado) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(bicho.x + 22 - camera, bicho.y + 27, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (const fantasma of this.fantasmas) if (fantasma.ativa) {
      ctx.globalAlpha = 0.78;
      ctx.font = '58px sans-serif';
      ctx.fillText('👻', fantasma.x - camera - 28, fantasma.y + 28);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('PROBLEMA!', fantasma.x - camera - 35, fantasma.y - 35);
    }
    for (const gigante of this.gigantes) if (gigante.ativa) {
      ctx.font = '96px sans-serif';
      ctx.fillText('🧌', gigante.x - camera, gigante.y + 88);
      ctx.fillStyle = '#ef476f';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('PULE!', gigante.x - camera + 15, gigante.y - 8);
    }
    for (const particula of this.particulas) if (particula.vida > 0) {
      ctx.globalAlpha = particula.vida;
      ctx.fillStyle = '#fff176';
      ctx.beginPath(); ctx.arc(particula.x - camera, particula.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    for (const estrela of this.estrelasPoder) if (estrela.ativa) {
      const brilho = 1 + Math.sin(performance.now() / 120) * 0.12;
      ctx.save();
      ctx.translate(estrela.x - camera, estrela.y);
      ctx.scale(brilho, brilho);
      ctx.shadowColor = '#fff59d';
      ctx.shadowBlur = 22;
      ctx.fillStyle = '#fff176';
      ctx.font = '48px sans-serif';
      ctx.fillText('★', -24, 18);
      ctx.restore();
    }
    for (const carta of this.cartasCoringa) if (carta.ativa && !this.app.coringa) {
      ctx.fillStyle = '#f7fafc';
      ctx.fillRect(carta.x - camera - 18, carta.y - 26, 36, 52);
      ctx.strokeStyle = '#9b5de5';
      ctx.lineWidth = 4;
      ctx.strokeRect(carta.x - camera - 18, carta.y - 26, 36, 52);
      ctx.font = '28px sans-serif';
      ctx.fillText('🃏', carta.x - camera - 15, carta.y + 10);
    }
    for (const mago of this.magos) if (mago.ativa) {
      ctx.font = '52px sans-serif';
      ctx.fillText('🧙‍♂️', mago.x - camera - 28, mago.y + 18);
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('+30s', mago.x - camera - 18, mago.y + 42);
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
    const telaX = jogador.x - camera;
    const agoraVisual = performance.now();
    const pulando = !jogador.noChao;
    const machucado = agoraVisual < jogador.danoAte;
    const corrida = jogador.noChao && Math.abs(jogador.vx) > 10 ? Math.sin(agoraVisual / 75) : 0;
    ctx.save();
    ctx.translate(telaX + 19, jogador.y + 29);
    ctx.rotate(machucado ? 0.28 * Math.sin(agoraVisual / 35) : pulando ? -0.14 : corrida * 0.035);
    ctx.translate(-(telaX + 19), -(jogador.y + 29));
    const protegido = agoraVisual < Math.max(jogador.invulneravelAte, jogador.poderAte);
    ctx.globalAlpha = protegido && Math.floor(performance.now() / 100) % 2 ? 0.45 : 1;
    if (performance.now() < jogador.poderAte) {
      ctx.strokeStyle = ['#fff176', '#6ee7ff', '#ef476f'][Math.floor(performance.now() / 120) % 3];
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(telaX + 19, jogador.y + 29, 36, 0, Math.PI * 2);
      ctx.stroke();
    }
    const personagemCores = { exploradora: '#ff8c42', cientista: '#36c5f0', inventora: '#9b5de5' };
    const cor = personagemCores[this.app.personagem] || '#ff8c42';
    // Pernas e botas dão uma silhueta de corredor em vez de um único retângulo.
    ctx.fillStyle = '#183153';
    ctx.fillRect(telaX + 7, jogador.y + 40 + corrida * 3, 9, 15);
    ctx.fillRect(telaX + 24, jogador.y + 40 - corrida * 3, 9, 15);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(telaX + 2, jogador.y + 51, 16, 7);
    ctx.fillRect(telaX + 22, jogador.y + 51, 17, 7);
    // Corpo, mochila, braços e lenço.
    ctx.fillStyle = '#704214';
    ctx.fillRect(telaX - 4, jogador.y + 22, 10, 23);
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.roundRect(telaX + 4, jogador.y + 20, 31, 27, 8);
    ctx.fill();
    ctx.fillStyle = '#f2b58d';
    ctx.fillRect(telaX - 1, jogador.y + 24, 8, 20);
    ctx.fillRect(telaX + 33, jogador.y + 24, 8, 20);
    ctx.fillStyle = '#ef476f';
    ctx.beginPath();
    ctx.moveTo(telaX + 5, jogador.y + 22);
    ctx.lineTo(telaX - 10, jogador.y + 31);
    ctx.lineTo(telaX + 7, jogador.y + 29);
    ctx.fill();
    // Cabeça, cabelo, olho e sorriso.
    ctx.fillStyle = '#f2b58d';
    ctx.beginPath();
    ctx.arc(telaX + 21, jogador.y + 13, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3b2a20';
    ctx.beginPath();
    ctx.arc(telaX + 19, jogador.y + 8, 14, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(telaX + 25, jogador.y + 10, 7, 6);
    ctx.fillStyle = '#102a43';
    ctx.fillRect(telaX + 28, jogador.y + 11, 3, 4);
    ctx.strokeStyle = '#8b3a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(telaX + 25, jogador.y + 17, 5, 0.2, 1.2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#102a43';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(this.app.personagem === 'cientista' ? '⚗' : this.app.personagem === 'inventora' ? '⚙' : '◆', telaX + 11, jogador.y + 39);
    ctx.restore();

    if (this.app.debug) {
      ctx.fillStyle = '#000b';
      ctx.fillRect(12, 650, 620, 55);
      ctx.fillStyle = '#fff';
      ctx.font = '18px monospace';
      ctx.fillText(`chunk=${this.chunkAtual} dificuldade=${this.app.gerador.dificuldadeMotora()} bichos=${this.bichos.length} resposta=${this.app.questaoDebug?.resposta ?? '-'}`, 20, 682);
    }
  }
};
