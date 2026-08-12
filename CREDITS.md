# Créditos e licenças

## Código

- Código do jogo e adaptador local de runtime: criado especificamente para este projeto.
- O arquivo `vendor/phaser.min.js` é um adaptador mínimo e independente que oferece o ponto de inicialização `Phaser.Game` usado pelo MVP. Ele **não contém código copiado da distribuição oficial do Phaser**. Antes de adotar APIs adicionais do Phaser em produção, substitua-o por uma distribuição oficial local do Phaser 3, disponível sob licença MIT, e preserve o aviso de licença correspondente.

## Arte, fontes e áudio

Não há assets de terceiros incluídos no repositório. Personagem, cenário, moedas e interface são formas Canvas/CSS originais. A fonte é a fonte de sistema do computador. O controlador de áudio aceita trilhas opcionais adicionadas separadamente pelo responsável pela instalação.

## Empacotamento opcional para Windows

O projeto de instalador em `installer/AventuraMatematica.iss` pode ser compilado com Inno Setup 6, software de distribuição livre. O compilador não é incluído no jogo e só é necessário no computador que gera o instalador. Consulte a licença oficial do Inno Setup antes da redistribuição do instalador compilado.

## Trilhas opcionais fornecidas pelo responsável pela instalação

O código possui referências opcionais para cinco arquivos OGG em `assets/audio/soundtrack/`. Os arquivos de música convertidos **não são distribuídos neste repositório** e nenhuma licença sobre eles é concedida pelo projeto. A pessoa que os adicionar ao instalador é responsável por confirmar os direitos de uso e redistribuição. A origem e os nomes informados estão documentados no README da pasta de trilhas.

Os arquivos futuros de design de som em `assets/audio/effects/` também são opcionais e não estão incluídos. Cada efeito adicionado deve ter origem, autoria e licença registradas antes da distribuição.
