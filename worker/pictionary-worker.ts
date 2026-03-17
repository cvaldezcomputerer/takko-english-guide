/// <reference types="@cloudflare/workers-types" />

const themes: Record<string, readonly string[]> = {
  Animals: ['cat','dog','bird','fish','rabbit','elephant','monkey','snake','lion','tiger','bear','duck','frog','butterfly','turtle','horse','cow','pig','chicken','penguin','giraffe','zebra','whale','crab'],
  Food: ['apple','banana','pizza','bread','cake','rice','soup','egg','milk','cheese','carrot','tomato','sandwich','ice cream','cookie','noodles','watermelon','grapes','strawberry','popcorn','sushi','ramen'],
  School: ['book','pen','desk','teacher','backpack','ruler','computer','board','pencil','eraser','notebook','scissors','glue','crayon','map','clock','chair','glasses','stapler','folder','library','gym'],
  Home: ['bed','chair','table','door','window','sofa','kitchen','bathroom','clock','lamp','mirror','pillow','blanket','television','refrigerator','stove','toilet','shower','curtain','shelf','stairs','garage'],
  Nature: ['tree','flower','sun','moon','star','rain','mountain','river','cloud','rainbow','ocean','beach','forest','snow','wind','leaf','rock','grass','waterfall','volcano','island','desert'],
  Sports: ['football','basketball','swimming','running','tennis','bicycle','jump rope','baseball','golf','skiing','surfing','boxing','yoga','bowling','archery','diving','gymnastics','rowing','climbing','skating'],
};

type Phase = 'lobby' | 'drawing' | 'round_end';

interface Player { id: string; name: string; }
interface DrawEvent { type: 'start' | 'move' | 'end'; x: number; y: number; color?: string; width?: number; }
interface Guess { playerId: string; name: string; text: string; }

interface RoomState {
  phase: Phase;
  theme: string | null;
  timerDuration: number;
  currentWord: string | null;
  currentDrawerId: string | null;
  drawerQueue: string[];
  players: Player[];
  roundTimerEnd: number | null;
  drawHistory: DrawEvent[];
  guesses: Guess[];
}

export class PictionaryRoom implements DurableObject {
  private roomState: RoomState = {
    phase: 'lobby',
    theme: null,
    timerDuration: 90,
    currentWord: null,
    currentDrawerId: null,
    drawerQueue: [],
    players: [],
    roundTimerEnd: null,
    drawHistory: [],
    guesses: [],
  };
  private connections: Map<string, WebSocket> = new Map();
  private roundTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const url = new URL(request.url);
    const connId = url.searchParams.get('_pk') ?? crypto.randomUUID();

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    server.accept();

    this.connections.set(connId, server);

    server.addEventListener('message', (ev: MessageEvent) => {
      this.onMessage(String(ev.data), connId);
    });

    const cleanup = () => {
      this.connections.delete(connId);
      this.onClose(connId);
    };
    server.addEventListener('close', cleanup);
    server.addEventListener('error', cleanup);

    this.onConnect(connId, server);

