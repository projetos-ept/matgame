window.addEventListener('DOMContentLoaded',async()=>{const app={canvas:document.querySelector('#game'),panel:document.querySelector('#panel'),hud:document.querySelector('#hud'),pause:document.querySelector('#pause'),debug:false,pausado:false,cena:null,
 parar(){if(this.cena)this.cena.destruir();this.cena=null;this.hud.classList.add('hidden');this.pause.classList.add('hidden');},
 iniciar(seed,modo){this.parar();this.seed=String(seed);this.modo=modo;this.distancia=0;this.placar=new MatGame.Placar();this.gerador=new MatGame.Gerador(this.seed);this.seletor=new MatGame.SeletorQuestoes(this.banco,new MatGame.Seed(this.seed+'-questoes'));this.panel.classList.add('hidden');this.hud.classList.remove('hidden');this.pause.classList.remove('hidden');this.cena=new MatGame.GameScene(this);this.cena.iniciar();},
 atualizarHud(){const rec=MatGame.Recordes.ler()[this.modo]?.pontos||0;this.hud.innerHTML=`<span class="pill">⭐ ${this.placar.pontos}</span><span class="pill">🏆 ${rec}</span><span class="pill">🔥 ×${this.placar.combo}</span><span class="pill">📏 ${this.distancia} m</span><span class="pill">SEED ${this.seed}</span>`;},
 alternarPausa(){if(!this.cena||!this.panel.classList.contains('hidden'))return;this.pausado=!this.pausado;if(this.pausado){this.panel.className='panel compact';this.panel.classList.remove('hidden');this.panel.innerHTML='<h2>JOGO PAUSADO</h2><p>Respire um pouco. Sua aventura está esperando!</p><button id="resume">CONTINUAR</button><button id="quit" class="secondary">ENCERRAR PARTIDA</button>';this.panel.querySelector('#resume').onclick=()=>this.alternarPausa();this.panel.querySelector('#quit').onclick=()=>MatGame.ResultScene.mostrar(this,'pausa');}else this.panel.classList.add('hidden');}};
 app.pause.onclick=()=>app.alternarPausa();
 try{
  // A cópia JS torna o jogo executável com duplo clique, inclusive via file://.
  if(window.MatGameContent)app.banco=window.MatGameContent;
  else{const r=await fetch('banco/conteudo.json');if(!r.ok)throw Error('Banco indisponível');app.banco=await r.json();}
  new Phaser.Game({start:()=>MatGame.MenuScene.mostrar(app)});
 }catch(e){app.panel.innerHTML='<h2>Não foi possível abrir o banco</h2><p>Verifique se a pasta <b>banco</b> foi copiada junto com o jogo.</p>';}
});
