import type * as Party from "partykit/server";

const themes: Record<string, readonly string[]> = {
  Animals: ['cat','dog','bird','fish','rabbit','elephant','monkey','snake','lion','tiger','bear','duck','frog','butterfly','turtle','horse','cow','pig','chicken','penguin','giraffe','zebra','whale','crab'],
  Food: ['apple','banana','pizza','bread','cake','rice','soup','egg','milk','cheese','carrot','tomato','sandwich','ice cream','cookie','noodles','watermelon','grapes','strawberry','popcorn','sushi','ramen'],
  School: ['book','pen','desk','teacher','backpack','ruler','computer','board','pencil','eraser','notebook','scissors','glue','crayon','map','clock','chair','glasses','stapler','folder','library','gym'],
  Home: ['bed','chair','table','door','window','sofa','kitchen','bathroom','clock','lamp','mirror','pillow','blanket','television','refrigerator','stove','toilet','shower','curtain','shelf','stairs','garage'],
  Nature: ['tree','flower','sun','moon','star','rain','mountain','river','cloud','rainbow','ocean','beach','forest','snow','wind','leaf','rock','grass','waterfall','volcano','island','desert'],
  Sports: ['football','basketball','swimming','running','tennis','bicycle','jump rope','baseball','golf','skiing','surfing','boxing','yoga','bowling','archery','diving','gymnastics','rowing','climbing','skating'],
};

type Phase = 'lobby' | 'drawing' | 'round_end';

interface Player {
  id: string;
  name: string;
}

interface DrawEvent {
  type: 'start' | 'move' | 'end';
  x: number;
  y: number;
  color?: string;
  width?: number;
}

interface Guess {
  playerId: string;
  name: string;
  text: string;
}

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

export default class PictionaryServer implements Party.Server {
  state: RoomState = {
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

  roundTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    const isHost = conn.id === 'host';
    const isDrawer = conn.id === this.state.currentDrawerId;
    conn.send(JSON.stringify({
      type: 'room_state',
      phase: this.state.phase,
      theme: this.state.theme,
      timerDuration: this.state.timerDuration,
      currentWord: (isHost || isDrawer) ? this.state.currentWord : null,
      currentDrawerId: this.state.currentDrawerId,
      players: this.state.players,
      roundTimerEnd: this.state.roundTimerEnd,
      yourRole: isHost ? 'host' : (isDrawer ? 'drawer' : 'viewer'),
      drawHistory: this.state.drawHistory,
    }));
  }

  onMessage(message: string, sender: Party.Connection) {
    let data: any;
    try { data = JSON.parse(message); } catch { return; }

    switch (data.type) {
      case 'host_init': {
        if (sender.id !== 'host') return;
        this.state.theme = data.theme ?? this.state.theme;
        this.state.timerDuration = data.timerDuration ?? this.state.timerDuration;
        this.broadcastState();
        break;
      }

      case 'player_join': {
        const hostActive = [...this.room.getConnections()].some(c => c.id === 'host');
        if (!hostActive) {
          sender.send(JSON.stringify({ type: 'error', message: 'Room not found. Check your code.' }));
          return;
        }
        if (this.state.players.length >= 50) {
          sender.send(JSON.stringify({ type: 'error', message: 'Room is full (50 max)' }));
          return;
        }
        // Prevent duplicate IDs
        if (this.state.players.find(p => p.id === sender.id)) return;
        const player: Player = { id: sender.id, name: String(data.name).slice(0, 20) };
        this.state.players.push(player);
        this.state.drawerQueue.push(sender.id);
        this.broadcastState();
        // Catch up late joiners with current drawing
        if (this.state.drawHistory.length > 0) {
          sender.send(JSON.stringify({ type: 'draw_history', events: this.state.drawHistory }));
        }
        break;
      }

      case 'start_round':
      case 'next_round': {
        if (sender.id !== 'host') return;
        this.startRound();
        break;
      }

      case 'draw': {
        if (sender.id !== this.state.currentDrawerId) return;
        const event: DrawEvent = data.event;
        this.state.drawHistory.push(event);
        this.room.broadcast(JSON.stringify({ type: 'draw', event }), [sender.id]);
        break;
      }

      case 'guess': {
        // Only viewers can guess (not host, not drawer), only during drawing or round_end
        if (sender.id === 'host') return;
        if (sender.id === this.state.currentDrawerId) return;
        if (this.state.phase !== 'drawing' && this.state.phase !== 'round_end') return;
        const player = this.state.players.find(p => p.id === sender.id);
        if (!player) return;
        const text = String(data.text ?? '').slice(0, 60).trim();
        if (!text) return;
        // Replace existing guess from this player
        const idx = this.state.guesses.findIndex(g => g.playerId === sender.id);
        const guess: Guess = { playerId: sender.id, name: player.name, text };
        if (idx >= 0) this.state.guesses[idx] = guess;
        else this.state.guesses.push(guess);
        // Confirm back to sender
        sender.send(JSON.stringify({ type: 'guess_ack', text }));
        break;
      }

      case 'clear_canvas': {
        if (sender.id !== 'host' && sender.id !== this.state.currentDrawerId) return;
        this.state.drawHistory = [];
        this.room.broadcast(JSON.stringify({ type: 'canvas_cleared' }));
        break;
      }
    }
  }

