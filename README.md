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

Para uma descrição técnica completa e reutilizável — incluindo macroestrutura, fluxos, banco, editor, offline-first, instalador, riscos, ADRs e checklists — consulte [`infra.md`](infra.md).

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

## Ritmo da partida infinita

A partida começa com 80 segundos. Bolinhas azuis acrescentam 1,5 segundo e estrelas acrescentam 12 segundos, permitindo prolongar a corrida indefinidamente com boa exploração. O relógio principal pausa nas estações matemáticas. Cada etapa de pergunta possui uma janela visual de 30 segundos para calcular o bônus: respostas em até 10 segundos rendem 10 segundos, em até 20 rendem 8 e em até 30 rendem 6. Depois que a faixa rápida se esgota, uma resposta correta ainda rende 5 segundos. Cada alternativa errada escolhida retira 3 segundos, mas a questão permanece pausada para permitir uma nova tentativa.

A dificuldade motora cresce gradualmente: a variedade de chunks aumenta com a distância, e bichos patrulheiros aparecem e ficam mais rápidos conforme o tempo de partida. Um contato retira 3 segundos, reinicia o combo e concede 1,5 segundo de invulnerabilidade, evitando colisões repetidas injustas. Todos esses valores ficam em `js/config.js` para ajuste após testes com estudantes.

## Alunos, personagens e ranking local

Antes de cada partida, o estudante informa o primeiro nome e escolhe entre Lia, Theo e Bia. O HUD mostra simultaneamente a pontuação atual e a maior pontuação do modo. Ao final, pontos e distância entram no ranking local deste computador, acessível pelo menu e pela tela de resultado. Os dados permanecem somente no `LocalStorage`: não são enviados pela internet e podem ser apagados limpando os dados locais do navegador.

## Novos elementos de tempo

As bolinhas patrulham apenas pisos largos. Pular sobre uma delas concede 5 segundos; encostar lateralmente retira 3 segundos e ativa uma breve invulnerabilidade. Espinhos sempre aparecem em trios com largura total compatível com o salto. A partir do vigésimo segundo de corrida, um mago voador visita a tela a cada 45 segundos, permanece por 10 segundos e concede 30 segundos ao ser tocado. Quando restam 10 segundos, uma borda vermelha pulsante sinaliza urgência sem esconder o cenário ou as perguntas.

## Quedas, poderes e progressão visual

Cair em um buraco custa 20 segundos e devolve o personagem a uma posição segura da plataforma anterior. Se restarem menos de 21 segundos, a queda encerra a partida. Em intervalos determinísticos de 35 a 65 segundos pode surgir uma estrela de poder: ela fica disponível por 12 segundos e, quando coletada, deixa o personagem invulnerável e 45% mais rápido durante 10 segundos.

Cartas coringa aparecem sobre plataformas elevadas e difíceis. O estudante pode guardar somente uma; nas estações, o botão do coringa elimina exatamente duas alternativas erradas e consome a carta. A progressão reduz gradualmente a quantidade de bolinhas azuis de tempo, adiciona mais inimigos e libera o chunk `ABISMO`, com saltos maiores ainda dentro dos limites do personagem. O céu passa de claro para entardecer e finalmente noite conforme a dificuldade motora aumenta.

## Animações, perseguições e editor do professor

O personagem possui poses procedurais de corrida, salto e dano, além de aura durante a estrela de poder. A estrela explode visualmente as bolinhas inimigas próximas; antes de desaparecer, cada bolinha exibe uma expressão de surpresa. Se o estudante passar 45 segundos sem encontrar uma estação, um fantasma começa a persegui-lo e, ao tocar, abre obrigatoriamente um problema de dificuldade 3 com bônus de tempo reduzido. Mesmo uma resposta após o fim da faixa rápida sempre concede 5 segundos.

Em intervalos variáveis, um gigante atravessa a tela por aproximadamente 6 segundos. O aviso “PULE!” sinaliza a ação; um contato custa 12 segundos e concede invulnerabilidade breve para não repetir a punição.

Professores podem abrir **Configurações → Editor de questões** ou acessar `editor.html`. O editor altera, valida e salva questões no `LocalStorage`, permite duplicar questões e exportar/importar o banco completo em JSON. O jogo carrega automaticamente o banco editado. Isso não modifica `banco/conteudo.json`: para distribuir as mesmas edições em outros computadores, exporte o arquivo no editor e importe-o em cada máquina, ou altere o JSON-fonte e regenere `banco/conteudo.js`.

## Novos inimigos e evento do gigante

O gigante deixou de usar emoji e agora é um sprite original desenhado em Canvas, com corpo, rosto, coroa de espinhos, pernas animadas e aviso de salto. Sua próxima aparição é determinada pela seed em um intervalo variável de 45 a 85 segundos, evitando uma cadência previsível.

