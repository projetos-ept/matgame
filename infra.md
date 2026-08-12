# Infraestrutura e macroarquitetura de um jogo educacional offline

> Documento técnico de referência baseado na arquitetura da **Aventura Matemática**. O objetivo não é apenas explicar este repositório: é registrar decisões, contratos, fluxos, riscos e procedimentos que possam servir como ponto de partida para novos jogos educacionais instaláveis e independentes de internet.

## 1. Visão executiva

A solução é uma aplicação web estática empacotável. HTML, CSS, JavaScript, conteúdo pedagógico, runtime, áudio e documentação vivem na mesma árvore de arquivos. Em produção, o navegador abre `index.html` por `file://`; durante desenvolvimento, um servidor HTTP local opcional pode servir a mesma árvore. Não existem backend, banco SQL, API externa, CDN, conta de usuário remota ou etapa de autenticação.

A macroarquitetura separa cinco responsabilidades:

```text
Apresentação (HTML/CSS/HUD/painéis)
                ↓
Orquestração (main + cenas)
                ↓
Motor do jogo (física, entidades, câmera, tempo)
                ↓
Domínios independentes
  ├─ geração procedural determinística
  ├─ conteúdo e avaliação matemática
  ├─ pontuação, estatísticas e persistência
  └─ áudio local tolerante a falhas
                ↓
Dados e distribuição
  ├─ banco JSON + snapshot JavaScript
  ├─ LocalStorage
  └─ instalador/launcher offline
```

A principal decisão arquitetural é tratar **offline** como restrição de projeto, não como modo alternativo. Uma funcionalidade só está pronta quando não depende de resolução DNS, certificado, servidor, login, fonte remota, biblioteca remota ou download posterior.

## 2. Objetivos arquiteturais

### 2.1 Requisitos funcionais cobertos pela infraestrutura

- iniciar por duplo clique;
- executar uma corrida infinita com física e geração procedural;
- reproduzir a mesma partida a partir de uma seed;
- interromper a ação para desafios matemáticos;
- persistir recordes, ranking e conteúdo editado localmente;
- editar o banco sem backend;
- distribuir por pasta portátil ou instalador Windows;
- atualizar o banco canônico sem quebrar `file://`;
- continuar funcionando se uma trilha estiver ausente ou não puder ser reproduzida;
- validar conteúdo, determinismo e manifesto do instalador antes da distribuição.

### 2.2 Atributos de qualidade prioritários

1. **Disponibilidade offline:** a ausência de internet não degrada o núcleo jogável.
2. **Determinismo:** a seed controla decisões relevantes para competição justa.
3. **Manutenibilidade:** regras e conteúdo ficam fora do loop principal quando possível.
4. **Portabilidade:** a mesma árvore funciona instalada, portátil e via HTTP local.
5. **Tolerância a falhas periféricas:** áudio e armazenamento podem falhar sem derrubar o jogo.
6. **Auditabilidade pedagógica:** perguntas, respostas e distratores são dados revisáveis.
7. **Implantação simples:** os computadores dos alunos não precisam de Python, Node ou Inno Setup.
8. **Acessibilidade operacional:** controles e desafios não exigem resposta durante movimento.

### 2.3 Restrições assumidas

- alvo principal: Windows com Edge/Chrome ou outro navegador Chromium;
- JavaScript executado diretamente no navegador, sem bundler;
- scripts carregados em ordem e compartilhando o namespace global `MatGame`;
- persistência associada à origem e ao perfil do navegador;
- trilhas OGG são direcionadas a Chrome, Edge e navegadores Chromium;
- o runtime `vendor/phaser.min.js` deste MVP é um adaptador mínimo compatível com o ponto de entrada utilizado, e não deve ser confundido com uma distribuição completa do Phaser 3;
- o instalador é compilado apenas em Windows com Inno Setup 6.

## 3. Mapa do repositório

```text
/
├─ index.html                       # shell do jogo e ordem dos scripts
├─ editor.html                      # shell independente da área do professor
├─ css/game.css                     # interface, HUD, alertas e editor
├─ js/
│  ├─ config.js                     # configuração central
│  ├─ main.js                       # composição da aplicação
│  ├─ editor.js                     # editor local do banco
│  ├─ game/
│  │  ├─ seed.js                    # PRNG determinístico
│  │  ├─ chunks.js                  # catálogo de blocos válidos
│  │  ├─ procedural.js              # escolha e progressão dos chunks
│  │  ├─ score.js                   # placar, estatísticas e LocalStorage
│  │  └─ soundtrack.js              # trilha por cenário
│  ├─ math/
│  │  └─ mathEngine.js              # seleção, embaralhamento e moeda
│  └─ scenes/
│     ├─ MenuScene.js
│     ├─ GameScene.js
│     ├─ ChallengeScene.js
│     └─ ResultScene.js
├─ banco/
│  ├─ conteudo.json                 # fonte canônica editável
│  └─ conteudo.js                   # snapshot gerado para file://
├─ assets/audio/soundtrack/         # arquivos locais e manifesto humano
├─ vendor/phaser.min.js             # runtime local
├─ tools/gerar-banco-js.py          # JSON → snapshot JS
├─ tests/validar.js                 # validação executável sem framework
├─ Abrir Jogo.cmd                   # launcher portátil
├─ criar-instalador.cmd             # pipeline de build Windows
├─ installer/AventuraMatematica.iss # manifesto Inno Setup
├─ iniciar.py                       # servidor local opcional
├─ README.md                        # operação do produto
├─ CREDITS.md                       # procedência e licenças
└─ infra.md                         # este documento arquitetural
```

