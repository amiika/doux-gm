import type { DouxEvent, SoundInfo, ClockMessage, DouxOptions, PreparedMessage } from './types';

const soundMap = new Map<string, string[]>();
const loadedSounds = new Map<string, SoundInfo>();
const loadingSounds = new Map<string, Promise<SoundInfo>>();
let pcm_offset = 0;

const sources = [
	'triangle', 'tri', 'sine', 'sawtooth', 'saw', 'zawtooth', 'zaw',
	'pulse', 'square', 'pulze', 'zquare', 'white', 'pink', 'brown',
	'live', 'livein', 'mic'
];

function toRawGithub(url: string): string {
    if (url.includes('github.com') && url.includes('/blob/')) {
        return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }
    return url;
}

function resolveUrl(url: string): string {
    if (url.startsWith('tidalcycles:')) {
        // Handle tidalcycles: alias
        const rest = url.replace('tidalcycles:', '');
        // If it's just 'tidalcycles:Dirt-Samples', map to the main strudel.json
        if (rest === 'Dirt-Samples' || rest === '') {
            return 'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/strudel.json';
        }
        return `https://raw.githubusercontent.com/tidalcycles/${rest}/master/strudel.json`;
    }
    
    if (url.startsWith('github:')) {
        let [, path] = url.split('github:');
        path = path.endsWith('/') ? path.slice(0, -1) : path;
        // Handle short syntax "user/repo" -> master/strudel.json
        if (path.split('/').length === 2) {
            return `https://raw.githubusercontent.com/${path}/main/strudel.json`;
        }
        return `https://raw.githubusercontent.com/${path}`;
    }

    return toRawGithub(url);
}

