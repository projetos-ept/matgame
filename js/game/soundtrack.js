window.MatGame = window.MatGame || {};

/** Sintetizador MIDI local. Não depende do suporte MIDI nativo do navegador. */
MatGame.Soundtrack = class {
  constructor() {
    this.arquivos = ['NinjaForest.mid', 'T_SoldierBlade_Track03.mid', 'Zone1-MG.mid', 'City_Hunter_Level_1.mid', 'salalvl2.mid'];
    this.indice = -1;
    this.pausada = false;
    this.contexto = null;
    this.timer = null;
    this.osciladores = new Set();
    this.notas = [];
    this.duracao = 0;
    this.proximaNota = 0;
    this.posicao = 0;
    this.inicioContexto = 0;
  }

  iniciar() {
    this.pausada = false;
    const AudioContexto = window.AudioContext || window.webkitAudioContext;
    if (!AudioContexto) return;
    this.contexto ||= new AudioContexto();
    this.contexto.resume().catch(() => {});
    this.tocar(0);
  }

  atualizar(distancia) { this.tocar(Math.floor(distancia / 500) % this.arquivos.length); }

  tocar(indice) {
    if (indice === this.indice || !this.contexto) return;
    const base64 = window.MatGameSoundtrackData?.[this.arquivos[indice]];
    this.pararAgendamento();
    this.indice = indice;
    if (!base64) return; // Arquivo ausente: jogo continua sem aviso.
    try {
      const binario = atob(base64);
      const bytes = Uint8Array.from(binario, (caractere) => caractere.charCodeAt(0));
      const musica = this.lerMidi(bytes);
      this.notas = musica.notas;
      this.duracao = musica.duracao;
      this.posicao = 0;
      if (!this.pausada && this.notas.length) this.iniciarAgendamento();
    } catch (erro) { this.notas = []; this.duracao = 0; }
  }

  lerMidi(bytes) {
    const texto = (p, n) => String.fromCharCode(...bytes.slice(p, p + n));
    const u16 = (p) => (bytes[p] << 8) | bytes[p + 1];
    const u32 = (p) => ((bytes[p] << 24) | (bytes[p + 1] << 16) | (bytes[p + 2] << 8) | bytes[p + 3]) >>> 0;
    if (texto(0, 4) !== 'MThd') throw Error('MIDI inválido');
    const cabecalho = u32(4); const trilhas = u16(10); const divisao = u16(12);
    if (divisao & 0x8000) throw Error('MIDI SMPTE não suportado');
    let cursor = 8 + cabecalho; const eventos = [];
    const variavel = (estado) => { let valor = 0; let byte; do { byte = bytes[estado.p++]; valor = (valor << 7) | (byte & 0x7f); } while (byte & 0x80); return valor; };
    for (let t = 0; t < trilhas && cursor + 8 <= bytes.length; t += 1) {
      if (texto(cursor, 4) !== 'MTrk') break;
      const fim = cursor + 8 + u32(cursor + 4); const estado = { p: cursor + 8 }; let tick = 0; let statusCanal = 0;
      while (estado.p < fim) {
        tick += variavel(estado); let primeiro = bytes[estado.p++];
        let status;
        if (primeiro < 0x80) { estado.p -= 1; status = statusCanal; }
        else { status = primeiro; if (status < 0xf0) statusCanal = status; }
        if (!status) throw Error('Running status MIDI inválido');
        if (status === 0xff) {
          const tipo = bytes[estado.p++]; const tamanho = variavel(estado);
          if (tipo === 0x51 && tamanho === 3) eventos.push({ tick, tempo: (bytes[estado.p] << 16) | (bytes[estado.p + 1] << 8) | bytes[estado.p + 2] });
          estado.p += tamanho; continue;
        }
        if (status === 0xf0 || status === 0xf7) { estado.p += variavel(estado); continue; }
        const comando = status & 0xf0; const canal = status & 0x0f;
        const dado1 = bytes[estado.p++]; const doisDados = comando !== 0xc0 && comando !== 0xd0; const dado2 = doisDados ? bytes[estado.p++] : 0;
        if (comando === 0x90 && dado2 > 0) eventos.push({ tick, liga: true, canal, nota: dado1, velocidade: dado2 });
        if (comando === 0x80 || (comando === 0x90 && dado2 === 0)) eventos.push({ tick, liga: false, canal, nota: dado1 });
      }
      cursor = fim;
    }
    eventos.sort((a, b) => a.tick - b.tick || (a.tempo ? -1 : 0));
    let tick = 0; let segundos = 0; let tempo = 500000; const ativas = new Map(); const notas = [];
    for (const evento of eventos) {
      segundos += (evento.tick - tick) * tempo / divisao / 1000000; tick = evento.tick;
      if (evento.tempo) { tempo = evento.tempo; continue; }
      const chave = `${evento.canal}:${evento.nota}`;
      if (evento.liga) ativas.set(chave, { inicio: segundos, nota: evento.nota, velocidade: evento.velocidade, canal: evento.canal });
      else if (ativas.has(chave)) { const nota = ativas.get(chave); notas.push({ ...nota, fim: Math.max(segundos, nota.inicio + 0.05) }); ativas.delete(chave); }
    }
    const duracao = Math.max(1, segundos, ...notas.map((nota) => nota.fim));
    return { notas: notas.sort((a, b) => a.inicio - b.inicio), duracao };
  }

  iniciarAgendamento() {
    this.inicioContexto = this.contexto.currentTime - this.posicao;
    this.proximaNota = this.notas.findIndex((nota) => nota.inicio >= this.posicao);
    if (this.proximaNota < 0) this.proximaNota = 0;
    this.timer = setInterval(() => this.agendar(), 100);
    this.agendar();
  }

  agendar() {
    if (this.pausada || !this.notas.length) return;
    const agora = this.contexto.currentTime; const posicao = agora - this.inicioContexto;
    if (posicao >= this.duracao) { this.pararOsciladores(); this.posicao = 0; this.inicioContexto = agora; this.proximaNota = 0; }
    const limite = (this.contexto.currentTime - this.inicioContexto) + 0.7;
    while (this.proximaNota < this.notas.length && this.notas[this.proximaNota].inicio <= limite) this.agendarNota(this.notas[this.proximaNota++]);
  }

  agendarNota(nota) {
    const inicio = this.inicioContexto + nota.inicio; const fim = this.inicioContexto + nota.fim;
    if (fim <= this.contexto.currentTime) return;
    const oscilador = this.contexto.createOscillator(); const ganho = this.contexto.createGain();
    oscilador.type = nota.canal === 9 ? 'square' : 'triangle';
    oscilador.frequency.value = 440 * 2 ** ((nota.nota - 69) / 12);
    const volume = MatGame.CONFIG.audio.volumeTrilha * (nota.velocidade / 127) * 0.12;
    ganho.gain.setValueAtTime(0.0001, Math.max(inicio, this.contexto.currentTime));
    ganho.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), Math.max(inicio, this.contexto.currentTime) + 0.015);
    ganho.gain.exponentialRampToValueAtTime(0.0001, Math.max(fim, inicio + 0.03));
    oscilador.connect(ganho).connect(this.contexto.destination); this.osciladores.add(oscilador);
    oscilador.onended = () => this.osciladores.delete(oscilador);
    oscilador.start(Math.max(inicio, this.contexto.currentTime)); oscilador.stop(Math.max(fim + 0.03, this.contexto.currentTime + 0.05));
  }

  pausar() {
    if (this.pausada) return;
    this.pausada = true;
    if (this.contexto && this.duracao) this.posicao = (this.contexto.currentTime - this.inicioContexto) % this.duracao;
    this.pararAgendamento(false);
  }

  continuar() {
    if (!this.pausada) return;
    this.pausada = false;
    this.contexto?.resume().catch(() => {});
    if (this.notas.length) this.iniciarAgendamento();
  }

  pararOsciladores() { for (const oscilador of this.osciladores) { try { oscilador.stop(); } catch (erro) {} } this.osciladores.clear(); }
  pararAgendamento(limpar = true) {
    clearInterval(this.timer); this.timer = null; this.pararOsciladores();
    if (limpar) { this.notas = []; this.duracao = 0; this.posicao = 0; }
  }
  parar() { this.pausada = false; this.indice = -1; this.pararAgendamento(); }
};
