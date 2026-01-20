
export const MIDI_COMMANDS = {
    NOTE_OFF: 0x80,
    NOTE_ON: 0x90,
    POLY_AFTERTOUCH: 0xA0,
    CONTROL_CHANGE: 0xB0,
    PROGRAM_CHANGE: 0xC0,
    CHANNEL_AFTERTOUCH: 0xD0,
    PITCH_BEND: 0xE0,
};

export interface ParsedMidiMessage {
    command: number;
    channel: number;
    data1: number;
    data2: number;
}

export const parseMidiMessage = (data: Uint8Array | number[]): ParsedMidiMessage => {
    const [status, data1, data2] = data;
    const command = status & 0xf0;
    const channel = status & 0x0f;
    return { command, channel, data1, data2 };
};
