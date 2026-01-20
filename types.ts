export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: 'connected' | 'disconnected';
  connection: 'open' | 'closed' | 'pending';
}

export interface ChannelState {
  id: number; // 0-15
  program: number; // 0-127 (GM Instrument)
  volume: number; // 0-127
  pan: number; // 0-127 (64 is center)
  mute: boolean;
  solo: boolean;
  activeNotes: Set<number>;
  mode: 'gm' | 'custom';
  customSyntax: string;
}

export interface GMInstrument {
  id: number;
  name: string;
  category: string;
}

export interface Instrument extends GMInstrument {
  syntax: string;
}

export enum SynthCategory {
  PIANO,
  CHROMATIC_PERC,
  ORGAN,
  GUITAR,
  BASS,
  STRINGS,
  ENSEMBLE,
  BRASS,
  REED,
  PIPE,
  SYNTH_LEAD,
  SYNTH_PAD,
  SYNTH_FX,
  ETHNIC,
  PERCUSSIVE,
  SOUND_FX
}

// Doux Types
export interface DouxEvent {
	doux?: string;
	s?: string;
	sound?: string;
	n?: string | number;
	freq?: number;
	note?: number;
	velocity?: number;
	gain?: number;
    postgain?: number;
	wave?: string;
    voice?: number;
    gate?: number;
    
    // Synthesis params
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
    
    lpf?: number;
    lpq?: number;
    hpf?: number;
    hpq?: number;
    
    pan?: number;
    
	file_pcm?: number;
	file_frames?: number;
	file_channels?: number;
	file_freq?: number;
	[key: string]: string | number | undefined;
}

export interface SoundInfo {
	pcm_offset: number;
	frames: number;
	channels: number;
	freq: number;
}

export interface ClockMessage {
	clock: boolean;
	t0: number;
	t1: number;
	latency: number;
}

export interface DouxOptions {
	onTick?: (msg: ClockMessage) => void;
	base?: string;
}

export interface PreparedMessage {
	evaluate: boolean;
	event_input: Uint8Array;
}