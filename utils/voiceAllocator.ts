
export class VoiceAllocator {
  // Round-robin allocator
  private voices: { note: number; channel: number; active: boolean; timestamp: number }[] = [];
  private maxVoices = 32;
  private nextVoice = 0;

  constructor() {
    for (let i = 0; i < this.maxVoices; i++) {
      this.voices.push({ note: -1, channel: -1, active: false, timestamp: 0 });
    }
  }

  allocate(channel: number, note: number): number {
    // 1. Find free voice using round-robin to allow tails to ring out
    for (let i = 0; i < this.maxVoices; i++) {
        const idx = (this.nextVoice + i) % this.maxVoices;
        if (!this.voices[idx].active) {
            this.voices[idx] = { note, channel, active: true, timestamp: Date.now() };
            this.nextVoice = (idx + 1) % this.maxVoices;
            return idx;
        }
    }
    
    // 2. If no free voice, steal oldest active voice
    const idx = this.voices.reduce((oldestIdx, v, currentIdx, arr) => {
      return v.timestamp < arr[oldestIdx].timestamp ? currentIdx : oldestIdx;
    }, 0);
    
    this.voices[idx] = { note, channel, active: true, timestamp: Date.now() };
    this.nextVoice = (idx + 1) % this.maxVoices;
    return idx;
  }

  findActive(channel: number, note: number): number[] {
    return this.voices
      .map((v, i) => ({ ...v, idx: i }))
      .filter(v => v.active && v.channel === channel && v.note === note)
      .map(v => v.idx);
  }

  findActiveByChannel(channel: number): number[] {
    return this.voices
      .map((v, i) => ({ ...v, idx: i }))
      .filter(v => v.active && v.channel === channel)
      .map(v => v.idx);
  }

  getNote(idx: number): number {
    return this.voices[idx]?.note || 0;
  }

  release(idx: number) {
    if (this.voices[idx]) {
      this.voices[idx].active = false;
    }
  }

  reset() {
      for (let i = 0; i < this.maxVoices; i++) {
        this.voices[i] = { note: -1, channel: -1, active: false, timestamp: 0 };
      }
      this.nextVoice = 0;
  }
}
