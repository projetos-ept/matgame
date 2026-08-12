MatGame.ChallengeScene = {
  mostrar(app, questao, categoria, aoFim, opcoes = {}) {
    app.pausado = true;
    const painel = app.panel;
    painel.className = 'panel compact';
    painel.classList.remove('hidden');
    const titulo = {
      tabuada: 'TABUADA',
      expressao: 'PRIORIDADE DAS OPERAÇÕES',
      dinheiro: 'DINHEIRO',
      problema: 'INTERPRETAÇÃO'
    }[categoria];
    const aoTrocar = () => {
      const nova = opcoes.origem?.startsWith('fantasma')
        ? app.seletor.selecionarDificil()
        : app.seletor.selecionar(categoria, app.gerador.dificuldade());
      app.questaoDebug = nova;
      this.mostrar(app, nova, categoria, aoFim, opcoes);
    };

    if (categoria === 'problema') {
      this.etapaInterpretacao(app, questao, aoFim, titulo, opcoes, aoTrocar);
      return;
    }

    this.pergunta(app, {
      titulo,
      texto: questao.pergunta,
      alternativas: questao.alternativas,
      exibicao: questao.alternativasExibicao,
      resposta: questao.resposta
    }, (correta, primeiraTentativa, bonusTempo) => {
      app.placar.responder(categoria, correta, MatGame.CONFIG.pontos[categoria]);
      if (correta && primeiraTentativa) app.placar.adicionar(MatGame.CONFIG.pontos.primeiraTentativa);
      app.adicionarTempo(this.ajustarBonus(bonusTempo, opcoes));
      aoFim();
    });
  },

  etapaInterpretacao(app, questao, aoFim, titulo, opcoes, aoTrocar) {
    this.pergunta(app, {
      titulo,
      texto: `${questao.problema}<br><small>Qual cálculo resolve o problema?</small>`,
      alternativas: questao.alternativasExpressao,
      resposta: questao.expressao,
      aoTrocar
    }, (correta, primeiraTentativa, bonusTempo) => {
      app.placar.responder('interpretacao', correta, MatGame.CONFIG.pontos.interpretacao);
      app.adicionarTempo(this.ajustarBonus(bonusTempo, opcoes));
      this.pergunta(app, {
        titulo: 'AGORA CALCULE',
        texto: `${questao.expressao} = ?`,
        alternativas: questao.alternativas,
        resposta: questao.resposta
      }, (calculoCorreto, primeiraNoCalculo, bonusCalculo) => {
        app.placar.responder('calculo', calculoCorreto, MatGame.CONFIG.pontos.calculo);
        app.placar.stats.problema[1] += 1;
        if (calculoCorreto) app.placar.stats.problema[0] += 1;
        if (calculoCorreto && primeiraTentativa && primeiraNoCalculo) {
          app.placar.adicionar(MatGame.CONFIG.pontos.primeiraTentativa);
        }
        app.adicionarTempo(this.ajustarBonus(bonusCalculo, opcoes));
        aoFim();
      });
    });
  },

  calcularBonus(segundos) {
    const config = MatGame.CONFIG.tempo;
    if (segundos <= config.respostaMuitoRapidaAte) return config.bonusMuitoRapido;
    if (segundos <= config.respostaRapidaAte) return config.bonusRapido;
    if (segundos <= config.perguntaBonusMaximo) return config.bonusComCalma;
    return MatGame.CONFIG.tempo.respostaSemPressa;
  },

  ajustarBonus(bonus, opcoes) {
    const fator = opcoes.bonusMultiplicador || 1;
    return Math.max(1, Math.round(bonus * fator));
  },

  pergunta(app, dados, callback) {
    let tentativas = 0;
    let finalizada = false;
    const inicio = performance.now();
    const limite = MatGame.CONFIG.tempo.perguntaBonusMaximo;
    const painel = app.panel;
    painel.innerHTML = `
      <div style="font-size:2.5rem">🧠</div>
      <h2>${dados.titulo}</h2>
      <div class="question-timer" aria-live="polite">
        <b>⚡ Bônus de tempo: <span data-tempo>${limite}</span>s</b>
        <div class="timer-track"><span data-barra></span></div>
        <small>O bônus diminui; depois de zerar, uma resposta correta ainda vale +5s.</small>
      </div>
      <p class="question">${dados.texto}</p>
      <div class="answers"></div>
      ${app.coringa ? '<button type="button" class="joker-button" data-coringa>🃏 USAR CORINGA — remover 2 erradas</button>' : ''}
      ${app.reciclagens > 0 && dados.aoTrocar ? `<button type="button" class="secondary" data-reciclar>♻ TROCAR PROBLEMA (${app.reciclagens})</button>` : ''}
      <p class="feedback" role="status"></p>`;

    const caixa = painel.querySelector('.answers');
    const textoTempo = painel.querySelector('[data-tempo]');
    const barra = painel.querySelector('[data-barra]');
    const atualizarTimer = () => {
      if (finalizada) return;
      const decorrido = (performance.now() - inicio) / 1000;
      const restante = Math.max(0, limite - decorrido);
      textoTempo.textContent = Math.ceil(restante);
      barra.style.width = `${restante / limite * 100}%`;
      if (restante === 0) textoTempo.parentElement.innerHTML = '💭 Faixa rápida encerrada — acertar ainda vale +5s';
    };
    const timer = setInterval(atualizarTimer, 200);

    const reciclar = painel.querySelector('[data-reciclar]');
    if (reciclar) reciclar.onclick = () => {
      finalizada = true;
      clearInterval(timer);
      app.reciclagens = Math.max(0, app.reciclagens - 1);
      dados.aoTrocar();
    };

    dados.alternativas.forEach((alternativa, indice) => {
      const botao = document.createElement('button');
      botao.textContent = dados.exibicao ? dados.exibicao[indice] : alternativa;
      botao.dataset.correta = alternativa === dados.resposta ? 'sim' : 'nao';
      botao.onclick = () => {
        tentativas += 1;
        if (alternativa === dados.resposta) {
          app.sons?.tocar('acerto');
          finalizada = true;
          clearInterval(timer);
          const segundos = (performance.now() - inicio) / 1000;
          const bonus = this.calcularBonus(segundos);
          painel.querySelector('.feedback').textContent = bonus
            ? `✓ Muito bem! Você ganhou +${bonus} segundos!`
            : '✓ Muito bem! Continue a aventura!';
          [...caixa.children].forEach((item) => { item.disabled = true; });
          setTimeout(() => callback(true, tentativas === 1, bonus), 650);
        } else {
          app.sons?.tocar('erro');
          botao.disabled = true;
          botao.textContent += ' — tente outra';
          app.tempoRestante = Math.max(1, app.tempoRestante - MatGame.CONFIG.tempo.erroPergunta);
          app.ultimoBonusTempo = { segundos: -MatGame.CONFIG.tempo.erroPergunta, ate: performance.now() + 1400 };
          painel.querySelector('.feedback').textContent = `Ainda não. A tentativa custou ${MatGame.CONFIG.tempo.erroPergunta}s; pense com calma e tente novamente!`;
          app.placar.combo = 0;
        }
      };
      caixa.appendChild(botao);
    });

    const usarCoringa = painel.querySelector('[data-coringa]');
    if (usarCoringa) usarCoringa.onclick = () => {
      const erradas = [...caixa.querySelectorAll('button[data-correta="nao"]:not(:disabled)')].slice(0, 2);
      erradas.forEach((botao) => {
        botao.disabled = true;
        botao.textContent = '✕ Alternativa removida pelo coringa';
      });
      app.coringa = false;
      usarCoringa.remove();
      painel.querySelector('.feedback').textContent = '🃏 O coringa eliminou duas alternativas erradas!';
    };
  }
};
