MatGame.MenuScene = {
  personagens: [
    { id: 'exploradora', nome: 'Lia, a exploradora', emoji: '🧭', cor: '#ff8c42' },
    { id: 'cientista', nome: 'Theo, o cientista', emoji: '🔬', cor: '#36c5f0' },
    { id: 'inventora', nome: 'Bia, a inventora', emoji: '⚙️', cor: '#9b5de5' }
  ],

  mostrar(app) {
    app.parar();
    const painel = app.panel;
    painel.className = 'panel';
    painel.innerHTML = `
      <div aria-hidden="true" style="font-size:4rem">🏃‍♀️➕⭐</div>
      <h1>AVENTURA<br>MATEMÁTICA</h1>
      <p class="tagline">Corra, pule e use seu raciocínio para conquistar as estações matemáticas!</p>
      <div class="menu">
        <button data-a="jogar">▶ JOGAR</button>
        <button data-a="turma" class="secondary"># DESAFIO DA TURMA</button>
        <button data-a="ranking" class="secondary">🏆 RANKING LOCAL</button>
        <button data-a="ajuda" class="secondary">? COMO JOGAR</button>
        <button data-a="config" class="secondary">⚙ CONFIGURAÇÕES</button>
      </div>
      <p class="hint">Funciona sem internet • Progresso salvo neste computador</p>`;
    painel.querySelector('[data-a=jogar]').onclick = () => this.identificar(app, String(Date.now()).slice(-8), 'infinito');
    painel.querySelector('[data-a=turma]').onclick = () => this.turma(app);
    painel.querySelector('[data-a=ranking]').onclick = () => this.ranking(app);
    painel.querySelector('[data-a=ajuda]').onclick = () => this.ajuda(app);
    painel.querySelector('[data-a=config]').onclick = () => this.config(app);
  },

  identificar(app, seed, modo) {
    const ultimoNome = localStorage.getItem('aventura-matematica-ultimo-aluno') || '';
    app.panel.innerHTML = `
      <h2>QUEM VAI JOGAR?</h2>
      <label class="question" for="aluno">Digite seu primeiro nome:</label>
      <input id="aluno" maxlength="24" autocomplete="off" value="${this.escapar(ultimoNome)}" placeholder="Ex.: Ana">
      <h3>Escolha seu personagem</h3>
      <div class="character-grid"></div>
      <p class="feedback" role="alert"></p>
      <button id="back" class="secondary">VOLTAR</button>`;
    const grade = app.panel.querySelector('.character-grid');
    this.personagens.forEach((personagem) => {
      const botao = document.createElement('button');
      botao.className = 'character-card';
      botao.style.setProperty('--character-color', personagem.cor);
      botao.innerHTML = `<span>${personagem.emoji}</span><b>${personagem.nome}</b><small>SELECIONAR</small>`;
      botao.onclick = () => {
        const nome = app.panel.querySelector('#aluno').value.trim().replace(/\s+/g, ' ');
        if (nome.length < 2) {
          app.panel.querySelector('.feedback').textContent = 'Digite um nome com pelo menos 2 letras.';
          app.panel.querySelector('#aluno').focus();
          return;
        }
        localStorage.setItem('aventura-matematica-ultimo-aluno', nome);
        app.iniciar(seed, modo, nome, personagem.id);
      };
      grade.appendChild(botao);
    });
    app.panel.querySelector('#back').onclick = () => this.mostrar(app);
    app.panel.querySelector('#aluno').focus();
  },

  turma(app) {
    app.panel.innerHTML = `<h2>DESAFIO DA TURMA</h2><p class="tagline">Digite o mesmo código em todos os computadores para jogar a mesma aventura.</p><input id="seed" inputmode="numeric" maxlength="12" placeholder="Ex.: 82741" aria-label="Código da partida"><div class="actions"><button id="go">CONTINUAR</button><button id="back" class="secondary">VOLTAR</button></div><p class="feedback"></p>`;
    app.panel.querySelector('#go').onclick = () => {
      const seed = app.panel.querySelector('#seed').value.trim();
      if (seed) this.identificar(app, seed, 'turma');
      else app.panel.querySelector('.feedback').textContent = 'Digite o código da turma.';
    };
    app.panel.querySelector('#back').onclick = () => this.mostrar(app);
  },

  ranking(app) {
    const entradas = MatGame.Recordes.ranking().slice(0, 10);
    const linhas = entradas.length
      ? entradas.map((item, indice) => `<tr><td>${indice + 1}º</td><td>${this.escapar(item.aluno)}</td><td>${item.pontos}</td><td>${item.distancia} m</td></tr>`).join('')
      : '<tr><td colspan="4">Ainda não há partidas registradas.</td></tr>';
    app.panel.innerHTML = `<h2>🏆 RANKING LOCAL</h2><p>Melhores resultados salvos neste computador.</p><div class="ranking-wrap"><table><thead><tr><th>Pos.</th><th>Aluno</th><th>Pontos</th><th>Distância</th></tr></thead><tbody>${linhas}</tbody></table></div><button id="back">VOLTAR</button>`;
    app.panel.querySelector('#back').onclick = () => this.mostrar(app);
  },

  ajuda(app) {
    app.panel.innerHTML = `<h2>COMO JOGAR</h2><p class="question">← → ou A/D para andar<br>↑, W ou ESPAÇO para pular<br>ESC para pausar<br><br>Pule sobre as bolinhas inimigas para ganhar +5s; se elas encostarem de lado, você perde 3s. Colete estrelas e toque no mago voador para +30s. Desvie dos trios de espinhos e encontre os portais <b>?</b>.</p><button id="back">ENTENDI!</button>`;
    app.panel.querySelector('#back').onclick = () => this.mostrar(app);
  },

  config(app) {
    app.panel.innerHTML = `<h2>CONFIGURAÇÕES</h2><label class="question"><input id="debug" type="checkbox" style="width:auto" ${app.debug ? 'checked' : ''}> Mostrar informações de professor/debug</label><p class="hint">O volume não é necessário neste protótipo sem áudio.</p><button id="back">VOLTAR</button>`;
    app.panel.querySelector('#debug').onchange = (evento) => { app.debug = evento.target.checked; };
    app.panel.querySelector('#back').onclick = () => this.mostrar(app);
  },

  escapar(texto) {
    return String(texto).replace(/[&<>'"]/g, (caractere) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[caractere]);
  }
};