### 3.1 Regra de dependência

As dependências devem apontar do shell para módulos especializados, nunca do conteúdo para a interface:

```text
index.html
  → config
  → game primitives (seed/chunks/procedural/score/soundtrack)
  → math engine
  → scenes
  → main

editor.html
  → banco/conteudo.js
  → editor.js
```

O banco não conhece o Canvas. O seletor de questões não conhece o HUD. O placar não conhece o texto da pergunta. Essa separação permite trocar a apresentação sem reescrever o conteúdo.

## 4. Inicialização e ciclo de vida

### 4.1 Bootstrap do jogo

`index.html` é um manifesto executável. A ordem dos `<script>` importa porque não existe import/export ou bundler:

1. runtime local;
2. snapshot do banco;
3. configuração;
4. primitivas do motor;
5. motor matemático;
6. cenas;
7. `main.js`.

Ao receber `DOMContentLoaded`, `main.js` cria o objeto `app`, que funciona como **composition root** e estado de sessão. Ele mantém referências para Canvas, painel, HUD, cena ativa, banco, geradores, seletor, placar, soundtrack e dados da partida.

O carregamento do banco segue fallback explícito:

```text
window.MatGameContent existe?
  ├─ sim → usar snapshot JS (compatível com file://)
  └─ não → fetch banco/conteudo.json (útil via HTTP)
                ↓
Há edição no LocalStorage?
  ├─ sim → substituir banco carregado pela edição local
  └─ não → manter banco canônico
```

A aplicação nunca deve tentar `fetch()` primeiro quando aberta por `file://`, pois políticas de origem de navegadores podem bloquear a leitura do JSON local.

### 4.2 Estado de sessão

O objeto `app` contém estado transitório:

- `seed`, `modo`, `aluno`, `personagem`;
- `distancia`, `tempoRestante`, `tempoDecorrido`;
- inventário (`coringa`, `reciclagens`);
- `placar`, `gerador`, `powerRng`, `seletor`;
- `cena`, `pausado`, `debug`;
- referências DOM;
- controlador de soundtrack.

Ao iniciar uma partida, esse estado é recriado. Ao parar, listeners da cena são removidos, áudio é encerrado, HUD e alertas são ocultados. Essa simetria entre `iniciar()` e `parar()` evita loops, teclas e áudio duplicados após reinícios.

### 4.3 Loop principal

`GameScene` usa `requestAnimationFrame`. Cada quadro:

1. calcula `delta` limitado para evitar saltos físicos após travamentos;
2. atualiza o mundo se não estiver pausado;
3. desenha o estado atual;
4. agenda o próximo quadro.

A atualização é responsável por relógio, entrada, física, colisões, entidades, dificuldade, câmera, desafios e HUD. O desenho usa Canvas 2D e não altera regras de domínio.

### 4.4 Pausa e transições

As cenas são objetos/classes simples, não rotas de SPA:

- `MenuScene`: entrada, identificação, seed, ranking e configurações;
- `GameScene`: mundo contínuo e renderização;
- `ChallengeScene`: modal matemático com jogo pausado;
- `ResultScene`: consolidação e navegação pós-partida.

Ao abrir questão, `app.pausado = true`; o personagem não continua correndo durante leitura. Ao finalizar, a cena do jogo é retomada. Ao exibir resultado, a cena é destruída antes de salvar e renderizar o resumo.

## 5. Motor de jogo

### 5.1 Coordenadas e representação

O Canvas lógico mede 1280×720. CSS adapta sua exibição, mas a simulação continua no espaço lógico. Entidades usam retângulos simples:

```js
{ x, y, w, h, vx, vy, ...estadoEspecifico }
```

Colisão AABB centralizada em uma função reduz divergências. Plataformas têm coordenadas mundiais; a renderização subtrai `camera` do eixo X.

### 5.2 Física

A configuração central define gravidade, velocidade e impulso de salto. O loop aplica:

```text
entrada → velocidade horizontal
gravidade × delta → velocidade vertical
velocidade × delta → posição
posição anterior + atual → resolução de plataforma
```

