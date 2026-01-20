
import React from 'react';

export const useKeyboard = (
    selectedChannelId: number,
    onNoteOn: (note: number) => void,
    onNoteOff: (note: number) => void
) => {
    const keyboardState = React.useRef<Set<string>>(new Set());

    React.useEffect(() => {
        const keyMap: Record<string, number> = {
            'a': 0, 'w': 1, 's': 2, 'e': 3, 'd': 4, 'f': 5, 't': 6,
            'g': 7, 'y': 8, 'h': 9, 'u': 10, 'j': 11, 'k': 12, 'o': 13, 'l': 14
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

            const key = e.key.toLowerCase();
            if (key in keyMap && !keyboardState.current.has(key)) {
                keyboardState.current.add(key);
                const baseNote = selectedChannelId === 9 ? 35 : 48;
                onNoteOn(baseNote + keyMap[key]);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key in keyMap) {
                keyboardState.current.delete(key);
                const baseNote = selectedChannelId === 9 ? 35 : 48;
                onNoteOff(baseNote + keyMap[key]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [selectedChannelId, onNoteOn, onNoteOff]);
};