    return new Response(null, { status: 101, webSocket: client });
  }

  private send(ws: WebSocket, data: unknown) {
    try { ws.send(JSON.stringify(data)); } catch {}
  }

  private broadcast(data: unknown, exclude?: string) {
    const msg = JSON.stringify(data);
    for (const [id, ws] of this.connections) {
      if (id !== exclude) try { ws.send(msg); } catch {}
    }
  }

  private onConnect(connId: string, ws: WebSocket) {
    const isHost = connId === 'host';
    const isDrawer = connId === this.roomState.currentDrawerId;
    this.send(ws, {
      type: 'room_state',
      phase: this.roomState.phase,
      theme: this.roomState.theme,
      timerDuration: this.roomState.timerDuration,
      currentWord: (isHost || isDrawer) ? this.roomState.currentWord : null,
      currentDrawerId: this.roomState.currentDrawerId,
      players: this.roomState.players,
      roundTimerEnd: this.roomState.roundTimerEnd,
      yourRole: isHost ? 'host' : (isDrawer ? 'drawer' : 'viewer'),
      drawHistory: this.roomState.drawHistory,
    });
  }

  private onMessage(message: string, senderId: string) {
    let data: any;
    try { data = JSON.parse(message); } catch { return; }

    switch (data.type) {
      case 'host_init': {
        if (senderId !== 'host') return;
        this.roomState.theme = data.theme ?? this.roomState.theme;
        this.roomState.timerDuration = data.timerDuration ?? this.roomState.timerDuration;
        this.broadcastState();
        break;
      }

      case 'player_join': {
        if (!this.connections.has('host')) {
          this.send(this.connections.get(senderId)!, { type: 'error', message: 'Room not found. Check your code.' });
          return;
        }
        if (this.roomState.players.length >= 50) {
          this.send(this.connections.get(senderId)!, { type: 'error', message: 'Room is full (50 max)' });
          return;
        }
        if (this.roomState.players.find(p => p.id === senderId)) return;
        const player: Player = { id: senderId, name: String(data.name).slice(0, 20) };
        this.roomState.players.push(player);
        this.roomState.drawerQueue.push(senderId);
        this.broadcastState();
        if (this.roomState.drawHistory.length > 0) {
          this.send(this.connections.get(senderId)!, { type: 'draw_history', events: this.roomState.drawHistory });
        }
        break;
      }

      case 'start_round':
      case 'next_round': {
        if (senderId !== 'host') return;
        this.startRound();
        break;
      }

      case 'draw': {
        if (senderId !== this.roomState.currentDrawerId) return;
        const event: DrawEvent = data.event;
        this.roomState.drawHistory.push(event);
        this.broadcast({ type: 'draw', event }, senderId);
        break;
      }

      case 'guess': {
        if (senderId === 'host' || senderId === this.roomState.currentDrawerId) return;
        if (this.roomState.phase !== 'drawing' && this.roomState.phase !== 'round_end') return;
        const player = this.roomState.players.find(p => p.id === senderId);
        if (!player) return;
        const text = String(data.text ?? '').slice(0, 60).trim();
        if (!text) return;
        const idx = this.roomState.guesses.findIndex(g => g.playerId === senderId);
        const guess: Guess = { playerId: senderId, name: player.name, text };
        if (idx >= 0) this.roomState.guesses[idx] = guess;
        else this.roomState.guesses.push(guess);
        this.send(this.connections.get(senderId)!, { type: 'guess_ack', text });
        break;
      }

      case 'clear_canvas': {
        if (senderId !== 'host' && senderId !== this.roomState.currentDrawerId) return;
        this.roomState.drawHistory = [];
        this.broadcast({ type: 'canvas_cleared' });
        break;
      }
    }
  }

  private onClose(connId: string) {
    if (connId === 'host') return;
    this.roomState.players = this.roomState.players.filter(p => p.id !== connId);
    this.roomState.drawerQueue = this.roomState.drawerQueue.filter(id => id !== connId);
    if (this.roomState.currentDrawerId === connId) {
      this.endRound();
    } else {
      this.broadcastState();
    }
  }

  private startRound() {
    if (this.roomState.players.length === 0 || !this.roomState.theme) return;
    if (this.roomState.drawerQueue.length === 0) {
      this.roomState.drawerQueue = this.roomState.players.map(p => p.id);
    }

    const drawerId = this.roomState.drawerQueue.shift()!;
    const words = themes[this.roomState.theme];
    const word = words[Math.floor(Math.random() * words.length)];

    this.roomState.drawHistory = [];
    this.roomState.guesses = [];
    this.roomState.currentDrawerId = drawerId;
    this.roomState.currentWord = word;
    this.roomState.phase = 'drawing';
    this.roomState.roundTimerEnd = Date.now() + this.roomState.timerDuration * 1000;

    const drawer = this.roomState.players.find(p => p.id === drawerId);

    for (const [id, ws] of this.connections) {
      const isHost = id === 'host';
      const isDrawer = id === drawerId;
      this.send(ws, {
        type: 'round_started',
        word: (isHost || isDrawer) ? word : null,
        drawerName: drawer?.name ?? 'Someone',
        drawerId,
        roundTimerEnd: this.roomState.roundTimerEnd,
        timerDuration: this.roomState.timerDuration,
        yourRole: isHost ? 'host' : (isDrawer ? 'drawer' : 'viewer'),
      });
    }

    if (this.roundTimer) clearTimeout(this.roundTimer);
    this.roundTimer = setTimeout(() => this.endRound(), this.roomState.timerDuration * 1000);
  }

  private endRound() {
    this.roomState.phase = 'round_end';
    this.roomState.roundTimerEnd = null;
    if (this.roundTimer) { clearTimeout(this.roundTimer); this.roundTimer = null; }
    this.broadcast({ type: 'round_ended', word: this.roomState.currentWord, guesses: this.roomState.guesses });
  }

  private broadcastState() {
    for (const [id, ws] of this.connections) {
      const isHost = id === 'host';
      const isDrawer = id === this.roomState.currentDrawerId;
      this.send(ws, {
        type: 'room_state',
        phase: this.roomState.phase,
        theme: this.roomState.theme,
        timerDuration: this.roomState.timerDuration,
        currentWord: (isHost || isDrawer) ? this.roomState.currentWord : null,
        currentDrawerId: this.roomState.currentDrawerId,
        players: this.roomState.players,
        roundTimerEnd: this.roomState.roundTimerEnd,
        yourRole: isHost ? 'host' : (isDrawer ? 'drawer' : 'viewer'),
      });
    }
  }
}

interface Env {
  PICTIONARY_ROOM: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/parties\/[^/]+\/([^/?]+)/);
    if (match) {
      const id = env.PICTIONARY_ROOM.idFromName(match[1]);
      return env.PICTIONARY_ROOM.get(id).fetch(request);
    }
    return new Response('Not found', { status: 404 });
  },
};