Usar a posição vertical anterior evita atravessar plataformas ao cair. Pontos de retorno só são gravados em plataformas estáticas; isso impede renascimento no vazio depois que uma plataforma móvel saiu do local.

### 5.3 Geração por chunks

`chunks.js` declara blocos previamente jogáveis. Cada chunk contém:

- `id` estável;
- `dificuldade` mínima;
- `largura` constante;
- `pontoEntrada` e `pontoSaida` compatíveis;
- `peso` para seleção ponderada;
- `permiteDesafio`;
- `pontuacaoMaxima`;
- plataformas e, opcionalmente, obstáculos, estação ou checkpoint.

`procedural.js` filtra chunks pela dificuldade, impõe intervalo mínimo entre estações, expande os pesos em uma urna e usa o PRNG da seed. O cenário não é uma nuvem de coordenadas aleatórias: a aleatoriedade escolhe entre estruturas já validadas.

### 5.4 Janela infinita

A cena mantém `fimGerado` e gera à frente da câmera. Novas entidades recebem coordenadas absolutas calculadas como `baseDoChunk + posiçãoLocal`. Para projetos maiores, recomenda-se também descarregar entidades muito atrás da câmera; no MVP, arrays simples favorecem legibilidade, mas podem crescer em sessões excepcionalmente longas.

### 5.5 Progressão de dificuldade

Existem eixos independentes:

- dificuldade matemática, derivada do índice do chunk;
- dificuldade motora, que considera distância e tempo;
- liberação de inimigos por marcos de metros;
- modo extremo após distância configurada;
- redução limitada de recursos e intervalos de ataque.

Nunca aumente todas as dimensões simultaneamente. Cada mecânica deve ter marco de entrada, teto e teste de equilíbrio.

### 5.6 Entidades como máquinas de estado

Inimigos complexos devem ser modelados por estados explícitos. Exemplo conceitual:

```text
morcego: espera → ataque → retorno → espera
dragão: aproximação → rajada(3) → espera → rajada
camuflado: disfarçado → revelado/salto → cooldown → disfarçado
chefe: arena ativa → 3 impactos → recompensa/liberação
```

Máquinas de estado são mais previsíveis do que condicionais baseadas apenas em posição. Elas melhoram telemetria, animação, testes e balanceamento.

### 5.7 Renderização

O MVP desenha personagens, plataformas, fundos e efeitos em Canvas/emoji. Essa decisão elimina pipeline obrigatório de sprites e mantém fallback offline. A renderização está separada da colisão: mudar desenho não deve mudar hitbox inadvertidamente.

Cinco temas visuais mudam a cada 500 metros, cada um com variantes cromáticas. Símbolos matemáticos transparentes reforçam identidade sem competir com obstáculos.

## 6. Determinismo e seeds

### 6.1 PRNG

`seed.js` transforma texto em estado inteiro por hash e produz uma sequência pseudoaleatória reprodutível. A API expõe:

- `proximo()` para `[0,1)`;
- `inteiro(min,max)`;
- `escolher(lista)`;
- `embaralhar(lista)`.

Decisões reproduzíveis nunca devem chamar `Math.random()`.

### 6.2 Streams independentes

O projeto deriva streams separados:

```text
seed da partida
  ├─ Gerador(seed)             → chunks
  ├─ Seed(seed + "-questoes") → perguntas/alternativas
  └─ Seed(seed + "-poderes")  → eventos, cores e recursos
```

Separar streams é essencial. Se uma animação consumir um número aleatório no stream de chunks, toda a fase futura mudaria. Novos subsistemas devem receber uma seed derivada própria quando sua evolução não puder afetar os demais.

### 6.3 Limites do determinismo

A seed reproduz decisões lógicas, não necessariamente cada pixel temporal. `requestAnimationFrame`, tempo de resposta humana e desempenho do computador variam. Para competição, compare a sequência de chunks, questões e recursos relevantes; não presuma replay frame a frame.

## 7. Domínio matemático e banco de conteúdo

### 7.1 Fonte canônica

`banco/conteudo.json` é a fonte autoral. Ele contém:

- `produtos` com preços em centavos;
- `tabuadas`;
- `expressoes`;
- `dinheiro`;
- `problemas` interpretativos.

Questões possuem ID, categoria, dificuldade, texto, resposta e alternativas. Problemas interpretativos incluem expressão correta e alternativas de interpretação.

### 7.2 Contratos mínimos

Para toda questão:

- ID globalmente único;
- resposta exatamente presente em `alternativas`;
- alternativas sem duplicação;
- dificuldade dentro da escala adotada;
- valores monetários inteiros em centavos;
- texto natural e revisado;
- distratores plausíveis, não ruído aleatório.

Para problemas:

- `expressao` resolve o enunciado;
- `alternativasExpressao` contém a expressão correta;
- resposta numérica corresponde à expressão;
- pontos de interpretação e cálculo podem ser contabilizados separadamente.

### 7.3 Dinheiro sem ponto flutuante