  onClose(conn: Party.Connection) {
    if (conn.id === 'host') return;
    this.state.players = this.state.players.filter(p => p.id !== conn.id);
    this.state.drawerQueue = this.state.drawerQueue.filter(id => id !== conn.id);
    if (this.state.currentDrawerId === conn.id) {
      this.endRound();
    } else {
      this.broadcastState();
    }
  }

  startRound() {
    if (this.state.players.length === 0) return;
    if (!this.state.theme) return;

    // Refill queue if exhausted
    if (this.state.drawerQueue.length === 0) {
      this.state.drawerQueue = this.state.players.map(p => p.id);
    }

    const drawerId = this.state.drawerQueue.shift()!;
    const words = themes[this.state.theme];
    const word = words[Math.floor(Math.random() * words.length)];

    this.state.drawHistory = [];
    this.state.guesses = [];
    this.state.currentDrawerId = drawerId;
    this.state.currentWord = word;
    this.state.phase = 'drawing';
    this.state.roundTimerEnd = Date.now() + this.state.timerDuration * 1000;

    const drawer = this.state.players.find(p => p.id === drawerId);

    for (const conn of this.room.getConnections()) {
      const isHost = conn.id === 'host';
      const isDrawer = conn.id === drawerId;
      conn.send(JSON.stringify({
        type: 'round_started',
        word: (isHost || isDrawer) ? word : null,
        drawerName: drawer?.name ?? 'Someone',
        drawerId,
        roundTimerEnd: this.state.roundTimerEnd,
        timerDuration: this.state.timerDuration,
        yourRole: isHost ? 'host' : (isDrawer ? 'drawer' : 'viewer'),
      }));
    }

    if (this.roundTimer) clearTimeout(this.roundTimer);
    this.roundTimer = setTimeout(() => this.endRound(), this.state.timerDuration * 1000);
  }

  endRound() {
    this.state.phase = 'round_end';
    this.state.roundTimerEnd = null;
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }
    this.room.broadcast(JSON.stringify({
      type: 'round_ended',
      word: this.state.currentWord,
      guesses: this.state.guesses,
    }));
  }

  broadcastState() {
    for (const conn of this.room.getConnections()) {
      const isHost = conn.id === 'host';
      const isDrawer = conn.id === this.state.currentDrawerId;
      conn.send(JSON.stringify({
        type: 'room_state',
        phase: this.state.phase,
        theme: this.state.theme,
        timerDuration: this.state.timerDuration,
        currentWord: (isHost || isDrawer) ? this.state.currentWord : null,
        currentDrawerId: this.state.currentDrawerId,
        players: this.state.players,
        roundTimerEnd: this.state.roundTimerEnd,
        yourRole: isHost ? 'host' : (isDrawer ? 'drawer' : 'viewer'),
      }));
    }
  }
}