Em plataformas elevadas podem surgir atiradores. Quando o estudante se aproxima, eles lançam projéteis luminosos com trajetória levemente curva; cada acerto remove 2 segundos e concede uma curta invulnerabilidade. Em pisos largos também podem existir inimigos camuflados como arbustos. Eles se revelam quando o jogador chega a 180 pixels, executam um salto alto e depois voltam a se esconder. A estrela de poder protege contra projéteis, camuflados e o gigante.

## Retorno, atiradores e ambientação matemática

O estudante pode caminhar para trás, mas nunca além de 50% da maior distância já alcançada na tentativa. Isso permite recuperar itens e corrigir um salto sem incentivar longos retornos por chunks já concluídos.

Atiradores agora podem ser derrotados com um salto sobre a cabeça, usando a mesma leitura visual das bolinhas: o personagem rebate para cima, recebe 5 segundos e o inimigo mostra uma expressão de surpresa antes de desaparecer. Os disparos começam espaçados em 3,6 segundos e aceleram 0,35 segundo a cada 150 metros, respeitando o limite mínimo de 1,3 segundo. O fundo exibe `+`, `−`, `×` e `÷` em transparência e com parallax suave, preservando a legibilidade do cenário enquanto reforça o tema matemático.

## População progressiva, chifre e fada dos desejos

Para evitar partidas difíceis logo no começo, os primeiros 200 metros não recebem monstros procedurais. Entre 200 e 500 metros surgem somente as bolinhas básicas; atiradores e camuflados entram depois de 500 metros. A quantidade aumenta por faixas, com no máximo dois monstros básicos por piso largo.

O camuflado foi alinhado ao chão. Quando é derrotado por cima, seu chifre se desprende, gira durante a queda e permanece no piso como um pequeno trampolim. A estrela elimina bolinhas, atiradores, camuflados, monstros avançados, gigantes visíveis e projéteis na tela.

Depois de 1.000 metros aparece o **Monstro-Mola**, que salta periodicamente e exige sincronizar o pulo. Depois de 2.000 metros surge a **Sombra Veloz**, que faz investidas horizontais na direção do jogador. Ambos podem ser derrotados pulando por cima, mas possuem comportamentos e silhuetas diferentes.

A fada alterna suas visitas com o mago: mago aos 20 segundos, fada aos 65, novo mago aos 110 e assim por diante. Ao tocar na fada, a ação pausa e o estudante escolhe um único desejo: `+15s`, um coringa ou o poder da estrela. Como coringas não acumulam, essa opção fica desativada quando já existe uma carta no inventário.

## Frutas, visitantes e Guardião da Incógnita

O chunk `ALTURAS` cria uma escadaria segura até plataformas mais altas. Maçãs, laranjas, uvas e morangos podem surgir de forma determinística nessas plataformas; cada fruta vale 5 segundos e pontos especiais.

Mago e fada agora voam em uma faixa alcançável pelo salto, possuem área de coleta maior e começam devagar. A velocidade cresce moderadamente com a distância, com limite máximo para continuar possível alcançá-los. Eles alternam as visitas e permanecem disponíveis por 10 segundos.

Entre 1.500 e 2.000 metros aparece o **Bumerangueiro do Cálculo**, com máscara coral e corpo turquesa. Seu bumerangue possui duas fases visíveis: viaja para fora por 0,9 segundo e depois persegue o próprio lançador até retornar. A Sombra Veloz noturna continua surgindo depois dos 2.000 metros.

A cada 1.000 metros, o **Guardião da Incógnita** fecha uma arena que impede avançar ou voltar. É um monstro original do projeto — não utiliza personagem ou sprite de franquias comerciais — com carapaça verde, espinhos, barriga que muda de cor e uma interrogação. Ele encolhe a cada salto recebido e é derrotado exatamente no terceiro; a vitória libera a arena e concede 30 segundos. A estrela protege contra o contato, mas propositalmente não elimina o chefe.

## Congelante, morcego e aranhas

A fada utiliza o sprite `🧚` e mantém sua área de coleta ampliada. Depois dos 2.500 metros pode surgir o Congelante `🥶`: contato lateral paralisa movimento e salto por 3 segundos, mas um salto sobre sua cabeça o derrota normalmente. A estrela também o elimina.

A antiga forma da Sombra Veloz foi substituída pelo morcego `🦇`. Enquanto espera, ele sobe e desce; ao atacar, registra a posição atual do estudante e voa em linha reta para aquele ponto durante 1,45 segundo, sem corrigir a trajetória. Assim, o jogador pode observar o início da investida e pular para sair da linha de ataque.

Depois dos 3.000 metros, aranhas `🕷` descem e sobem em fios. A ponta inferior do fio acompanha a aranha, portanto o segmento encolhe visualmente durante a subida. É possível esperar a aranha subir e passar por baixo ou pular sobre ela quando estiver baixa. Aranhas também podem ser derrotadas e são afetadas pela estrela.