Valores financeiros são armazenados em centavos:

```text
R$ 13,75 → 1375
3 unidades → 1375 × 3 = 4125
exibição → R$ 41,25
```

Isso evita erros binários de `13.75 * 3`. Formatação só ocorre na borda de apresentação.

### 7.4 Seleção de questões

`mathEngine.js`:

1. escolhe categoria por pesos configuráveis;
2. filtra dificuldade compatível;
3. remove IDs recentes;
4. seleciona via PRNG;
5. clona o item para não alterar o banco;
6. embaralha alternativas;
7. formata dinheiro para exibição.

O histórico curto evita repetição imediata sem impedir reciclagem futura em sessões longas.

### 7.5 Desafio em duas etapas

Problemas podem avaliar duas competências:

1. identificar a expressão que modela o texto;
2. executar o cálculo.

`ChallengeScene` registra estatísticas separadas, pausa o jogo, mantém tentativas e oferece bônus de tempo. Um erro custa tempo, mas não fecha a questão. Coringa remove duas erradas; o item ♻ substitui um problema antes de contabilizar resposta.

### 7.6 Snapshot JavaScript para `file://`

Navegadores frequentemente restringem `fetch()` de arquivo local. Por isso existe:

```text
banco/conteudo.json --gerar-banco-js.py--> banco/conteudo.js
```

O snapshot atribui o mesmo objeto a `window.MatGameContent`. Regras:

- editar apenas o JSON;
- executar o gerador após qualquer alteração;
- versionar JSON e JS juntos;
- testar igualdade estrutural;
- falhar o build se estiverem dessincronizados.

Essa duplicação é deliberada: o JSON favorece autoria e interoperabilidade; o JS favorece execução local sem servidor.

## 8. Editor local do professor

### 8.1 Arquitetura

O editor é uma segunda aplicação estática. `editor.html` carrega o snapshot e `js/editor.js`, sem inicializar o jogo. Ele trabalha sobre uma cópia completa do banco.

Fluxo de leitura:

```text
LocalStorage possui banco editado?
  ├─ sim → carregar edição
  └─ não → clonar window.MatGameContent
```

Fluxo de gravação:

```text
textarea JSON → parse → validação → substituição no banco em memória
              → JSON.stringify → LocalStorage
```

### 8.2 Chave de persistência

A chave é versionada: `aventura-matematica-banco-editor-v1`. Versionar a chave permite migrações futuras sem interpretar formatos incompatíveis como atuais.

### 8.3 Recursos

- seleção por categoria e ID;
- edição direta do objeto JSON;
- validação de ID, alternativas e resposta;
- validação adicional de expressão em problemas;
- duplicação para novo ID;
- salvamento por computador;
- exportação do banco completo;
- importação de JSON;
- restauração do snapshot original.

### 8.4 Limite importante

Salvar no editor **não altera arquivos no disco**. Navegadores não podem sobrescrever silenciosamente `banco/conteudo.json`. A edição fica no LocalStorage da origem atual.

Para distribuir o mesmo banco:

- caminho operacional: exportar e importar em cada computador;
- caminho de release: incorporar alterações em `conteudo.json`, regenerar `conteudo.js`, validar, commitar e reconstruir o instalador.

### 8.5 Melhorias recomendadas para novos projetos

- schema JSON formal;
- migração de versões;
- validação de todas as questões na importação, não só categorias;
- preview da questão renderizada;
- desfazer/refazer;
- identificação do autor e data de revisão;
- workflow de aprovação antes de incorporar ao banco canônico.

## 9. Pontuação, estatísticas e persistência

### 9.1 Placar

`Placar` mantém:

- pontos conquistados;
- máximo possível acumulado;
- combo atual e máximo;
- pares `[acertos, tentativas]` por categoria e competência.

Registrar máximo mesmo no erro permite calcular aproveitamento do trecho efetivamente encontrado, adequado ao modo infinito.

### 9.2 LocalStorage

Chaves atuais:

| Chave | Conteúdo |
|---|---|
| `aventura-matematica-recordes-v1` | recordes separados por modo |
| `aventura-matematica-ranking-v1` | até 50 melhores resultados locais |
| `aventura-matematica-banco-editor-v1` | banco editado pelo professor |
| `aventura-matematica-ultimo-aluno` | conveniência do formulário |

Acesso é envolvido em `try/catch` onde falha é aceitável. Navegação anônima, políticas institucionais ou quota podem tornar armazenamento indisponível.

### 9.3 Privacidade

Os dados não saem da máquina. Ainda assim, nomes de estudantes são dados pessoais locais. Para novos projetos:

- prefira primeiro nome, apelido ou código;
- documente onde apagar;
- limite retenção;
- não trate ranking local como sistema oficial de notas;
- não introduza sincronização remota sem análise de privacidade e autorização.

### 9.4 Origem e portabilidade

