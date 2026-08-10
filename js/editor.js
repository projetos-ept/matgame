(() => {
  const CHAVE = 'aventura-matematica-banco-editor-v1';
  const original = window.MatGameContent;
  let banco;
  try { banco = JSON.parse(localStorage.getItem(CHAVE)) || structuredClone(original); }
  catch (erro) { banco = JSON.parse(JSON.stringify(original)); }
  const categoria = document.querySelector('#categoria');
  const questao = document.querySelector('#questao');
  const dados = document.querySelector('#dados');
  const mensagem = document.querySelector('#mensagem');

  function listar(selecionarId) {
    questao.innerHTML = '';
    banco[categoria.value].forEach((item) => {
      const opcao = document.createElement('option');
      opcao.value = item.id; opcao.textContent = `${item.id} — ${item.pergunta || item.problema}`;
      questao.appendChild(opcao);
    });
    if (selecionarId) questao.value = selecionarId;
    exibir();
  }
  function atual() { return banco[categoria.value].find((item) => item.id === questao.value); }
  function exibir() { dados.value = JSON.stringify(atual(), null, 2); mensagem.textContent = ''; }
  function validar(item) {
    if (!item || typeof item !== 'object' || !item.id) throw Error('Informe um objeto com ID.');
    const duplicado = Object.values(banco).flat().find((q) => q.id === item.id && q !== atual());
    if (duplicado) throw Error(`O ID ${item.id} já existe.`);
    if (!Array.isArray(item.alternativas) || item.alternativas.length < 3) throw Error('Inclua pelo menos 3 alternativas.');
    if (new Set(item.alternativas.map(String)).size !== item.alternativas.length) throw Error('As alternativas não podem se repetir.');
    if (!item.alternativas.some((alternativa) => alternativa === item.resposta)) throw Error('A resposta correta precisa estar nas alternativas.');
    if (categoria.value === 'problemas' && (!item.expressao || !item.alternativasExpressao?.includes(item.expressao))) throw Error('O cálculo correto precisa estar nas alternativas de expressão.');
  }
  function persistir(texto = '✓ Questão salva neste computador e pronta para o jogo.') {
    localStorage.setItem(CHAVE, JSON.stringify(banco)); mensagem.textContent = texto;
  }

  categoria.onchange = () => listar(); questao.onchange = exibir;
  document.querySelector('#salvar').onclick = () => {
    try {
      const item = JSON.parse(dados.value); validar(item);
      const indice = banco[categoria.value].findIndex((q) => q.id === questao.value);
      banco[categoria.value][indice] = item; persistir(); listar(item.id);
    } catch (erro) { mensagem.textContent = `Erro: ${erro.message}`; }
  };
  document.querySelector('#nova').onclick = () => {
    const copia = structuredClone(atual()); copia.id = `${copia.id}_COPIA_${Date.now().toString().slice(-5)}`;
    banco[categoria.value].push(copia); persistir('✓ Cópia criada. Altere e salve os dados.'); listar(copia.id);
  };
  document.querySelector('#exportar').onclick = () => {
    const blob = new Blob([JSON.stringify(banco, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'conteudo-aventura-matematica.json'; link.click(); URL.revokeObjectURL(link.href);
  };
  document.querySelector('#importar').onchange = async (evento) => {
    try {
      const importado = JSON.parse(await evento.target.files[0].text());
      for (const nome of ['tabuadas', 'expressoes', 'dinheiro', 'problemas']) if (!Array.isArray(importado[nome])) throw Error(`Categoria ${nome} ausente.`);
      banco = importado; persistir('✓ Banco importado e salvo neste computador.'); listar();
    } catch (erro) { mensagem.textContent = `Erro ao importar: ${erro.message}`; }
  };
  document.querySelector('#restaurar').onclick = () => {
    if (!confirm('Apagar todas as edições locais e restaurar o banco original?')) return;
    localStorage.removeItem(CHAVE); banco = structuredClone(original); listar(); mensagem.textContent = 'Banco original restaurado.';
  };
  listar();
})();