async function fetchSampleMap(url: string): Promise<[Record<string, string[]>, string] | undefined> {
    const resolvedUrl = resolveUrl(url);
    
    // Determine base URL for relative paths in the JSON
    const base = resolvedUrl.substring(0, resolvedUrl.lastIndexOf('/'));

	if (typeof fetch !== 'function') {
		return;
	}

	const json = await fetch(resolvedUrl)
		.then((res) => {
			if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText} (${resolvedUrl})`);
			return res.json();
		})
		.catch((error) => {
            console.warn(`Error loading samples from ${resolvedUrl}: ${error.message}`);
			return null;
		});

    if (!json) return undefined;
	return [json, json._base || base];
}

export async function douxsamples(
	sampleMap: string | Record<string, string[]>,
	baseUrl?: string
): Promise<void> {
	if (typeof sampleMap === 'string') {
		const result = await fetchSampleMap(sampleMap);
		if (!result) return;
		const [json, base] = result;
		return douxsamples(json, base);
	}
    
    // Process the map
	Object.entries(sampleMap).map(async ([key, val]) => {
		if (key !== '_base') {
            // Ensure val is an array of strings
            const urls = Array.isArray(val) ? val : [val];
            // Resolve relative URLs
			const resolvedUrls = urls.map((url) => {
                if (url.match(/^https?:/)) return url;
                return (baseUrl ? (baseUrl + (baseUrl.endsWith('/') ? '' : '/')) : "") + url;
            });
			soundMap.set(key, resolvedUrls);
		}
	});
}

const BLOCK_SIZE = 128;
const CHANNELS = 2;
const CLOCK_SIZE = 16;

const workletCode = `
const BLOCK_SIZE = 128;
const CHANNELS = 2;
const CLOCK_SIZE = 16;

let wasmExports = null;
let wasmMemory = null;
let output = null;
let input_buffer = null;
let event_input_ptr = 0;
let framebuffer = null;
let framebuffer_ptr = 0;
let frame_ptr = 0;
let frameIdx = 0;
let block = 0;

class DouxProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.active = true;
    this.clock_active = options.processorOptions?.clock_active || false;
    this.clockmsg = {
      clock: true,
      t0: 0,
      t1: 0,
      latency: (CLOCK_SIZE * BLOCK_SIZE) / sampleRate,
    };
    this.port.onmessage = async (e) => {
      const { wasm, evaluate, event_input, panic, writePcm } = e.data;
      if (wasm) {
        const { instance } = await WebAssembly.instantiate(wasm, {});
        wasmExports = instance.exports;
        wasmMemory = wasmExports.memory;
        wasmExports.doux_init(sampleRate);
        event_input_ptr = wasmExports.get_event_input_pointer();
        output = new Float32Array(
          wasmMemory.buffer,
          wasmExports.get_output_pointer(),
          BLOCK_SIZE * CHANNELS,
        );
        input_buffer = new Float32Array(
          wasmMemory.buffer,
          wasmExports.get_input_buffer_pointer(),
          BLOCK_SIZE * CHANNELS,
        );
        framebuffer_ptr = wasmExports.get_framebuffer_pointer();
        frame_ptr = wasmExports.get_frame_pointer();
        const framebufferLen = Math.floor((sampleRate / 60) * CHANNELS) * 4;
        framebuffer = new Float32Array(framebufferLen);
        this.port.postMessage({ ready: true, sampleRate });
      } else if (writePcm) {
        const { data, offset } = writePcm;
        const pcm_ptr = wasmExports.get_sample_buffer_pointer();
        const pcm_len = wasmExports.get_sample_buffer_len();
        const pcm = new Float32Array(wasmMemory.buffer, pcm_ptr, pcm_len);
        pcm.set(data, offset);
        this.port.postMessage({ pcmWritten: offset });
      } else if (evaluate && event_input) {
        new Uint8Array(
          wasmMemory.buffer,
          event_input_ptr,
          event_input.length,
        ).set(event_input);
        wasmExports.evaluate();
      } else if (panic) {
        wasmExports.panic();
      }
    };
  }

  process(inputs, outputs, parameters) {
    if (wasmExports && outputs[0][0]) {
      if (input_buffer && inputs[0] && inputs[0][0]) {
        for (let i = 0; i < inputs[0][0].length; i++) {
          const offset = i * CHANNELS;
          for (let c = 0; c < CHANNELS; c++) {
            input_buffer[offset + c] = inputs[0][c]?.[i] ?? inputs[0][0][i];
          }
        }
      }
      wasmExports.dsp();
      const out = outputs[0];
      for (let i = 0; i < out[0].length; i++) {
        const offset = i * CHANNELS;
        for (let c = 0; c < CHANNELS; c++) {
          out[c][i] = output[offset + c];
          if (framebuffer) {
            framebuffer[frameIdx * CHANNELS + c] = output[offset + c];
          }
        }
        frameIdx = (frameIdx + 1) % (framebuffer.length / CHANNELS);
      }

      block++;
      if (block % 8 === 0 && framebuffer) {
        this.port.postMessage({
          framebuffer: framebuffer.slice(),
          frame: frameIdx,
        });
      }

      if (this.clock_active && block % CLOCK_SIZE === 0) {
        this.clockmsg.t0 = this.clockmsg.t1;
        this.clockmsg.t1 = wasmExports.get_time();
        this.port.postMessage(this.clockmsg);
      }
    }
    return this.active;
  }
}
registerProcessor("doux-processor", DouxProcessor);
`;

export class Doux {
	base: string;
	BLOCK_SIZE = BLOCK_SIZE;
	CHANNELS = CHANNELS;
	ready: Promise<void>;
	sampleRate = 0;
	frame: Int32Array = new Int32Array(1);
	framebuffer: Float32Array = new Float32Array(0);
	samplesReady: Promise<void> | null = null;

	private initAudio: Promise<AudioContext>;
	private worklet: AudioWorkletNode | null = null;
	private encoder: TextEncoder | null = null;
	private micSource: MediaStreamAudioSourceNode | null = null;
	private micStream: MediaStream | null = null;
	private onTick?: (msg: ClockMessage) => void;

	constructor(options: DouxOptions = {}) {
		this.base = options.base ?? '/';
		this.onTick = options.onTick;
		this.initAudio = new Promise((resolve) => {
			if (typeof document === 'undefined') return;
            // Auto-resume context if user interaction happens anywhere on page
            const unlock = async () => {
				const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
				await ac.resume();
				resolve(ac);
				document.removeEventListener('click', unlock);
                document.removeEventListener('keydown', unlock);
			};
			document.addEventListener('click', unlock);
            document.addEventListener('keydown', unlock);
		});
		this.ready = this.runWorklet();
	}

	private async initWorklet(): Promise<AudioWorkletNode> {
		const ac = await this.initAudio;
		const blob = new Blob([workletCode], { type: 'application/javascript' });
		const dataURL = URL.createObjectURL(blob);
		await ac.audioWorklet.addModule(dataURL);
		const worklet = new AudioWorkletNode(ac, 'doux-processor', {
			outputChannelCount: [CHANNELS],
			processorOptions: { clock_active: !!this.onTick }
		});
		worklet.connect(ac.destination);
		const res = await fetch(`${this.base}doux.wasm`);
		const wasm = await res.arrayBuffer();
		return new Promise((resolve) => {
			worklet.port.onmessage = async (e) => {
				if (e.data.ready) {
					this.sampleRate = e.data.sampleRate;
					this.frame = new Int32Array(1);
					this.frame[0] = 0;
					const framebufferLen = Math.floor((this.sampleRate / 60) * CHANNELS) * 4;
					this.framebuffer = new Float32Array(framebufferLen);
                    const p1 = douxsamples('https://samples.raphaelforment.fr');
                    const p2 = douxsamples('tidalcycles:Dirt-Samples');
                    
                    this.samplesReady = Promise.all([p1, p2]).then(() => {
                        console.log("All sample banks loaded.");
                    });
					resolve(worklet);
				} else if (e.data.clock) {
					this.onTick?.(e.data);
				} else if (e.data.framebuffer) {
					this.framebuffer.set(e.data.framebuffer);
					this.frame[0] = e.data.frame;
				}
			};
			worklet.port.postMessage({ wasm });
		});
	}

	private async runWorklet(): Promise<void> {
		const ac = await this.initAudio;
		if (ac.state !== 'running') await ac.resume();
		if (this.worklet) return;
		this.worklet = await this.initWorklet();
	}

	parsePath(path: string): DouxEvent {
		const chunks = path
			.trim()
			.split('\n')
			.map((line) => line.split('//')[0])
			.join('')
			.split('/')
			.filter(Boolean);
		const pairs: [string, string | undefined][] = [];
		for (let i = 0; i < chunks.length; i += 2) {
			pairs.push([chunks[i].trim(), chunks[i + 1]?.trim()]);
		}
		return Object.fromEntries(pairs);
	}

	private encodeEvent(input: string | DouxEvent): Uint8Array {
		if (!this.encoder) this.encoder = new TextEncoder();
		const str =
			typeof input === 'string'
				? input
				: Object.entries(input)
						.map(([k, v]) => `${k}/${v}`)
						.join('/');
		return this.encoder.encode(str + '\0');
	}

	async evaluate(input: DouxEvent): Promise<void> {
		const msg = await this.prepare(input);
		return this.send(msg);
	}

	async hush(): Promise<void> {
		await this.panic();
		const ac = await this.initAudio;
		ac.suspend();
	}

	async resume(): Promise<void> {
		const ac = await this.initAudio;
		if (ac.state !== 'running') await ac.resume();
	}

	async panic(): Promise<void> {
		await this.ready;
		this.worklet?.port.postMessage({ panic: true });
	}

	async enableMic(): Promise<void> {
		await this.ready;
		const ac = await this.initAudio;
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		const source = ac.createMediaStreamSource(stream);
		if (this.worklet) source.connect(this.worklet);
		this.micSource = source;
		this.micStream = stream;
	}

	disableMic(): void {
		if (this.micSource) {
			this.micSource.disconnect();
			this.micSource = null;
		}
		if (this.micStream) {
			this.micStream.getTracks().forEach((t) => t.stop());
			this.micStream = null;
		}
	}

	async prepare(event: DouxEvent): Promise<PreparedMessage> {
		await this.ready;
		if (this.samplesReady) await this.samplesReady;
		await this.maybeLoadFile(event);
		const encoded = this.encodeEvent(event);
		return {
			evaluate: true,
			event_input: encoded
		};
	}

	async send(msg: PreparedMessage): Promise<void> {
		await this.resume();
		this.worklet?.port.postMessage(msg);
	}

	private async fetchSample(url: string): Promise<Float32Array> {
		const ac = await this.initAudio;
		// URL encoding to handle spaces in sample names
        const encoded = encodeURI(url).replace(/#/g, '%23');
		const buffer = await fetch(encoded)
			.then((res) => {
                if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
                return res.arrayBuffer();
            })
			.then((buf) => ac.decodeAudioData(buf));
		return buffer.getChannelData(0);
	}

	private async loadSound(s: string, n = 0): Promise<SoundInfo> {
		const soundKey = `${s}:${n}`;

		if (loadedSounds.has(soundKey)) {
			return loadedSounds.get(soundKey)!;
		}

		if (!loadingSounds.has(soundKey)) {
			const urls = soundMap.get(s);
			if (!urls) {
                // Return dummy info to prevent infinite sustain on missing samples
                // throwing here crashes the flow, better to resolve a dummy
                console.warn(`Sound '${s}' not found in map.`);
                throw new Error(`Sound ${s} not found`);
            }
            
            // Handle wrapping n
			const url = urls[n % urls.length];

			const promise = this.fetchSample(url).then(async (data) => {
				const offset = pcm_offset;
				pcm_offset += data.length;

				await this.sendPcmData(data, offset);

				const info: SoundInfo = {
					pcm_offset: offset,
					frames: data.length,
					channels: 1,
					freq: 65.406
				};
				loadedSounds.set(soundKey, info);
				return info;
			}).catch(e => {
                console.error(e);
                throw e;
            });

			loadingSounds.set(soundKey, promise);
		}

		return loadingSounds.get(soundKey)!;
	}

	private sendPcmData(data: Float32Array, offset: number): Promise<void> {
		return new Promise((resolve) => {
			const handler = (e: MessageEvent) => {
				if (e.data.pcmWritten === offset) {
					this.worklet?.port.removeEventListener('message', handler);
					resolve();
				}
			};
			this.worklet?.port.addEventListener('message', handler);
			this.worklet?.port.postMessage({ writePcm: { data, offset } });
		});
	}

	private async maybeLoadFile(event: DouxEvent): Promise<void> {
		const s = event.s || event.sound;
		if (!s || typeof s !== 'string') return;
		if (sources.includes(s)) return;
		if (!soundMap.has(s)) return;

		const n = typeof event.n === 'string' ? parseInt(event.n) : event.n ?? 0;
        try {
		    const info = await this.loadSound(s, n);
            event.file_pcm = info.pcm_offset;
            event.file_frames = info.frames;
            event.file_channels = info.channels;
            event.file_freq = info.freq;
        } catch (e) {
            // If loading fails, ensure we don't pass broken file params
            // The engine will likely default to an oscillator. 
            // We should ensure the envelope is short to avoid hanging notes.
            if (!event.decay) event.decay = 0.1;
            if (!event.sustain) event.sustain = 0;
        }
	}
}

export const doux = new Doux();
