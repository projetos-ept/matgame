# Aventura Matemática Offline

Um platformer educacional 2D para o 6º ano: o estudante corre, pula, coleta moedas e encontra estações de raciocínio. A ação pausa nas perguntas para que leitura e cálculo não disputem atenção.

## Executar (sem internet)

O jogo não faz nenhuma requisição externa. Como navegadores bloqueiam a leitura de JSON em páginas abertas por `file://`, use o servidor local incluído:

1. Instale Python 3 (normalmente já presente em Linux e pode ser instalado uma vez no Windows).
2. Copie **a pasta inteira**, preservando a estrutura.
3. Abra um terminal nessa pasta e execute `python iniciar.py` (no Windows, `py iniciar.py` também funciona).
4. Abra `http://127.0.0.1:8000` se o navegador não abrir sozinho.
5. Para encerrar, feche a janela do terminal ou pressione `Ctrl+C`.

Não é necessário instalar pacotes Python nem acessar a internet. Chrome, Edge e outros navegadores Chromium são recomendados. Um servidor alternativo, para quem já usa Node, é `npx serve` — mas este pode tentar baixar dependências, por isso o inicializador Python é preferível.

## Controles

- **← / →** ou **A / D**: andar;
- **↑**, **W** ou **Espaço**: pular;
- **Esc** ou botão **Ⅱ**: pausar;
- clique/toque nos botões grandes para responder.

Caia para encerrar uma tentativa. Espinhos apenas empurram o personagem, sem punição severa. Portais com `?` abrem desafios. Checkpoints e moedas dão pontos.

## Arquitetura

- `index.html` e `css/game.css`: página, HUD, painéis responsivos e acessíveis;
- `vendor/phaser.min.js`: adaptador de runtime local no namespace Phaser, sem dependências externas;
- `js/config.js`: física, frequência, probabilidades e toda a pontuação;
- `js/game/seed.js`: PRNG determinístico; `chunks.js` contém blocos válidos; `procedural.js` concatena esses blocos;
- `js/game/score.js`: placar, combo, estatísticas e recordes em LocalStorage;
- `js/math/mathEngine.js`: seleção sem repetição recente, embaralhamento e moeda em centavos;
- `js/scenes/`: menu, plataforma, desafio e resultado;
- `banco/conteudo.json`: conteúdo pedagógico editável;
- `tests/validar.js`: validações determinísticas e dos bancos.

A semente do cenário e a semente derivada das questões são independentes. Portanto, animação ou velocidade do computador não alteram chunks, questões nem alternativas.

## Alterar conteúdo

Edite `banco/conteudo.json` com um editor de texto. JSON exige aspas duplas, vírgula entre itens e nenhuma vírgula depois do último item.

### Alterar ou adicionar questão

Copie um item da categoria desejada, crie um `id` único e altere pergunta, resposta, dificuldade e alternativas. A resposta deve aparecer exatamente em `alternativas`, sem duplicatas. Dinheiro é sempre inteiro em **centavos** (`750` aparece como `R$ 7,50`). Problemas têm ainda `expressao`, `alternativasExpressao`, `operacoes`, `pontosInterpretacao` e `pontosCalculo`.

### Adicionar produto

Inclua em `produtos` um objeto como `{"id":"PRD_11","nome":"Estojo","precoCentavos":1590}`. Produtos documentam o catálogo; para criar uma situação, acrescente também uma questão em `dinheiro`.

### Pontuação e dificuldade

Em `js/config.js`, edite `pontos`, gravidade, velocidade, pulo, intervalo de estações ou probabilidades de categoria. Em `js/game/chunks.js`, cada chunk declara dificuldade, largura, entrada, saída, peso, permissão de desafio e pontuação máxima.

### Adicionar chunk

Copie um objeto em `MatGame.CHUNKS`, use `largura: 960`, mantenha entrada e saída na altura segura e informe plataformas como `[x, y, largura, altura]`. Opcionalmente use `obstaculos`, `estacao` ou `checkpoint`. Rode os testes depois.

### Substituir imagens

O MVP desenha formas no Canvas e não depende de imagens. Para arte futura, coloque arquivos próprios em `assets/sprites`, `assets/tiles`, `assets/backgrounds` ou `assets/ui`, registre licença em `CREDITS.md` e carregue-os antes do início da cena. Mantenha um fallback geométrico para computadores modestos.

## Testes e modo debug

Execute `node tests/validar.js`. O teste confere determinismo, mínimos do banco, alternativas, respostas, centavos, prioridade de operações, chunks, persistência, pontuação máxima e não repetição. Em **Configurações**, o modo debug mostra chunk, dificuldade, questão e resposta; ele começa desligado.

## Cópia para a escola e dados locais

Copie todo o diretório por pendrive ou rede local. Faça um teste com Wi-Fi desligado. O recorde fica no perfil do navegador (`LocalStorage`) e não acompanha a pasta ao ser copiada. Não use janela anônima e não limpe “dados do site” se quiser conservar recordes. A seed permite repetir o mesmo conteúdo em outra máquina; digite-a em **Desafio da Turma**.

## Escopo do MVP

Inclui movimento, salto, colisão, câmera, chunks infinitos, obstáculos, moedas, checkpoints, quatro categorias, problemas em duas etapas, combo, seed, recordes e resultado formativo. Áudio, touchscreen direcional e arte externa ficam preparados como expansões, sem bloquear a versão jogável.