Até 10.000 metros, o equilíbrio anterior é preservado. A partir daí existe um nível extremo adicional a cada 1.000 metros: pisos largos recebem mais bolinhas, frutas e bolinhas de tempo ficam mais raras, Congelantes aceleram e o ciclo vertical das aranhas fica progressivamente mais rápido. Os limites existentes de projéteis, colisões e invulnerabilidade continuam ativos para evitar punições em sequência.

## Urgência e evolução dos chefes

A borda de urgência agora começa somente quando restam 10 segundos. Ela continua piscando sem cobrir o cenário, e é removida imediatamente ao receber tempo suficiente ou encerrar a partida.

Os dois primeiros Guardiões da Incógnita mantêm apenas patrulha e contato. A partir do chefe dos 3.000 metros, ele lança orbes matemáticos mirando a posição do estudante. O primeiro intervalo é deliberadamente lento, com 4,2 segundos entre disparos; nos chefes seguintes diminui 0,25 segundo por aparição até o limite seguro de 1,8 segundo. Cada orbe remove 4 segundos e respeita a invulnerabilidade da estrela.

Cada aparição usa uma das quatro paletas predefinidas — floresta, oceano, rubi e ametista — repetidas em ciclo. Corpo, rosto e espinhos mudam juntos, enquanto a barriga continua alternando cores durante a batalha. A estrela remove os orbes ativos, mas não causa dano direto ao chefe.

## Cinco cenários a cada 500 metros

O fundo muda automaticamente a cada 500 metros entre cinco cenários Canvas: **Floresta dos Números**, **Deserto das Operações**, **Montanhas da Lógica**, **Cidade das Expressões** e **Cosmos Matemático**. Cada cenário possui silhueta própria — árvores, dunas e sol, picos nevados, prédios com janelas ou estrelas e planeta com anel — além dos símbolos matemáticos transparentes.

Depois de completar os cinco cenários, o ciclo recomeça com outra variação de cores. Há três variações por cenário, totalizando 15 combinações visuais antes da repetição completa. As plataformas também recebem as cores de superfície e borda do cenário atual, sem alterar hitboxes, chunks ou a reprodução da seed.

## Camuflagem adaptativa

O inimigo camuflado acompanha o cenário atual em vez de usar sempre um arbusto verde. Na floresta ele assume forma de moita; no deserto, de rocha arredondada; nas montanhas, de pico irregular; na cidade, de caixa; e no cosmos, de cristal. A cor principal e a borda são herdadas da paleta atual da plataforma, incluindo as três variações cromáticas de cada cenário. Ao saltar, ele revela a aparência original para que o estudante identifique claramente o perigo.

### Novidades de progressão

- A partir de 1.000 m podem surgir plataformas móveis horizontais opcionais; após 3.000 m também aparecem versões verticais. Elas percorrem trechos mais amplos e rápidos, mas não exibem rótulos sobre a arte. A rota estática continua jogável e checkpoints nunca são gravados sobre plataformas móveis.
- O dragão 🐉 caminha lentamente na plataforma e dispara rajadas de três fogos lineares, com uma pausa clara entre rajadas. Cada fogo cresce, esmaece progressivamente e desaparece após 720 pixels. O morcego usa uma investida reta e retorna suavemente ao ponto de espera.
- Quando deixa o disfarce, o inimigo camuflado recebe uma de seis cores por meio do gerador determinístico da partida, mantendo a reprodução por seed.
- O mago segue o mesmo percurso previsível da fada, mas aparece raramente, em um intervalo determinístico entre 90 e 180 segundos.
- Cada Guardião da Incógnita derrotado deixa um ♻. É possível guardar até três trocas e consumir uma durante um desafio para receber outro problema, sem registrar erro na questão substituída.

## Trilha sonora offline por cenário

O projeto usa cinco arquivos **OGG Vorbis** locais em `assets/audio/soundtrack/` e troca a faixa junto com o cenário a cada 500 metros. Os nomes exatos estão no README da pasta; o volume inicial fica em `js/config.js`, na propriedade `audio.volumeTrilha`.

A migração de MIDI para OGG simplifica a arquitetura: Chrome, Edge e navegadores Chromium decodificam OGG nativamente pelo elemento `<audio>`. Não há parser MIDI, sintetizador por osciladores, snapshot base64 nem aumento artificial do JavaScript. A música conserva os timbres da conversão, reduz código próprio e facilita manutenção e testes.

A reprodução continua tolerante a falhas: arquivo ausente, OGG inválido ou bloqueio de autoplay não interrompe a partida nem mostra aviso técnico ao estudante. A música pausa e retoma junto com o jogo. O botão **CONTINUAR** mantém o caminho explícito de retomada que não é bloqueado pela proteção dos demais painéis.

Ao executar `criar-instalador.cmd`, as cinco faixas OGG são verificadas antes da compilação e incluídas explicitamente. Se qualquer faixa estiver ausente, a criação para com o nome do arquivo faltante. O script apaga o instalador antigo antes do build. Depois de adicionar ou substituir música, gere novamente o instalador.
