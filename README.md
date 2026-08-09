# Aventura Matemática Offline

Um platformer educacional 2D para o 6º ano: o estudante corre, pula, coleta moedas e encontra estações de raciocínio. A ação pausa nas perguntas para que leitura e cálculo não disputem atenção.

## Instalação recomendada em 15 computadores

O professor **não precisa abrir um servidor em cada computador**. O banco JSON também é empacotado como um script local, portanto a versão atual funciona diretamente por `file://`.

### Opção 1 — instalador Windows (recomendada)

1. Em apenas um computador de preparação, instale o [Inno Setup 6](https://jrsoftware.org/isinfo.php). Essa ferramenta é necessária somente para **criar** o instalador, nunca nos computadores dos estudantes.
2. Dê duplo clique em `criar-instalador.cmd`.
3. O arquivo pronto será criado em `installer\Output\Instalar-Aventura-Matematica.exe`.
4. Copie somente esse `.exe` para um pendrive.
5. Em cada computador escolar, dê duplo clique no instalador, avance pelas telas e conclua. Ele instala no perfil do estudante sem solicitar senha de administrador, cria atalhos no Menu Iniciar e na Área de Trabalho e pode abrir o jogo ao final.

Assim, nos 15 computadores a rotina é apenas **executar → avançar → concluir**. O instalador contém HTML, CSS, JavaScript, banco e runtime; não baixa nada da internet. Edge é aberto em modo aplicativo, sem barra de endereços. Se Edge não existir, o navegador padrão será usado.

### Opção 2 — versão portátil, sem instalação

Copie a pasta inteira para o computador ou pendrive e dê duplo clique em `Abrir Jogo.cmd`. Também é possível abrir `index.html` diretamente. Não é necessário Python nem servidor local para jogar.

### Servidor local opcional

`python iniciar.py` continua disponível apenas para desenvolvimento. Ele não é necessário no laboratório. Ao usá-lo, abra `http://127.0.0.1:8000`. Não instala pacotes nem acessa a internet.

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

Edite `banco/conteudo.json` com um editor de texto. JSON exige aspas duplas, vírgula entre itens e nenhuma vírgula depois do último item. Depois execute `python tools/gerar-banco-js.py`; isso atualiza `banco/conteudo.js`, a cópia automática usada para permitir duplo clique sem servidor. Nunca edite essa cópia manualmente.

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

Prefira copiar o instalador único gerado pelo Inno Setup; alternativamente, copie todo o diretório por pendrive ou rede local. Faça um teste com Wi-Fi desligado. O recorde fica no perfil do navegador (`LocalStorage`) e não acompanha a pasta ao ser copiada. Não use janela anônima e não limpe “dados do site” se quiser conservar recordes. A seed permite repetir o mesmo conteúdo em outra máquina; digite-a em **Desafio da Turma**.

## Escopo do MVP

Inclui movimento, salto, colisão, câmera, chunks infinitos, obstáculos, moedas, checkpoints, quatro categorias, problemas em duas etapas, combo, seed, recordes e resultado formativo. Áudio, touchscreen direcional e arte externa ficam preparados como expansões, sem bloquear a versão jogável.