LocalStorage é isolado por origem. `file://`, `http://127.0.0.1:8000` e diferentes navegadores podem enxergar armazenamentos distintos. Escolha um método de execução consistente no laboratório.

## 10. Soundtrack offline

### 10.1 Decisão de formato

As trilhas usam **OGG Vorbis**, formato decodificado nativamente pelos navegadores Chromium de destino. Cada cenário aponta para um arquivo local e o índice da música deriva da mesma faixa de 500 metros usada pela ambientação visual.

A escolha por áudio pré-renderizado é intencional. Comparado ao MIDI, OGG:

- preserva os timbres definidos na conversão;
- dispensa parser de Standard MIDI Files;
- dispensa sintetizador Web Audio e gerenciamento de osciladores;
- não precisa incorporar binários em base64 dentro de JavaScript;
- reduz código próprio, superfície de bugs e tempo de build;
- oferece comportamento previsível no Edge e Chrome.

O custo é um arquivo maior que MIDI. Para um jogo instalado localmente, esse custo é aceitável e pode ser controlado com Vorbis entre 128 e 192 kbit/s.

### 10.2 Contrato do controlador

`js/game/soundtrack.js` mantém a lista ordenada de caminhos `.ogg`. O controlador cria um elemento `Audio`, configura loop, volume e preload, troca de faixa por cenário e acompanha o ciclo de pausa, retomada e encerramento da partida.

Uma rejeição de `play()` por política de autoplay não marca o arquivo como defeituoso: uma interação posterior pode tentar reproduzi-lo novamente. O evento `error`, por outro lado, marca a faixa como indisponível para evitar tentativas repetidas.

### 10.3 Falha silenciosa

Áudio é periférico. Arquivo ausente, corrompido ou bloqueado não pode impedir a matemática e o platformer. A política continua sendo **silent degradation**: a partida segue sem música e sem modal técnico para o estudante.

### 10.4 Pipeline e licenciamento

Não existe mais `banco/soundtrack.js` nem `tools/gerar-soundtrack-js.py`. O build verifica os cinco OGG e o Inno Setup os inclui explicitamente. Isso torna os arquivos auditáveis no manifesto sem duplicar dados em JavaScript.

A conversão de MIDI para OGG não cria direito de redistribuição. Origem, autorização e licença precisam permanecer registradas em `CREDITS.md`.

## 11. Modelo offline-first

### 11.1 Matriz de execução

| Forma | Dependência no computador do aluno | Uso |
|---|---|---|
| `index.html` | navegador | teste rápido/portátil |
| `Abrir Jogo.cmd` | navegador; Edge preferido | operação portátil Windows |
| instalador `.exe` | nenhuma ferramenta de desenvolvimento | implantação recomendada |
| `python iniciar.py` | Python | desenvolvimento e diagnóstico |

### 11.2 Launcher portátil

`Abrir Jogo.cmd` resolve o caminho absoluto do `index.html`, procura Edge em instalações 32/64 bits e abre `--app=file:///...`. Se Edge não existir, usa o navegador padrão.

O launcher deve permanecer relativo à própria pasta (`%~dp0`) para sobreviver a pendrive, instalação e caminhos com espaços.

### 11.3 Auditoria de rede

Uma release offline deve verificar:

- nenhum `http://` ou `https://` em HTML/CSS/JS de runtime;
- nenhuma CDN;
- nenhuma fonte remota;
- nenhum service worker que espere primeira visita online;
- bibliotecas e assets presentes localmente;
- banco disponível pelo snapshot JS;
- execução com Wi-Fi desligado.

Links de documentação podem existir no README, mas não podem ser necessários em runtime.

## 12. Pipeline do banco

### 12.1 Processo de autoria

```text
editar banco/conteudo.json
        ↓
python tools/gerar-banco-js.py
        ↓
node tests/validar.js
        ↓
revisão humana pedagógica
        ↓
git commit (JSON + JS juntos)
```

### 12.2 Por que o gerador é simples

O script Python usa apenas biblioteca padrão. Isso reduz dependências de build e facilita execução em computadores de preparação. Ele resolve caminhos a partir do próprio arquivo, serializa UTF-8 sem escapar acentos e grava um cabeçalho para impedir edição manual.

### 12.3 Integridade

O teste carrega `conteudo.js` em sandbox e compara sua estrutura com o JSON. Essa verificação detecta o erro operacional mais comum: editar o JSON e esquecer de regenerar o snapshot.

## 13. Montagem do instalador Windows

### 13.1 Separação build/runtime

Ferramentas necessárias apenas no computador de preparação:

- Python para gerar snapshot;
- Node para testes recomendados;
- Inno Setup 6 para compilar.

Computadores dos alunos recebem somente arquivos do jogo e atalhos.

### 13.2 Pipeline executado por `criar-instalador.cmd`

