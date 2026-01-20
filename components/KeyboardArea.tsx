
import React from 'react';
import { PianoKeyboard } from './PianoKeyboard';
import { getNoteName } from '../utils/helpers';
import { ChannelState, Instrument } from '../types';

interface KeyboardAreaProps {
    channel: ChannelState;
    instrumentName?: string;
    lastTriggeredNote: number;
    onNoteOn: (note: number) => void;
    onNoteOff: (note: number) => void;
    loading: boolean;
}

export const KeyboardArea = ({
    channel,
    instrumentName,
    lastTriggeredNote,
    onNoteOn,
    onNoteOff,
    loading
}: KeyboardAreaProps) => {
    const isDrum = channel.id === 9;

    return (
        <>
        <div className="border-t border-zinc-200 bg-zinc-100">
            <div className="flex justify-between items-center px-4 py-2 bg-zinc-200/50 text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
            <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                Keyboard Input: {isDrum ? 'Drums' : `Channel ${channel.id + 1}`}
                <span className="ml-2 text-zinc-400 normal-case tracking-normal">[Keys A-K]</span>
            </span>
            <span className="text-zinc-400">
                {isDrum 
                    ? `Drum Note: ${getNoteName(lastTriggeredNote)}` 
                    : instrumentName}
            </span>
            </div>
            <PianoKeyboard 
            startNote={36}
            octaves={4}
            activeNotes={channel.activeNotes} 
            onNoteOn={onNoteOn} 
            onNoteOff={onNoteOff} 
        />
        </div>

        <footer className="bg-white text-zinc-400 text-[10px] font-bold uppercase tracking-widest px-4 py-2 flex justify-between border-t border-zinc-200">
        <div>Doux Audio Engine <span className="mx-2 text-zinc-300">|</span> 48kHz <span className="mx-2 text-zinc-300">|</span> 32 Voices</div>
        <div className={loading ? "text-yellow-600 animate-pulse" : "text-zinc-400"}>{loading ? 'System Loading...' : 'System Ready'}</div>
        </footer>
        </>
    );
};
