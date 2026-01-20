
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const getNoteName = (note: number) => {
    const oct = Math.floor(note / 12) - 1;
    const name = NOTE_NAMES[note % 12];
    return `${name}${oct} (${note})`;
};

export const mtof = (note: number) => 440 * Math.pow(2, (note - 69) / 12);