```text
1. localizar ISCC.exe
2. verificar as cinco trilhas obrigatórias
3. apagar instalador anterior
4. regenerar banco/conteudo.js
5. invocar Inno Setup
6. verificar se o .exe novo existe
7. informar caminho de saída
```

Apagar a saída anterior evita falso positivo: sem isso, uma compilação que falhou poderia deixar um `.exe` antigo parecendo novo.

### 13.3 Manifesto Inno Setup

O `.iss` define:

- identidade e versão;
- instalação em `{localappdata}`;
- `PrivilegesRequired=lowest`, evitando administrador;
- compressão e arquitetura;
- cópia recursiva do projeto;
- exclusões de `.git`, output e arquivos de controle;
- inclusão explícita dos cinco OGG;
- atalhos no Menu Iniciar e Área de Trabalho;
- opção de abrir após instalar.

Os OGG são excluídos do wildcard geral e adicionados individualmente. Isso transforma seus nomes em contrato de build e impede omissão silenciosa.

### 13.4 Conteúdo esperado do instalador

```text
{app}/
├─ index.html
├─ editor.html
├─ css/
├─ js/
├─ banco/
├─ vendor/
├─ assets/audio/soundtrack/*.ogg
├─ Abrir Jogo.cmd
├─ README.md
└─ CREDITS.md
```

Arquivos de desenvolvimento podem ser excluídos em uma evolução futura para reduzir tamanho, desde que editor, banco, runtime e licenças permaneçam.

### 13.5 Procedimento de release

1. atualizar branch local que contém código e binários;
2. conferir nomes exatos e tamanho não zero dos assets;
3. regenerar banco;
4. rodar testes;
5. incrementar `MyAppVersion`;
6. executar `criar-instalador.cmd`;
7. instalar em uma máquina limpa ou VM;
8. conferir a pasta instalada, inclusive OGG;
9. desligar rede;
10. jogar, abrir editor, salvar recorde e reiniciar;
11. calcular hash do instalador e arquivar junto à versão.

### 13.6 Atualização

O `AppId` estável permite atualização sobre a instalação anterior. O instalador não migra LocalStorage diretamente, porque os dados pertencem ao navegador. Mudar URL, launcher, navegador ou origem pode produzir um armazenamento diferente; teste esse efeito antes de uma implantação.

## 14. Testes e validações

### 14.1 Filosofia

`tests/validar.js` é um executável Node sem framework. Ele carrega módulos puros com `vm`, fornece um LocalStorage falso e valida dados e invariantes. Isso torna o teste portátil e rápido.

### 14.2 Cobertura atual por categoria

- sincronização JSON/JS;
- determinismo da seed;
- mínimos de conteúdo;
- resposta presente e alternativas únicas;
- prioridade de operações;
- expressões de problemas;
- centavos inteiros e totais monetários;
- compatibilidade de chunks;
- intervalos e limites de dificuldade;
- regras de inimigos, tempo e chefes;
- persistência e ranking;
- ausência de repetição imediata;
- editor offline;
- soundtrack local e falha silenciosa;
- manifesto dos OGG no instalador;
- ausência de URLs externas nos artefatos verificados.

### 14.3 Pirâmide recomendada para evolução

1. **validação de dados:** schema, matemática e licenças;
2. **testes unitários:** PRNG, seletor, placar, máquinas de estado;
3. **testes de integração DOM:** menu, editor, desafio, LocalStorage;
4. **testes de jogo headless:** movimento, colisão e troca de cena;
5. **smoke instalado:** Windows limpo, offline, atalhos e persistência;
6. **playtest pedagógico:** clareza, diversão, carga cognitiva e equilíbrio.

Validações que buscam strings no código são úteis como proteção barata, mas não substituem testes comportamentais.

### 14.4 Comandos de qualidade

```bash
python tools/gerar-banco-js.py
python -m json.tool banco/conteudo.json >/dev/null
node tests/validar.js
node --check js/main.js
node --check js/scenes/GameScene.js
git diff --check
```

Smoke HTTP opcional:

```bash
python iniciar.py
# em outro terminal
curl -f http://127.0.0.1:8000/index.html
```

## 15. Configuração e governança de regras

`js/config.js` é a fonte central de constantes de gameplay:

- dimensões e física;
- marcos de progressão;
- intervalos de entidades;
- custos e bônus de tempo;
- pontuação;
- pesos de categorias;
- volume.

Evite números mágicos no loop. Uma nova regra deve:

1. ganhar nome semântico na configuração;
2. ser documentada;
3. ter limite mínimo/máximo;
4. receber teste;
5. ser avaliada em playtest.

Configuração central não significa permitir qualquer combinação. Testes devem bloquear valores que tornam saltos impossíveis, perguntas punitivas ou ataques contínuos.

## 16. Segurança, robustez e acessibilidade

### 16.1 Segurança de conteúdo

O banco local é confiável no modelo atual, mas textos são inseridos em `innerHTML` em alguns painéis. Se conteúdo passar a vir de terceiros, faça sanitização ou construa DOM com `textContent`. Importação no editor deve ser tratada como entrada não confiável.

