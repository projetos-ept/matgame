MatGame.ResultScene = {
  mostrar(app, motivo) {
    app.parar();
    if (motivo === 'tempo' || motivo === 'queda') app.sons?.tocar('gameOver');
    const recorde = MatGame.Recordes.salvar(app.modo, {
      pontos: app.placar.pontos,
      distancia: app.distancia,
      comboMaximo: app.placar.comboMaximo
    });
    const posicao = MatGame.Recordes.registrarAluno({
      aluno: app.aluno,
      pontos: app.placar.pontos,
      distancia: app.distancia,
      seed: app.seed
    });
    const stats = app.placar.stats;
    const nomes = { tabuada: 'Tabuada', expressao: 'Expressões', dinheiro: 'Dinheiro', problema: 'Problemas' };
    const desempenho = Object.keys(nomes).map((chave) => `<div><b>${nomes[chave]}</b><br>${app.placar.percentual(chave)}% (${stats[chave][0]}/${stats[chave][1]})</div>`).join('');
    const praticar = Object.keys(nomes).filter((chave) => stats[chave][1]).sort((a, b) => app.placar.percentual(a) - app.placar.percentual(b))[0];
    const titulo = motivo === 'queda' ? 'QUASE! TENTE DE NOVO' : motivo === 'tempo' ? 'TEMPO ESGOTADO!' : 'RESULTADO';

    app.panel.className = 'panel';
    app.panel.classList.remove('hidden');
    app.panel.innerHTML = `
      <h2>${titulo}</h2>
      <p><b>${MatGame.MenuScene.escapar(app.aluno)}</b> • ${posicao ? `${posicao}º lugar no ranking local` : 'resultado registrado'}</p>
      <div class="stats">
        <div><b>⭐ Pontuação atual</b><br>${app.placar.pontos}</div>
        <div><b>🏆 Maior pontuação</b><br>${recorde.pontos}</div>
        <div><b>📏 Distância</b><br>${app.distancia} m</div>
        <div><b>🔥 Melhor combo</b><br>×${app.placar.comboMaximo}</div>
        <div><b>Máximo conquistável</b><br>${app.placar.maximo}</div>
        <div><b>Aproveitamento</b><br>${app.placar.maximo ? Math.round(app.placar.pontos / app.placar.maximo * 100) : 0}%</div>
      </div>
      <h3>Desempenho matemático</h3><div class="stats">${desempenho}</div>
      <p>${praticar ? `Próximo foco: pratique <b>${nomes[praticar]}</b>. Cada tentativa ajuda!` : 'Encontre estações matemáticas na próxima aventura!'}</p>
      <p>SEED <b>${app.seed}</b></p>
      <div class="actions"><button id="again">MESMA SEED</button><button id="new" class="secondary">NOVA PARTIDA</button><button id="ranking" class="secondary">RANKING</button><button id="menu" class="secondary">MENU</button></div>`;
    app.panel.querySelector('#again').onclick = () => app.iniciar(app.seed, app.modo, app.aluno, app.personagem);
    app.panel.querySelector('#new').onclick = () => app.iniciar(String(Date.now()).slice(-8), app.modo, app.aluno, app.personagem);
    app.panel.querySelector('#ranking').onclick = () => MatGame.MenuScene.ranking(app);
    app.panel.querySelector('#menu').onclick = () => MatGame.MenuScene.mostrar(app);
  }
};
