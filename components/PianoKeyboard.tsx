
import React, { useState, useEffect } from 'react';

interface PianoKeyboardProps {
    startNote?: number;
    octaves?: number;
    activeNotes: Set<number>;
    onNoteOn: (note: number) => void;
    onNoteOff: (note: number) => void;
}

export const PianoKeyboard = ({ 
    startNote = 36, 
    octaves = 4, 
    activeNotes, 
    onNoteOn, 
    onNoteOff 
}: PianoKeyboardProps) => {
    const [mouseDown, setMouseDown] = useState(false);

    // Global mouse up to catch dragging off keys
    useEffect(() => {
        const handleUp = () => setMouseDown(false);
        window.addEventListener('mouseup', handleUp);
        return () => window.removeEventListener('mouseup', handleUp);
    }, []);

    const keys = [];
    const endNote = startNote + (octaves * 12);

    const isBlack = (note: number) => {
        const n = note % 12;
        return [1, 3, 6, 8, 10].includes(n);
    };

    const handleMouseDown = (note: number) => {
        setMouseDown(true);
        onNoteOn(note);
    };

    const handleMouseEnter = (note: number) => {
        if (mouseDown) {
            onNoteOn(note);
        }
    };

    const handleMouseUp = (note: number) => {
        onNoteOff(note);
    };
    
    const handleMouseLeave = (note: number) => {
        if (mouseDown) {
             onNoteOff(note);
        }
    };

    for (let i = startNote; i <= endNote; i++) {
        const black = isBlack(i);
        const active = activeNotes.has(i);
        
        // Revised Styles for Sleek White Theme
        const baseStyle = "flex-shrink-0 cursor-pointer select-none relative transition-all duration-75 rounded-b-md";
        
        // White key
        // Cleaner look, less gradients, subtle shadows
        const whiteStyle = `h-32 w-10 z-0 border-x border-b border-zinc-300 shadow-sm active:shadow-inner active:translate-y-[1px] active:border-b-zinc-200
            ${active 
                ? 'bg-blue-100 border-blue-200 shadow-none' 
                : 'bg-white hover:bg-zinc-50'}`;

        // Black key
        // Matte black look
        const blackStyle = `h-20 w-6 z-10 -mx-3 border-x border-b border-zinc-800 shadow-md active:shadow-sm active:translate-y-[1px]
            ${active 
                ? 'bg-blue-600 border-blue-800 shadow-sm' 
                : 'bg-zinc-800 bg-gradient-to-b from-zinc-700 to-zinc-900'}`;

        const colorStyle = black ? blackStyle : whiteStyle;

        keys.push(
            <div
                key={i}
                className={`${baseStyle} ${colorStyle}`}
                onMouseDown={() => handleMouseDown(i)}
                onMouseEnter={() => handleMouseEnter(i)}
                onMouseUp={() => handleMouseUp(i)}
                onMouseLeave={() => handleMouseLeave(i)}
            >
                {/* Note Label on White Keys */}
                {!black && i % 12 === 0 && (
                    <span className="absolute bottom-2 left-0 right-0 text-center text-[9px] font-bold text-zinc-400 pointer-events-none">
                        C{Math.floor(i/12) - 1}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="flex justify-center items-start bg-zinc-100 p-6 overflow-x-auto select-none no-scrollbar">
            <div className="flex relative px-4 shadow-xl rounded-lg bg-white border border-zinc-200 p-1">
                {keys}
            </div>
        </div>
    );
};
