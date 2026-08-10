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

    if (categoria === 'problema') {
      this.etapaInterpretacao(app, questao, aoFim, titulo, opcoes);
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

  etapaInterpretacao(app, questao, aoFim, titulo, opcoes) {
    this.pergunta(app, {
      titulo,
      texto: `${questao.problema}<br><small>Qual cálculo resolve o problema?</small>`,
      alternativas: questao.alternativasExpressao,
      resposta: questao.expressao
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
        <small>O bônus diminui, mas você pode responder com calma mesmo quando chegar a zero.</small>
      </div>
      <p class="question">${dados.texto}</p>
      <div class="answers"></div>
      ${app.coringa ? '<button type="button" class="joker-button" data-coringa>🃏 USAR CORINGA — remover 2 erradas</button>' : ''}
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
      if (restante === 0) textoTempo.parentElement.innerHTML = '💭 Sem bônus agora — continue pensando com calma';
    };
    const timer = setInterval(atualizarTimer, 200);

    dados.alternativas.forEach((alternativa, indice) => {
      const botao = document.createElement('button');
      botao.textContent = dados.exibicao ? dados.exibicao[indice] : alternativa;
      botao.dataset.correta = alternativa === dados.resposta ? 'sim' : 'nao';
      botao.onclick = () => {
        tentativas += 1;
        if (alternativa === dados.resposta) {
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
          botao.disabled = true;
          botao.textContent += ' — tente outra';
          painel.querySelector('.feedback').textContent = 'Ainda não. Sem perder tempo da partida: pense e tente novamente!';
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
