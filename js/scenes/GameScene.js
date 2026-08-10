MatGame.GameScene = class {
  constructor(app) {
    this.app = app;
    this.ctx = app.canvas.getContext('2d');
    this.teclas = {};
    this.plataformas = [];
    this.moedas = [];
    this.frutas = [];
    this.estacoes = [];
    this.obstaculos = [];
    this.estrelas = [];
    this.bichos = [];
    this.magos = [];
    this.estrelasPoder = [];
    this.cartasCoringa = [];
    this.fantasmas = [];
    this.gigantes = [];
    this.atiradores = [];
    this.projeteis = [];
    this.bumerangues = [];
    this.camuflados = [];
    this.congelantes = [];
    this.aranhas = [];
    this.chifres = [];
    this.reciclagens = [];
    this.monstrosAvancados = [];
    this.fadas = [];
    this.proximaFada = MatGame.CONFIG.tempo.fadaPrimeira;
    this.particulas = [];
    this.chefe = null;
    this.projeteisChefe = [];
    this.proximoChefeMetros = MatGame.CONFIG.mundo.chefeCadaMetros;
    this.ultimoDesafioTempo = 0;
    this.proximoGigante = 0;
    this.ultimaCartaX = -2000;
    this.proximaEstrelaPoder = 0;
    this.proximoMago = this.app.powerRng.inteiro(MatGame.CONFIG.tempo.magoMinimo, MatGame.CONFIG.tempo.magoMaximo);
    this.fimGerado = 0;
    this.camera = 0;
    this.rodando = false;
  }

  iniciar() {
    this.rodando = true;
    this.app.pausado = false;
    this.jogador = { x: 90, y: 460, w: 38, h: 56, vx: 0, vy: 0, noChao: false, invulneravelAte: 0, poderAte: 0, danoAte: 0, paralisadoAte: 0 };
    this.pontoRetorno = { x: 90, y: 460 };
    this.gerarAte(3200);
    this.agendarEstrelaPoder();
    this.agendarGigante();
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
      const metrosChunk = base / 10;
      const mundo = MatGame.CONFIG.mundo;
      const populacao = metrosChunk < mundo.monstrosInicioMetros ? 0 : metrosChunk < mundo.atiradoresInicioMetros ? 1 : metrosChunk < mundo.monstroMolaMetros ? 2 : 3;
      const nivelExtremo = metrosChunk < mundo.extremoInicioMetros ? 0 : 1 + Math.floor((metrosChunk - mundo.extremoInicioMetros) / mundo.extremoCadaMetros);
      let atiradorCriado = false;
      let camufladoCriado = false;
      let avancadoCriado = false;
      let congelanteCriado = false;

      for (const plataforma of chunk.plataformas) {
        const item = { x: base + plataforma[0], y: plataforma[1], w: plataforma[2], h: plataforma[3] };
        this.plataformas.push(item);
        if (item.y <= 500 && this.app.powerRng.proximo() < 0.38) {
          const tiposFruta = ['🍎', '🍊', '🍇', '🍓'];
          this.frutas.push({ x: item.x + item.w / 2, y: item.y - 34, tipo: this.app.powerRng.escolher(tiposFruta), ativa: true });
        }
        // Bichos surgem apenas em pisos largos e planos, nunca em saltos estreitos.
        if (populacao >= 1 && item.y === 620 && item.w >= 210) {
          const quantidadeBase = populacao >= 3 ? Math.min(2, Math.max(1, Math.floor(item.w / 280))) : 1;
          const quantidade = Math.min(4, quantidadeBase + Math.min(2, nivelExtremo));
          for (let i = 0; i < quantidade; i += 1) {
            const inicio = item.x + 70 + i * Math.min(260, item.w / 2);
            this.bichos.push({
              x: Math.min(inicio, item.x + item.w - 70), y: 584, w: 42, h: 36,
              inicio: item.x + 35, fim: item.x + item.w - 35,
              vx: 55 + nivel * 20, nivel
            });
          }
        }
        if (!atiradorCriado && populacao >= 2 && item.w >= 180 && item.y <= 540) {
          this.atiradores.push({ x: item.x + item.w / 2, y: item.y - 50, w: 48, h: 50, inicio: item.x + 30, fim: item.x + item.w - 30, rajadaRestante: 0, proximoTiro: this.app.tempoDecorrido + 2.5 });
          atiradorCriado = true;
        }
        if (!camufladoCriado && populacao >= 2 && item.y === 620 && item.w >= 280) {
          this.camuflados.push({ x: item.x + item.w * 0.68, y: 578, baseY: 578, w: 40, h: 42, vy: 0, revelado: false, cooldownAte: 0, morto: false });
          camufladoCriado = true;
        }
        if (!congelanteCriado && metrosChunk >= mundo.congelanteMetros && item.y === 620 && item.w >= 300) {
          this.congelantes.push({ x: item.x + item.w * 0.32, y: 576, w: 44, h: 44, inicio: item.x + 35, fim: item.x + item.w - 35, vx: 70 + nivelExtremo * 9, morto: false });
          congelanteCriado = true;
        }
        if (!avancadoCriado && metrosChunk >= mundo.monstroMolaMetros && metrosChunk < mundo.monstroBumerangueMetros && item.y === 620 && item.w >= 300) {
          this.monstrosAvancados.push({ tipo: 'mola', x: item.x + item.w * 0.45, y: 574, baseY: 574, w: 44, h: 46, vy: 0, proximoSalto: 0, morto: false });
          avancadoCriado = true;
        }
        if (!avancadoCriado && metrosChunk >= mundo.monstroBumerangueMetros && metrosChunk < mundo.monstroSombraMetros && item.y === 620 && item.w >= 300) {
          this.monstrosAvancados.push({ tipo: 'bumerangue', x: item.x + item.w * 0.5, y: 574, baseY: 574, w: 46, h: 46, proximoAtaque: 0, morto: false });
          avancadoCriado = true;
        }
        if (!avancadoCriado && metrosChunk >= mundo.monstroSombraMetros && item.y === 620 && item.w >= 320) {
          this.monstrosAvancados.push({ tipo: 'sombra', x: item.x + item.w * 0.55, baseX: item.x + item.w * 0.55, y: 510, baseY: 510, w: 46, h: 44, vx: 0, vy: 0, estado: 'espera', estadoAte: 0, proximaInvestida: 0, morto: false });
          avancadoCriado = true;
        }
      }
      if (metrosChunk >= mundo.plataformaHorizontalMetros && Math.floor(metrosChunk / 96) % 2 === 0) {
        const vertical = metrosChunk >= mundo.plataformaVerticalMetros && Math.floor(metrosChunk / 96) % 4 === 0;
        this.plataformas.push({ x: base + 410, y: vertical ? 410 : 455, w: 140, h: 20, movel: true, eixo: vertical ? 'y' : 'x', origemX: base + 410, origemY: vertical ? 410 : 455, amplitude: vertical ? 75 : 85, velocidade: vertical ? 1.05 : 0.8, fase: this.app.powerRng.proximo() * 6.28 });
      }
      if (metrosChunk >= mundo.aranhaMetros) {
        this.aranhas.push({ x: base + chunk.largura * 0.58, tetoY: 245, y: 245, w: 42, h: 40, fase: this.app.powerRng.proximo() * Math.PI * 2, morto: false, velocidade: 1.25 + Math.min(1.2, nivelExtremo * 0.08) });
      }

      const quantidadeMoedas = Math.max(1, MatGame.CONFIG.mundo.moedasPorChunk + 1 - nivel - Math.min(2, nivelExtremo));
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
    document.querySelector('#app').classList.toggle('urgencia', this.app.tempoRestante <= config.tempo.urgenciaAbaixo);

    if (this.app.tempoRestante <= 0) {
      this.app.tempoRestante = 0;
      MatGame.ResultScene.mostrar(this.app, 'tempo');
      return;
    }

    const esquerda = this.teclas.ArrowLeft || this.teclas.KeyA;
    const direita = this.teclas.ArrowRight || this.teclas.KeyD;
    const multiplicadorVelocidade = agora < jogador.poderAte ? config.tempo.estrelaPoderVelocidade : 1;
    const paralisado = agora < jogador.paralisadoAte;
    jogador.vx = paralisado ? 0 : ((direita ? config.velocidade : 0) - (esquerda ? config.velocidade : 0)) * multiplicadorVelocidade;
    if (!paralisado && (this.teclas.ArrowUp || this.teclas.KeyW || this.teclas.Space) && jogador.noChao) {
      jogador.vy = -config.pulo;
      jogador.noChao = false;
    }

    // As plataformas móveis são opcionais: a rota principal permanece sempre estática.
    for (const plataforma of this.plataformas) {
      if (!plataforma.movel) continue;
      const xAnterior = plataforma.x; const plataformaYAnterior = plataforma.y;
      const oscilacao = Math.sin(this.app.tempoDecorrido * plataforma.velocidade + plataforma.fase) * plataforma.amplitude;
      if (plataforma.eixo === 'x') plataforma.x = plataforma.origemX + oscilacao;
      else plataforma.y = plataforma.origemY + oscilacao;
      if (jogador.plataformaMovel === plataforma) {
        jogador.x += plataforma.x - xAnterior;
        jogador.y += plataforma.y - plataformaYAnterior;
      }
    }
    jogador.plataformaMovel = null;

    const yAnterior = jogador.y;
    jogador.vy += config.gravidade * delta;
    const limiteRetorno = Math.max(0, (this.app.distancia * 10) * config.mundo.retornoMaximo);
    jogador.x = Math.max(limiteRetorno, jogador.x + jogador.vx * delta);
    jogador.y += jogador.vy * delta;
    jogador.noChao = false;
    for (const plataforma of this.plataformas) {
      if (jogador.x + jogador.w > plataforma.x && jogador.x < plataforma.x + plataforma.w
        && yAnterior + jogador.h <= plataforma.y + 8 && jogador.y + jogador.h >= plataforma.y
        && jogador.vy >= 0) {
        jogador.y = plataforma.y - jogador.h;
        jogador.vy = 0;
        jogador.noChao = true;
        if (plataforma.movel) jogador.plataformaMovel = plataforma;
        const margem = Math.min(35, plataforma.w / 4);
        if (!plataforma.movel) this.pontoRetorno = {
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
        this.eliminarInimigosNaTela(agora);
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
    for (const reciclagem of this.reciclagens) {
      if (!reciclagem.ativa || this.app.reciclagens >= 3) continue;
      if (this.toca(jogador, { x: reciclagem.x - 24, y: reciclagem.y - 28, w: 48, h: 56 })) {
        reciclagem.ativa = false;
        this.app.reciclagens = Math.min(3, this.app.reciclagens + 1);
        this.app.placar.adicionar(config.pontos.especial);
      }
    }

    if (!this.chefe?.ativo && this.app.tempoDecorrido >= this.proximoMago) {
      this.magos.push({ nascimento: this.app.tempoDecorrido, ativa: true });
      this.agendarMago();
    }
    for (const mago of this.magos) {
      if (!mago.ativa) continue;
      const idade = this.app.tempoDecorrido - mago.nascimento;
      if (idade >= config.tempo.magoDuracao) { mago.ativa = false; continue; }
      const velocidadeMago = Math.min(64, 34 + this.app.distancia / 140);
      mago.x = this.camera + 90 + idade * velocidadeMago;
      mago.y = 445 + Math.sin(idade * 3) * 38;
      if (this.toca(jogador, { x: mago.x - 38, y: mago.y - 38, w: 76, h: 76 })) {
        mago.ativa = false;
        this.app.adicionarTempo(config.tempo.mago);
        this.app.placar.adicionar(config.pontos.especial);
      }
    }

    if (!this.chefe?.ativo && this.app.tempoDecorrido >= this.proximaFada) {
      this.fadas.push({ nascimento: this.app.tempoDecorrido, ativa: true });
      this.proximaFada += config.tempo.fadaIntervalo;
    }
    for (const fada of this.fadas) {
      if (!fada.ativa) continue;
      const idade = this.app.tempoDecorrido - fada.nascimento;
      if (idade > 10) { fada.ativa = false; continue; }
      const velocidadeFada = Math.min(64, 34 + this.app.distancia / 140);
      fada.x = this.camera + 90 + idade * velocidadeFada; fada.y = 445 + Math.sin(idade * 3) * 38;
      if (this.toca(jogador, { x: fada.x - 38, y: fada.y - 38, w: 76, h: 76 })) { fada.ativa = false; this.encontroFada(); this.app.atualizarHud(); return; }
    }

    for (const atirador of this.atiradores) {
      if (atirador.derrotado) {
        atirador.y -= 45 * delta;
        if (agora >= atirador.derrotadoAte) atirador.invisivel = true;
        continue;
      }
      const direcaoPasso = Math.sign(jogador.x - atirador.x) || 1;
      atirador.x = Math.max(atirador.inicio, Math.min(atirador.fim - atirador.w, atirador.x + direcaoPasso * 18 * delta));
      if (agora >= Math.max(jogador.invulneravelAte, jogador.poderAte) && this.toca(jogador, { x: atirador.x - 19, y: atirador.y, w: atirador.w, h: atirador.h })) {
        const pisouPorCima = jogador.vy > 0 && yAnterior + jogador.h <= atirador.y + 14;
        if (pisouPorCima) {
          atirador.derrotado = true;
          atirador.derrotadoAte = agora + 800;
          jogador.vy = -430;
          this.app.adicionarTempo(config.tempo.pisarBicho);
          this.app.placar.adicionar(config.pontos.especial);
          continue;
        }
        jogador.danoAte = agora + 450;
        jogador.invulneravelAte = agora + 1000;
        jogador.vy = -350;
        this.app.tempoRestante = Math.max(1, this.app.tempoRestante - config.tempo.colisaoBicho);
      }
      const distanciaX = jogador.x - atirador.x;
      if (Math.abs(distanciaX) < 620 && this.app.tempoDecorrido >= atirador.proximoTiro) {
        const direcao = Math.sign(distanciaX) || 1;
        this.projeteis.push({ tipo: 'fogo', x: atirador.x + direcao * 28, y: atirador.y + 20, vx: direcao * 255, vy: 0, escala: 1, idade: 0, ativa: true });
        const etapas = Math.floor(this.app.distancia / config.tempo.projetilReducaoCadaMetros);
        const intervalo = Math.max(config.tempo.projetilIntervaloMinimo, config.tempo.projetilIntervaloInicial - etapas * 0.35);
        atirador.rajadaRestante = atirador.rajadaRestante || config.tempo.dragaoTirosPorRajada;
        atirador.rajadaRestante -= 1;
        atirador.proximoTiro = this.app.tempoDecorrido + (atirador.rajadaRestante > 0 ? config.tempo.dragaoIntervaloRajada : intervalo);
        if (atirador.rajadaRestante <= 0) atirador.rajadaRestante = config.tempo.dragaoTirosPorRajada;
      }
    }
    for (const projetil of this.projeteis) {
      if (!projetil.ativa) continue;
      projetil.x += projetil.vx * delta;
      projetil.y += projetil.vy * delta;
      projetil.idade += delta;
      projetil.escala = Math.min(1.5, 1 + projetil.idade * 0.22);
      if (Math.abs(projetil.x - jogador.x) > 900 || projetil.y > 760) projetil.ativa = false;
      if (projetil.ativa && agora >= Math.max(jogador.invulneravelAte, jogador.poderAte) && this.toca(jogador, { x: projetil.x - 7, y: projetil.y - 7, w: 14, h: 14 })) {
        projetil.ativa = false;
        jogador.danoAte = agora + 420;
        jogador.invulneravelAte = agora + 700;
        this.app.tempoRestante = Math.max(1, this.app.tempoRestante - config.tempo.projetil);
      }
    }
    for (const camuflado of this.camuflados) {
      if (camuflado.morto) continue;
      const perto = Math.abs(jogador.x - camuflado.x) <= config.tempo.camufladoDistancia;
      if (perto && !camuflado.revelado && agora >= camuflado.cooldownAte) {
        camuflado.revelado = true; camuflado.vy = -690;
      }
      if (camuflado.revelado) {
        camuflado.vy += config.gravidade * delta; camuflado.y += camuflado.vy * delta;
        if (camuflado.y >= camuflado.baseY) {
          camuflado.y = camuflado.baseY; camuflado.vy = 0; camuflado.revelado = false; camuflado.cooldownAte = agora + 2400;
        }
        if (agora >= Math.max(jogador.invulneravelAte, jogador.poderAte) && this.toca(jogador, camuflado)) {
          const pisou = jogador.vy > 0 && yAnterior + jogador.h <= camuflado.y + 14;
          if (pisou) {
            camuflado.morto = true; jogador.vy = -430; this.app.adicionarTempo(config.tempo.pisarBicho);
            this.chifres.push({ x: camuflado.x + 10, y: camuflado.y - 18, w: 25, h: 14, vy: -250, baseY: camuflado.baseY + camuflado.h - 14, ativo: true });
            this.criarExplosao(camuflado.x + 20, camuflado.y + 20);
          } else {
            jogador.danoAte = agora + 500; jogador.invulneravelAte = agora + 1200; jogador.vy = -390;
            this.app.tempoRestante = Math.max(1, this.app.tempoRestante - config.tempo.colisaoBicho);
          }
        }
      }
    }
    for (const chifre of this.chifres) {
      if (!chifre.ativo) continue;
      if (chifre.y < chifre.baseY) { chifre.vy += config.gravidade * delta; chifre.y = Math.min(chifre.baseY, chifre.y + chifre.vy * delta); }
      if (chifre.y >= chifre.baseY && jogador.vy >= 0 && this.toca(jogador, chifre) && yAnterior + jogador.h <= chifre.y + 8) {
        jogador.y = chifre.y - jogador.h; jogador.vy = -config.pulo * 0.82; jogador.noChao = false;
      }
    }
    for (const congelante of this.congelantes) {
      if (congelante.morto) continue;
      congelante.x += congelante.vx * delta;
      if (congelante.x <= congelante.inicio || congelante.x + congelante.w >= congelante.fim) congelante.vx *= -1;
      if (agora >= Math.max(jogador.invulneravelAte, jogador.poderAte) && this.toca(jogador, congelante)) {
        const pisou = jogador.vy > 0 && yAnterior + jogador.h <= congelante.y + 14;
        if (pisou) { congelante.morto = true; jogador.vy = -430; this.app.adicionarTempo(config.tempo.pisarBicho); this.criarExplosao(congelante.x, congelante.y); }
        else { jogador.paralisadoAte = agora + config.tempo.congelamentoDuracao * 1000; jogador.danoAte = agora + 500; jogador.invulneravelAte = agora + 900; }
      }
    }
    for (const aranha of this.aranhas) {
      if (aranha.morto) continue;
      const ciclo = (Math.sin(this.app.tempoDecorrido * aranha.velocidade + aranha.fase) + 1) / 2;
      aranha.y = aranha.tetoY + ciclo * 315;
      if (agora >= Math.max(jogador.invulneravelAte, jogador.poderAte) && this.toca(jogador, aranha)) {
        const pisou = jogador.vy > 0 && yAnterior + jogador.h <= aranha.y + 13;
        if (pisou) { aranha.morto = true; jogador.vy = -430; this.app.adicionarTempo(config.tempo.pisarBicho); this.criarExplosao(aranha.x, aranha.y); }
        else { jogador.danoAte = agora + 450; jogador.invulneravelAte = agora + 1000; this.app.tempoRestante = Math.max(1, this.app.tempoRestante - config.tempo.colisaoBicho); }
      }
    }

    for (const monstro of this.monstrosAvancados) {
      if (monstro.morto) continue;
      if (monstro.tipo === 'mola') {
        if (this.app.tempoDecorrido >= monstro.proximoSalto && monstro.y >= monstro.baseY) { monstro.vy = -590; monstro.proximoSalto = this.app.tempoDecorrido + 2.8; }
        monstro.vy += config.gravidade * delta; monstro.y = Math.min(monstro.baseY, monstro.y + monstro.vy * delta);
      }
      if (monstro.tipo === 'bumerangue' && this.app.tempoDecorrido >= monstro.proximoAtaque) {
        const direcao = Math.sign(jogador.x - monstro.x) || 1;
        this.bumerangues.push({ x: monstro.x + 23, y: monstro.y + 18, vx: direcao * 260, vy: -80, fase: 'ida', idade: 0, dono: monstro, ativo: true });
        monstro.proximoAtaque = this.app.tempoDecorrido + 3.2;
      }
      if (monstro.tipo === 'sombra') {
        if (monstro.estado === 'espera') {
          monstro.y = monstro.baseY + Math.sin(this.app.tempoDecorrido * 2.4 + monstro.baseX) * 28;
        }
        if (monstro.estado === 'espera' && this.app.tempoDecorrido >= monstro.proximaInvestida) {
          const alvoX = jogador.x; const alvoY = jogador.y; const dx = alvoX - monstro.x; const dy = alvoY - monstro.y; const distancia = Math.max(1, Math.hypot(dx, dy));
          monstro.vx = dx / distancia * 330; monstro.vy = dy / distancia * 330; monstro.estado = 'ataque'; monstro.estadoAte = this.app.tempoDecorrido + 1.35;
        }
        if (monstro.estado === 'ataque') {
          monstro.x += monstro.vx * delta; monstro.y += monstro.vy * delta;
          if (this.app.tempoDecorrido >= monstro.estadoAte) monstro.estado = 'retorno';
        } else if (monstro.estado === 'retorno') {
          const dx = monstro.baseX - monstro.x; const dy = monstro.baseY - monstro.y;
          monstro.x += dx * delta * 2.4; monstro.y += dy * delta * 2.4;
          if (Math.hypot(dx, dy) < 15) { monstro.x = monstro.baseX; monstro.y = monstro.baseY; monstro.estado = 'espera'; monstro.proximaInvestida = this.app.tempoDecorrido + 2.5; }
        }
      }
      if (agora >= Math.max(jogador.invulneravelAte, jogador.poderAte) && this.toca(jogador, monstro)) {
        const pisou = jogador.vy > 0 && yAnterior + jogador.h <= monstro.y + 15;
        if (pisou) { monstro.morto = true; jogador.vy = -440; this.app.adicionarTempo(config.tempo.pisarBicho); this.criarExplosao(monstro.x + 22, monstro.y + 20); }
        else { jogador.danoAte = agora + 500; jogador.invulneravelAte = agora + 1200; jogador.vy = -380; this.app.tempoRestante = Math.max(1, this.app.tempoRestante - config.tempo.colisaoBicho); }
      }
    }
    for (const bumerangue of this.bumerangues) {
      if (!bumerangue.ativo) continue;
      bumerangue.idade += delta;
      if (bumerangue.fase === 'ida') {
        bumerangue.x += bumerangue.vx * delta; bumerangue.y += bumerangue.vy * delta; bumerangue.vy += 150 * delta;
        if (bumerangue.idade >= 0.9) bumerangue.fase = 'volta';
      } else {
        if (bumerangue.dono.morto) { bumerangue.ativo = false; continue; }
        const dx = bumerangue.dono.x + 23 - bumerangue.x; const dy = bumerangue.dono.y + 18 - bumerangue.y;
        const distancia = Math.max(1, Math.hypot(dx, dy)); bumerangue.x += dx / distancia * 310 * delta; bumerangue.y += dy / distancia * 310 * delta;
        if (distancia < 20) { bumerangue.ativo = false; continue; }
      }
      if (agora >= Math.max(jogador.invulneravelAte, jogador.poderAte) && this.toca(jogador, { x: bumerangue.x - 12, y: bumerangue.y - 8, w: 24, h: 16 })) {
        bumerangue.ativo = false; jogador.danoAte = agora + 400; jogador.invulneravelAte = agora + 800;
        this.app.tempoRestante = Math.max(1, this.app.tempoRestante - config.tempo.projetil);
      }
    }

    this.atualizarChefe(delta, agora, yAnterior);

    if (!this.chefe?.ativo && this.app.tempoDecorrido - this.ultimoDesafioTempo >= config.tempo.fantasmaApos && !this.fantasmas.some((fantasma) => fantasma.ativa)) {
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

    if (!this.chefe?.ativo && this.app.tempoDecorrido >= this.proximoGigante) {
      this.gigantes.push({ nascimento: this.app.tempoDecorrido, ativa: true, atingiu: false });
      this.agendarGigante();
    }
    for (const gigante of this.gigantes) {
      if (!gigante.ativa) continue;
      const idade = this.app.tempoDecorrido - gigante.nascimento;
      gigante.x = this.camera + this.app.canvas.width + 100 - idade * 330;
      gigante.y = 520;
      if (idade > 6) { gigante.ativa = false; continue; }
      if (!gigante.atingiu && agora >= Math.max(jogador.invulneravelAte, jogador.poderAte) && this.toca(jogador, { x: gigante.x, y: gigante.y, w: 82, h: 100 })) {
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

    for (const fruta of this.frutas) {
      if (fruta.ativa && this.toca(jogador, { x: fruta.x - 18, y: fruta.y - 18, w: 36, h: 36 })) {
        fruta.ativa = false; this.app.adicionarTempo(config.tempo.fruta); this.app.placar.adicionar(config.pontos.especial);
      }
    }
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
      if (!this.chefe?.ativo && estacao.ativa && Math.abs(jogador.x - estacao.x) < 50) {
        estacao.ativa = false;
        this.desafio();
      }
    }

    if (jogador.y > 800) this.tratarQueda();
    this.app.atualizarHud();
  }

  atualizarChefe(delta, agora, yAnterior) {
    const mundo = MatGame.CONFIG.mundo;
    if (!this.chefe && this.app.distancia >= this.proximoChefeMetros) {
      const inicio = this.camera;
      this.plataformas.push({ x: inicio, y: 620, w: this.app.canvas.width + 180, h: 100 });
      const aparicao = Math.round(this.proximoChefeMetros / mundo.chefeCadaMetros);
      this.chefe = { x: inicio + 930, y: 490, w: 105, h: 130, vida: 3, ativo: true, direcao: -1, arenaInicio: inicio + 45, arenaFim: inicio + 1130, invulneravelAte: 0, aparicao, paleta: (aparicao - 1) % 4, proximoTiro: this.app.tempoDecorrido + MatGame.CONFIG.tempo.projetilChefeInicial };
      this.fantasmas.forEach((item) => { item.ativa = false; });
      this.gigantes.forEach((item) => { item.ativa = false; });
      this.magos.forEach((item) => { item.ativa = false; });
      this.fadas.forEach((item) => { item.ativa = false; });
      this.eliminarInimigosNaTela(agora);
    }
    const chefe = this.chefe;
    if (!chefe?.ativo) return;
    this.jogador.x = Math.max(chefe.arenaInicio, Math.min(this.jogador.x, chefe.arenaFim - this.jogador.w));
    chefe.x += chefe.direcao * (72 + (3 - chefe.vida) * 18) * delta;
    if (chefe.x <= chefe.arenaInicio + 500 || chefe.x + chefe.w >= chefe.arenaFim) chefe.direcao *= -1;
    if (this.proximoChefeMetros >= mundo.chefeAtiradorMetros && this.app.tempoDecorrido >= chefe.proximoTiro) {
      const origemX = chefe.x + chefe.w / 2; const origemY = 520; const dx = this.jogador.x - origemX; const dy = this.jogador.y - origemY; const distancia = Math.max(1, Math.hypot(dx, dy));
      this.projeteisChefe.push({ x: origemX, y: origemY, vx: dx / distancia * 210, vy: dy / distancia * 150, ativo: true, simbolo: ['+', '−', '×', '÷'][chefe.aparicao % 4] });
      const reducao = Math.max(0, chefe.aparicao - 3) * 0.25;
      chefe.proximoTiro = this.app.tempoDecorrido + Math.max(MatGame.CONFIG.tempo.projetilChefeMinimo, MatGame.CONFIG.tempo.projetilChefeInicial - reducao);
    }
    for (const projetil of this.projeteisChefe) {
      if (!projetil.ativo) continue;
      projetil.x += projetil.vx * delta; projetil.y += projetil.vy * delta;
      if (projetil.x < chefe.arenaInicio || projetil.x > chefe.arenaFim || projetil.y < 0 || projetil.y > 700) projetil.ativo = false;
      if (projetil.ativo && agora >= Math.max(this.jogador.invulneravelAte, this.jogador.poderAte) && this.toca(this.jogador, { x: projetil.x - 13, y: projetil.y - 13, w: 26, h: 26 })) {
        projetil.ativo = false; this.jogador.danoAte = agora + 450; this.jogador.invulneravelAte = agora + 900;
        this.app.tempoRestante = Math.max(1, this.app.tempoRestante - MatGame.CONFIG.tempo.projetilChefe);
      }
    }
    const escala = 0.55 + chefe.vida * 0.15;
    const hitbox = { x: chefe.x + chefe.w * (1 - escala) / 2, y: 620 - chefe.h * escala, w: chefe.w * escala, h: chefe.h * escala };
    if (this.toca(this.jogador, hitbox)) {
      const pisou = this.jogador.vy > 0 && yAnterior + this.jogador.h <= hitbox.y + 18;
      if (pisou && agora >= chefe.invulneravelAte) {
        chefe.vida -= 1; chefe.invulneravelAte = agora + 900; this.jogador.vy = -480; this.criarExplosao(hitbox.x + hitbox.w / 2, hitbox.y);
        if (chefe.vida <= 0) {
          chefe.ativo = false; this.projeteisChefe.forEach((item) => { item.ativo = false; }); this.app.adicionarTempo(MatGame.CONFIG.tempo.chefe); this.app.placar.adicionar(MatGame.CONFIG.pontos.checkpoint);
          this.reciclagens.push({ x: chefe.x + chefe.w / 2, y: 555, ativa: true });
          this.proximoChefeMetros += mundo.chefeCadaMetros; this.chefe = null;
        }
      } else if (agora >= Math.max(this.jogador.invulneravelAte, this.jogador.poderAte)) {
        this.jogador.danoAte = agora + 550; this.jogador.invulneravelAte = agora + 1300; this.jogador.vy = -400;
        this.app.tempoRestante = Math.max(1, this.app.tempoRestante - MatGame.CONFIG.tempo.colisaoChefe);
      }
    }
  }

  eliminarInimigosNaTela(agora) {
    const perto = (inimigo) => Math.abs(inimigo.x - this.jogador.x) < this.app.canvas.width;
    for (const bicho of this.bichos) if (!bicho.derrotado && perto(bicho)) { bicho.derrotado = true; bicho.derrotadoAte = agora + 900; this.criarExplosao(bicho.x, bicho.y); }
    for (const atirador of this.atiradores) if (!atirador.derrotado && perto(atirador)) { atirador.derrotado = true; atirador.derrotadoAte = agora + 900; this.criarExplosao(atirador.x, atirador.y); }
    for (const camuflado of this.camuflados) if (!camuflado.morto && perto(camuflado)) { camuflado.morto = true; this.criarExplosao(camuflado.x, camuflado.y); }
    for (const congelante of this.congelantes) if (!congelante.morto && perto(congelante)) { congelante.morto = true; this.criarExplosao(congelante.x, congelante.y); }
    for (const aranha of this.aranhas) if (!aranha.morto && perto(aranha)) { aranha.morto = true; this.criarExplosao(aranha.x, aranha.y); }
    for (const monstro of this.monstrosAvancados) if (!monstro.morto && perto(monstro)) { monstro.morto = true; this.criarExplosao(monstro.x, monstro.y); }
    for (const gigante of this.gigantes) if (gigante.ativa && perto(gigante)) { gigante.ativa = false; this.criarExplosao(gigante.x, gigante.y); }
    for (const projetil of this.projeteis) projetil.ativa = false;
    for (const bumerangue of this.bumerangues) bumerangue.ativo = false;
    for (const projetil of this.projeteisChefe) projetil.ativo = false;
  }

  encontroFada() {
    this.app.pausado = true;
    const painel = this.app.panel;
    painel.className = 'panel compact'; painel.classList.remove('hidden');
    painel.innerHTML = `<div style="font-size:4rem">🧚</div><h2>QUAL É O SEU DESEJO?</h2><p>A fada trouxe uma escolha. Selecione apenas um presente:</p><div class="answers"><button data-desejo="tempo">⏱️ +15 SEGUNDOS</button><button data-desejo="coringa" ${this.app.coringa ? 'disabled' : ''}>🃏 1 CORINGA</button><button data-desejo="estrela">🌟 PODER DA ESTRELA</button></div><p class="feedback">${this.app.coringa ? 'Você já tem um coringa; escolha outro presente.' : ''}</p>`;
    painel.querySelectorAll('[data-desejo]').forEach((botao) => { botao.onclick = () => {
      const desejo = botao.dataset.desejo;
      if (desejo === 'tempo') this.app.adicionarTempo(MatGame.CONFIG.tempo.fadaTempo);
      if (desejo === 'coringa') this.app.coringa = true;
      if (desejo === 'estrela') { this.jogador.poderAte = performance.now() + MatGame.CONFIG.tempo.estrelaPoderDuracao * 1000; this.eliminarInimigosNaTela(performance.now()); }
      painel.classList.add('hidden'); this.app.pausado = false;
    }; });
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

  agendarGigante() {
    const tempo = MatGame.CONFIG.tempo;
    this.proximoGigante = this.app.tempoDecorrido + this.app.powerRng.inteiro(tempo.giganteMinimo, tempo.giganteMaximo);
  }

  agendarMago() {
    const tempo = MatGame.CONFIG.tempo;
    this.proximoMago = this.app.tempoDecorrido + this.app.powerRng.inteiro(tempo.magoMinimo, tempo.magoMaximo);
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

  desenharFundo(ctx, largura, altura, camera) {
    const trecho = Math.floor(this.app.distancia / 500);
    const indice = trecho % 5;
    const variacao = Math.floor(trecho / 5) % 3;
    const temas = [
      { nome: 'Floresta dos Números', variantes: [['#68c5db','#d6f5d6','#174d3d','#216e4e','#63d471'],['#53b6c8','#c9ecd0','#24513f','#2d7a54','#81db7d'],['#83d0b1','#e5f4bf','#385942','#397f57','#9bd879']] },
      { nome: 'Deserto das Operações', variantes: [['#f6b26b','#ffe0a3','#a85d32','#9b6335','#f0b65a'],['#ef9364','#ffd29a','#8d4c3d','#a65c3c','#ffc857'],['#f7c873','#fff0bd','#9c673f','#b07745','#f4cf72']] },
      { nome: 'Montanhas da Lógica', variantes: [['#7897c5','#d8e5f4','#384d72','#495f86','#a7c1e3'],['#7d83b8','#d8d5ee','#423f69','#56527e','#b0a8d8'],['#5e91a8','#cce7e8','#315d69','#427582','#a3d0cf']] },
      { nome: 'Cidade das Expressões', variantes: [['#ef8d72','#5a4f82','#252946','#39405f','#f4c95d'],['#d4779b','#51446f','#2e294e','#47406b','#f0a6ca'],['#f0a35e','#4f628e','#293856','#3d5075','#ffd166']] },
      { nome: 'Cosmos Matemático', variantes: [['#050b2c','#182d5a','#111a3b','#263b66','#6ee7ff'],['#170b35','#40265f','#241442','#493068','#d5a6ff'],['#061f2e','#164c5a','#0a303d','#205b66','#73f2c6']] }
    ];
    const tema = temas[indice];
    const [topo, base, terreno, plataforma, borda] = tema.variantes[variacao];
    const gradiente = ctx.createLinearGradient(0, 0, 0, altura); gradiente.addColorStop(0, topo); gradiente.addColorStop(1, base);
    ctx.fillStyle = gradiente; ctx.fillRect(0, 0, largura, altura);

    ctx.save(); ctx.globalAlpha = 0.2;
    if (indice === 0) {
      ctx.fillStyle = '#164e3b'; for (let i=0;i<10;i+=1){const x=((i*150-camera*.12)%1500+1500)%1500;ctx.fillRect(x,330,18,220);ctx.beginPath();ctx.arc(x+9,315,58,0,7);ctx.fill();}
    } else if (indice === 1) {
      ctx.fillStyle = '#ffe28a'; ctx.beginPath(); ctx.arc(1080,120,62,0,7); ctx.fill(); ctx.fillStyle=terreno; for(let i=0;i<5;i+=1){ctx.beginPath();ctx.ellipse(i*310-camera*.08,500,230,85,0,0,7);ctx.fill();}
    } else if (indice === 2) {
      ctx.fillStyle = terreno; for(let i=0;i<6;i+=1){const x=i*270-camera*.1;ctx.beginPath();ctx.moveTo(x,520);ctx.lineTo(x+140,190+(i%2)*80);ctx.lineTo(x+290,520);ctx.fill();ctx.fillStyle='#ffffff77';ctx.beginPath();ctx.moveTo(x+100,285+(i%2)*80);ctx.lineTo(x+140,190+(i%2)*80);ctx.lineTo(x+180,285+(i%2)*80);ctx.fill();ctx.fillStyle=terreno;}
    } else if (indice === 3) {
      ctx.fillStyle = terreno; for(let i=0;i<12;i+=1){const x=((i*125-camera*.16)%1550+1550)%1550;const h=120+(i%4)*55;ctx.fillRect(x,520-h,90,h);ctx.fillStyle='#ffd16677';for(let y=420;y<500;y+=28)ctx.fillRect(x+15,y,12,10);ctx.fillStyle=terreno;}
    } else {
      ctx.fillStyle='#ffffff';for(let i=0;i<45;i+=1){const x=((i*83-camera*.04)%largura+largura)%largura;const y=35+(i*47)%430;ctx.fillRect(x,y,2+(i%3===0),2+(i%3===0));}ctx.fillStyle='#9b5de5';ctx.beginPath();ctx.arc(1040,155,70,0,7);ctx.fill();ctx.strokeStyle='#ffd166';ctx.lineWidth=12;ctx.beginPath();ctx.ellipse(1040,155,110,28,-.25,0,7);ctx.stroke();
    }
    ctx.restore();

    const simbolos = ['+', '−', '×', '÷']; ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = indice === 4 ? '#d8f3ff' : '#17324d'; ctx.font='bold 72px sans-serif';
    for(let i=0;i<12;i+=1){const x=((i*173-camera*.08)%(largura+180)+largura+180)%(largura+180)-90;ctx.fillText(simbolos[i%4],x,90+(i%4)*105);} ctx.restore();
    ctx.fillStyle=terreno;ctx.beginPath();ctx.moveTo(0,620);for(let x=0;x<=largura;x+=100)ctx.lineTo(x,510+Math.sin((x+camera*.25)/130)*50);ctx.lineTo(largura,altura);ctx.lineTo(0,altura);ctx.fill();
    ctx.fillStyle='#08182caa';ctx.font='bold 15px sans-serif';ctx.fillText(`${tema.nome} • variação ${variacao+1}`,18,600);
    return { plataforma, borda, nome: tema.nome, indice, variacao };
  }

  desenhar() {
    const camera = this.camera;
    const ctx = this.ctx;
    const largura = this.app.canvas.width;
    const altura = this.app.canvas.height;
    const tema = this.desenharFundo(ctx, largura, altura, camera);

    for (const plataforma of this.plataformas) {
      if (plataforma.x - camera > largura || plataforma.x + plataforma.w - camera < 0) continue;
      ctx.fillStyle = tema.plataforma;
      ctx.fillRect(plataforma.x - camera, plataforma.y, plataforma.w, plataforma.h);
      ctx.fillStyle = tema.borda;
      ctx.fillRect(plataforma.x - camera, plataforma.y, plataforma.w, 12);
      if (plataforma.movel) {
        ctx.fillStyle = '#fff8'; ctx.font = 'bold 16px sans-serif';
        ctx.fillText(plataforma.eixo === 'x' ? '↔ MÓVEL' : '↕ MÓVEL', plataforma.x - camera + 18, plataforma.y + 18);
      }
    }
    for (const fruta of this.frutas) if (fruta.ativa) {
      ctx.font = '32px sans-serif'; ctx.fillText(fruta.tipo, fruta.x - camera - 16, fruta.y + 12);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('+5s', fruta.x - camera - 12, fruta.y - 18);
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
    for (const atirador of this.atiradores) {
      if (atirador.invisivel) continue;
      ctx.font = '48px sans-serif'; ctx.fillText('🐉', atirador.x - camera - 24, atirador.y + 43);
      if (atirador.derrotado) { ctx.font = '25px sans-serif'; ctx.fillText('😲', atirador.x - camera - 12, atirador.y + 28); }
    }
    for (const projetil of this.projeteis) if (projetil.ativa) {
      ctx.save(); ctx.translate(projetil.x - camera, projetil.y); ctx.scale(projetil.escala || 1, projetil.escala || 1);
      ctx.shadowColor = '#ff6b00'; ctx.shadowBlur = 14; ctx.font = '24px sans-serif'; ctx.fillText('💥', -12, 9); ctx.restore();
    }
    for (const camuflado of this.camuflados) {
      if (camuflado.morto) continue;
      if (!camuflado.revelado) {
        const xCamuflado = camuflado.x - camera;
        ctx.fillStyle = tema.plataforma;
        ctx.beginPath();
        if (tema.indice === 0) {
          ctx.arc(xCamuflado + 20, camuflado.y + 42, 25, Math.PI, Math.PI * 2);
        } else if (tema.indice === 1) {
          ctx.moveTo(xCamuflado - 4, camuflado.y + 42); ctx.quadraticCurveTo(xCamuflado + 8, camuflado.y + 10, xCamuflado + 22, camuflado.y + 24); ctx.quadraticCurveTo(xCamuflado + 35, camuflado.y + 8, xCamuflado + 45, camuflado.y + 42);
        } else if (tema.indice === 2) {
          ctx.moveTo(xCamuflado - 3, camuflado.y + 42); ctx.lineTo(xCamuflado + 12, camuflado.y + 18); ctx.lineTo(xCamuflado + 22, camuflado.y + 27); ctx.lineTo(xCamuflado + 33, camuflado.y + 12); ctx.lineTo(xCamuflado + 45, camuflado.y + 42);
        } else if (tema.indice === 3) {
          ctx.rect(xCamuflado - 2, camuflado.y + 16, 46, 26);
        } else {
          ctx.moveTo(xCamuflado, camuflado.y + 42); ctx.lineTo(xCamuflado + 8, camuflado.y + 13); ctx.lineTo(xCamuflado + 21, camuflado.y + 26); ctx.lineTo(xCamuflado + 32, camuflado.y + 8); ctx.lineTo(xCamuflado + 43, camuflado.y + 42);
        }
        ctx.fill();
        ctx.fillStyle = tema.borda; ctx.fillRect(xCamuflado - 3, camuflado.y + 35, 46, 7);
      } else {
        ctx.fillStyle = '#17a589'; ctx.beginPath(); ctx.roundRect(camuflado.x - camera, camuflado.y, 40, 42, 12); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(camuflado.x - camera + 12, camuflado.y + 13, 6, 0, 7); ctx.arc(camuflado.x - camera + 29, camuflado.y + 13, 6, 0, 7); ctx.fill();
        ctx.fillStyle = '#102a43'; ctx.fillRect(camuflado.x - camera + 11, camuflado.y + 11, 4, 5); ctx.fillRect(camuflado.x - camera + 28, camuflado.y + 11, 4, 5);
        ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.moveTo(camuflado.x - camera + 10, camuflado.y); ctx.lineTo(camuflado.x - camera + 20, camuflado.y - 18); ctx.lineTo(camuflado.x - camera + 29, camuflado.y); ctx.fill();
      }
    }
    for (const chifre of this.chifres) if (chifre.ativo) {
      ctx.save(); ctx.translate(chifre.x - camera + chifre.w / 2, chifre.y + chifre.h / 2);
      if (chifre.y < chifre.baseY) ctx.rotate(performance.now() / 90);
      ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.moveTo(-12, 7); ctx.lineTo(0, -10); ctx.lineTo(12, 7); ctx.fill(); ctx.restore();
    }
    for (const congelante of this.congelantes) if (!congelante.morto) {
      ctx.font = '42px sans-serif'; ctx.fillText('🥶', congelante.x - camera, congelante.y + 38);
    }
    for (const aranha of this.aranhas) if (!aranha.morto) {
      ctx.strokeStyle = '#d8f3ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(aranha.x - camera + 20, aranha.tetoY - 30); ctx.lineTo(aranha.x - camera + 20, aranha.y + 4); ctx.stroke();
      ctx.font = '40px sans-serif'; ctx.fillText('🕷', aranha.x - camera, aranha.y + 36);
    }
    for (const monstro of this.monstrosAvancados) if (!monstro.morto) {
      if (monstro.tipo === 'mola') {
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(monstro.x - camera + 10, monstro.y + 15);
        for (let i = 1; i < 4; i += 1) ctx.lineTo(monstro.x - camera + (i % 2 ? 34 : 10), monstro.y + 15 + i * 9);
        ctx.stroke(); ctx.fillStyle = '#ff6b6b'; ctx.beginPath(); ctx.arc(monstro.x - camera + 22, monstro.y + 10, 20, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(monstro.x - camera + 10, monstro.y + 5, 8, 8); ctx.fillRect(monstro.x - camera + 27, monstro.y + 5, 8, 8);
      } else if (monstro.tipo === 'bumerangue') {
        const mx = monstro.x - camera;
        ctx.fillStyle = '#0fa3b1'; ctx.beginPath(); ctx.ellipse(mx + 23, monstro.y + 25, 23, 21, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#f7a072'; ctx.beginPath(); ctx.moveTo(mx + 4, monstro.y + 15); ctx.lineTo(mx + 23, monstro.y + 2); ctx.lineTo(mx + 42, monstro.y + 15); ctx.lineTo(mx + 35, monstro.y + 22); ctx.lineTo(mx + 11, monstro.y + 22); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(mx + 15, monstro.y + 16, 6, 0, 7); ctx.arc(mx + 31, monstro.y + 16, 6, 0, 7); ctx.fill();
        ctx.fillStyle = '#102a43'; ctx.beginPath(); ctx.arc(mx + 16, monstro.y + 17, 3, 0, 7); ctx.arc(mx + 30, monstro.y + 17, 3, 0, 7); ctx.fill();
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(mx + 23, monstro.y + 30, 10, 0.2, 2.9); ctx.stroke();
      } else {
        ctx.font = '46px sans-serif'; ctx.fillText('🦇', monstro.x - camera, monstro.y + 40);
      }
    }
    for (const bumerangue of this.bumerangues) if (bumerangue.ativo) {
      ctx.save(); ctx.translate(bumerangue.x - camera, bumerangue.y); ctx.rotate(performance.now() / 90);
      ctx.strokeStyle = bumerangue.fase === 'ida' ? '#ffd166' : '#6ee7ff'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-11, -7); ctx.quadraticCurveTo(0, 8, 11, -7); ctx.stroke(); ctx.restore();
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
    for (const projetil of this.projeteisChefe) if (projetil.ativo) {
      ctx.fillStyle = '#ff9f1c'; ctx.shadowColor = '#ff9f1c'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(projetil.x - camera, projetil.y, 14, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#102a43'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(projetil.simbolo, projetil.x - camera, projetil.y + 7); ctx.textAlign = 'start';
    }
    if (this.chefe?.ativo) {
      const chefe = this.chefe; const escala = 0.55 + chefe.vida * 0.15; const cx = chefe.x - camera + chefe.w / 2; const base = 620;
      const paletasChefe = [
        { corpo: '#315c42', rosto: '#5fbf72', espinho: '#264536' },
        { corpo: '#295b7a', rosto: '#56a6c9', espinho: '#183b59' },
        { corpo: '#7a3d58', rosto: '#cc6685', espinho: '#52233a' },
        { corpo: '#67508f', rosto: '#9b82c4', espinho: '#3d2c61' }
      ];
      const cores = paletasChefe[chefe.paleta];
      ctx.save(); ctx.translate(cx, base); ctx.scale(escala, escala);
      const coresBarriga = ['#6ee7ff', '#ffd166', '#ef476f', '#9b5de5']; const corBarriga = coresBarriga[Math.floor(performance.now() / 220) % coresBarriga.length];
      ctx.fillStyle = cores.corpo; ctx.beginPath(); ctx.ellipse(0, -58, 58, 65, 0, 0, 7); ctx.fill();
      ctx.fillStyle = cores.espinho; ctx.beginPath(); ctx.moveTo(-48, -78); ctx.lineTo(-68, -112); ctx.lineTo(-27, -92); ctx.lineTo(0, -125); ctx.lineTo(26, -92); ctx.lineTo(68, -112); ctx.lineTo(48, -76); ctx.fill();
      ctx.fillStyle = cores.rosto; ctx.beginPath(); ctx.arc(0, -103, 39, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-14, -108, 10, 0, 7); ctx.arc(15, -108, 10, 0, 7); ctx.fill(); ctx.fillStyle = '#102a43'; ctx.beginPath(); ctx.arc(-12, -106, 5, 0, 7); ctx.arc(13, -106, 5, 0, 7); ctx.fill();
      ctx.fillStyle = corBarriga; ctx.beginPath(); ctx.ellipse(0, -50, 34, 41, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#102a43'; ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('?', 0, -35);
      ctx.fillStyle = cores.corpo; ctx.fillRect(-47, -22, 28, 24); ctx.fillRect(19, -22, 28, 24); ctx.restore(); ctx.textAlign = 'start';
      ctx.fillStyle = '#fff'; ctx.font = 'bold 17px sans-serif'; ctx.fillText(`GUARDIÃO DA INCÓGNITA  ${'❤'.repeat(chefe.vida)}`, cx - 125, base - chefe.h * escala - 22);
    }
    for (const gigante of this.gigantes) if (gigante.ativa) {
      const gx = gigante.x - camera;
      const passo = Math.sin(performance.now() / 65) * 8;
      ctx.fillStyle = '#5a2d82'; ctx.beginPath(); ctx.ellipse(gx + 42, gigante.y + 48, 42, 48, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8ac926'; ctx.beginPath(); ctx.arc(gx + 42, gigante.y + 18, 31, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3b225f'; ctx.beginPath(); ctx.moveTo(gx + 12, gigante.y + 10); ctx.lineTo(gx + 25, gigante.y - 24); ctx.lineTo(gx + 38, gigante.y + 4); ctx.lineTo(gx + 54, gigante.y - 25); ctx.lineTo(gx + 70, gigante.y + 12); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(gx + 31, gigante.y + 17, 8, 0, 7); ctx.arc(gx + 55, gigante.y + 17, 8, 0, 7); ctx.fill();
      ctx.fillStyle = '#102a43'; ctx.beginPath(); ctx.arc(gx + 33, gigante.y + 19, 4, 0, 7); ctx.arc(gx + 57, gigante.y + 19, 4, 0, 7); ctx.fill();
      ctx.strokeStyle = '#102a43'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(gx + 43, gigante.y + 32, 14, 0.1, Math.PI - 0.1); ctx.stroke();
      ctx.fillStyle = '#3b225f'; ctx.fillRect(gx + 8, gigante.y + 82 + passo, 25, 18); ctx.fillRect(gx + 52, gigante.y + 82 - passo, 25, 18);
      ctx.fillStyle = '#ef476f'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('PULE!', gx + 15, gigante.y - 31);
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
    for (const reciclagem of this.reciclagens) if (reciclagem.ativa) {
      const flutuar = Math.sin(performance.now() / 180) * 5;
      ctx.font = '44px sans-serif'; ctx.fillText('♻', reciclagem.x - camera - 22, reciclagem.y + flutuar);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('TROCAR PROBLEMA', reciclagem.x - camera - 58, reciclagem.y - 36 + flutuar);
    }
    for (const fada of this.fadas) if (fada.ativa) {
      ctx.font = '52px sans-serif'; ctx.fillText('🧚', fada.x - camera - 26, fada.y + 24);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.fillText('UM DESEJO!', fada.x - camera - 42, fada.y - 32);
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
    if (agoraVisual < jogador.paralisadoAte) { ctx.fillStyle = '#6ee7ff66'; ctx.fillRect(telaX - 8, jogador.y - 5, jogador.w + 16, jogador.h + 10); ctx.font = '22px sans-serif'; ctx.fillText('❄', telaX + 8, jogador.y - 10); }
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