### 16.2 Tratamento de falhas

Falhas críticas e periféricas têm políticas diferentes:

- banco ausente: mostrar erro operacional, pois jogo não pode funcionar;
- áudio ausente: continuar silenciosamente;
- LocalStorage indisponível: continuar sem persistir;
- Inno Setup ausente: interromper build com instrução;
- OGG ausente no build: interromper build e nomear arquivo;
- resposta inválida no editor: não persistir e explicar.

### 16.3 Acessibilidade

- Canvas possui rótulo;
- feedbacks usam `role=status`/`aria-live`;
- urgência usa texto, ícone, animação e cor;
- perguntas pausam o mundo;
- botões são grandes e navegáveis;
- informação não depende apenas de cor;
- fonte do sistema evita download e melhora disponibilidade.

Para evolução: adicionar modo sem animação, remapeamento de teclas, volume/mudo, alto contraste e controles touchscreen.

## 17. Observabilidade e debug offline

Sem backend, diagnóstico deve ser local:

- seed exibida no HUD e resultado;
- modo debug mostra chunk, dificuldade e questão;
- erros de build são impressos pelo `.cmd`;
- testes produzem uma linha por invariante;
- nomes de arquivo explícitos facilitam auditoria.

Evite enviar telemetria sem consentimento. Para pesquisa pedagógica, prefira exportação manual anonimizada.

## 18. Riscos técnicos e mitigação

| Risco | Impacto | Mitigação atual/recomendada |
|---|---|---|
| `file://` bloquear JSON | jogo não inicia | snapshot `conteudo.js` |
| JSON e JS divergirem | conteúdo diferente por modo | gerador + teste estrutural |
| OGG ausente ou inválido | jogo silencioso | falha silenciosa + preflight do instalador |
| asset faltar no instalador | trilha ausente | preflight + entradas explícitas |
| `.exe` antigo permanecer | distribuição errada | apagar antes do build |
| LocalStorage ser limpo | perda de ranking/editor | exportação; documentação |
| origem mudar | dados parecem sumir | launcher consistente |
| arrays infinitos crescerem | memória em runs longas | futura poda/pooling |
| `GameScene` crescer demais | manutenção difícil | extrair sistemas de entidades/renderização |
| globals dependerem de ordem | erro de bootstrap | manifesto claro; futura adoção de módulos |
| conteúdo importado malicioso | injeção de HTML | schema + sanitização |
| licença de trilhas | impedimento de distribuição | CREDITS + auditoria pré-release |
| seed acoplada a consumo de RNG | partidas mudam após feature | streams derivados independentes |

## 19. Dívida técnica conhecida

Este MVP privilegia execução simples e legibilidade, portanto há débitos conscientes:

- `GameScene.js` concentra muitos sistemas e deve ser decomposto em física, entidades, renderização, eventos e mundo;
- scripts globais dependem da ordem de carregamento;
- o adaptador Phaser é mínimo, não o runtime completo solicitado para uma produção Phaser convencional;
- testes de cena são parcialmente baseados em inspeção de código;
- não há pipeline automatizado que compile o `.exe` em CI Windows;
- não há descarte sistemático de entidades antigas;
- o editor valida apenas parte do schema;
- o loop e volume das conversões OGG exigem revisão auditiva;
- CSS e HTML estão compactados, reduzindo diffs e manutenção.

Registrar dívida é parte da infraestrutura: evita que uma decisão de MVP seja interpretada como padrão definitivo.

## 20. Blueprint para novos projetos

### Fase 1 — fundação offline

- criar shell HTML/CSS local;
- fixar política sem CDN;
- definir namespace/módulos;
- criar configuração central;
- provar execução por `file://`;
- criar launcher e teste sem rede.

### Fase 2 — domínio reproduzível

- implementar PRNG textual;
- separar streams por subsistema;
- modelar chunks válidos;
- criar teste de mesma seed;
- documentar o que é e não é determinístico.

### Fase 3 — conteúdo como dado

- definir schema;
- criar banco canônico;
- implementar seletor e distratores;
- criar snapshot para `file://`;
- validar matemática automaticamente;
- instituir revisão humana.

### Fase 4 — persistência e editor

- versionar chaves de LocalStorage;
- criar exportação/importação;
- documentar origem;
- adicionar restauração;
- planejar migrações.

### Fase 5 — distribuição

- criar launcher relativo;
- criar manifesto de instalador;
- validar assets obrigatórios;
- remover saída anterior;
- versionar build;
- testar instalação limpa offline.

### Fase 6 — endurecimento

- testes comportamentais;
- sanitização;
- auditoria de licenças;
- profiling de runs longas;
- acessibilidade;
- playtest com estudantes e professores.

## 21. Checklists reutilizáveis

### 21.1 Nova questão

- [ ] ID único;
- [ ] texto natural;
- [ ] resposta correta;
- [ ] resposta nas alternativas;
- [ ] nenhuma duplicata;
- [ ] distratores plausíveis;
- [ ] dificuldade revisada;
- [ ] centavos inteiros quando aplicável;
- [ ] JSON regenerado para JS;
- [ ] testes passando.

### 21.2 Nova mecânica procedural

- [ ] usa PRNG correto, não `Math.random()`;
- [ ] não altera stream de outro domínio;
- [ ] possui marco de entrada;
- [ ] possui teto de dificuldade;
- [ ] não bloqueia rota obrigatória;
- [ ] respeita pausa e invulnerabilidade;
- [ ] tem fallback visual;
- [ ] é documentada e testada.

### 21.3 Novo asset

- [ ] arquivo local;
- [ ] nome/case estável;
- [ ] licença registrada;
- [ ] caminho relativo;
- [ ] fallback para ausência;
- [ ] incluído no instalador;
- [ ] testado offline;
- [ ] tamanho aceitável.

### 21.4 Release do instalador

- [ ] branch sincronizada;
- [ ] árvore limpa;
- [ ] banco regenerado;
- [ ] testes verdes;
- [ ] versão incrementada;
- [ ] assets obrigatórios presentes;
- [ ] `.exe` antigo removido;
- [ ] build concluído;
- [ ] conteúdo instalado conferido;
- [ ] smoke sem internet;
- [ ] editor e LocalStorage testados;
- [ ] hash e release arquivados.

## 22. Decisões arquiteturais resumidas

### ADR-001 — aplicação estática como unidade de implantação

**Decisão:** usar HTML/CSS/JS e arquivos locais, sem backend.
**Motivo:** implantação escolar offline e manutenção simples.
**Consequência:** persistência é local e não há sincronização central.

### ADR-002 — banco duplo JSON + JS gerado

**Decisão:** JSON canônico e snapshot global gerado.
**Motivo:** autoria estruturada e compatibilidade `file://`.
**Consequência:** build precisa garantir sincronização.

### ADR-003 — geração por chunks e seed

**Decisão:** selecionar blocos válidos com PRNG determinístico.
**Motivo:** rejogabilidade sem plataformas impossíveis e competição justa.
**Consequência:** alterações no catálogo podem mudar sequências de versões futuras.

### ADR-004 — LocalStorage para dados locais

**Decisão:** recordes, ranking e editor ficam no navegador.
**Motivo:** zero infraestrutura e privacidade local.
**Consequência:** dados dependem de origem/perfil e exigem exportação para transporte.

### ADR-005 — falha silenciosa de áudio

**Decisão:** soundtrack nunca bloqueia gameplay.
**Motivo:** suporte e presença dos codecs variam.
**Consequência:** instalação pode funcionar sem música sem alertar o aluno.

### ADR-006 — assets críticos explícitos no instalador

**Decisão:** OGG listado individualmente e validado antes do build.
**Motivo:** evitar omissão por wildcard ou branch incompleta.
**Consequência:** adicionar faixa exige atualizar manifesto e teste.

### ADR-007 — ferramentas de build fora do laboratório

**Decisão:** Python, Node e Inno Setup são necessários apenas na preparação.
**Motivo:** instalação em poucos cliques em muitos computadores.
**Consequência:** manter scripts e documentação reproduzíveis é obrigatório.

## 23. Critério de prontidão de infraestrutura

Um projeto derivado desta arquitetura pode ser considerado pronto para piloto quando:

1. uma pasta limpa abre sem internet;
2. uma seed reproduz conteúdo relevante em duas máquinas;
3. o banco canônico e o snapshot são idênticos;
4. perguntas inválidas falham no teste antes do release;
5. fechar e abrir preserva recordes no mesmo método de execução;
6. o editor exporta, importa e restaura;
7. a ausência de áudio não quebra o jogo;
8. o instalador contém todos os assets obrigatórios;
9. o `.exe` instala sem privilégio administrativo;
10. uma máquina limpa executa os fluxos menu → jogo → questão → resultado;
11. licenças estão documentadas;
12. professores conseguem alterar conteúdo seguindo apenas a documentação.

## 24. Conclusão

A infraestrutura da Aventura Matemática combina tecnologias simples com contratos rigorosos: arquivos estáticos para disponibilidade, seeds para justiça, chunks para jogabilidade, banco estruturado para revisão pedagógica, snapshot JS para `file://`, LocalStorage para autonomia, editor local para professores e instalador validado para implantação em massa.

O princípio reutilizável é: **reduzir dependências operacionais sem abrir mão de fronteiras arquiteturais**. Um projeto offline não precisa ser monolítico; um jogo pequeno não precisa espalhar conteúdo pelo motor; um editor local não precisa de servidor; e um instalador simples ainda pode possuir preflight, manifesto explícito, versionamento e testes.
