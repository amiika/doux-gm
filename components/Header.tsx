
import React, { ChangeEvent } from 'react';
import { MidiDevice } from '../types';

interface HeaderProps {
    audioStarted: boolean;
    loading: boolean;
    devices: MidiDevice[];
    selectedInputId: string;
    onStartAudio: () => void;
    onPanic: () => void;
    onImport: (e: ChangeEvent<HTMLInputElement>) => void;
    onExport: () => void;
    onSelectInput: (id: string) => void;
}

export const Header = ({
    audioStarted,
    loading,
    devices,
    selectedInputId,
    onStartAudio,
    onPanic,
    onImport,
    onExport,
    onSelectInput
}: HeaderProps) => {
    return (
        <header className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
                {/* Cloud Logo */}
                <div className="text-3xl select-none filter drop-shadow-sm">
                    ☁️
                </div>
                <h1 className="text-lg font-bold tracking-widest text-zinc-800 uppercase font-mono">Doux <span className="text-zinc-300">//</span> GM</h1>
            </div>
            
            <div className="h-6 w-px bg-zinc-200 mx-2"></div>

            {!audioStarted ? (
                <button onClick={onStartAudio} className="group relative px-4 py-1.5 bg-white hover:bg-red-50 text-red-500 border border-red-200 hover:border-red-300 rounded text-xs font-bold uppercase tracking-wider transition-all overflow-hidden shadow-sm">
                    <span className="relative z-10">Init Audio Engine</span>
                </button>
            ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-600 font-mono shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    ENGINE ACTIVE
                </div>
            )}
            
             <button 
                onClick={onPanic}
                className="px-3 py-1.5 bg-white hover:bg-red-50 border border-zinc-200 hover:border-red-200 text-zinc-500 hover:text-red-500 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                title="Stop all sounds immediately"
             >
                Panic
             </button>

            <div className="flex gap-2">
                 <label className="cursor-pointer px-3 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded text-xs text-zinc-600 font-medium transition-all shadow-sm">
                    Load JSON
                    <input type="file" className="hidden" accept=".json" onChange={onImport} />
                 </label>
                 <button onClick={onExport} className="px-3 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded text-xs text-zinc-600 font-medium transition-all shadow-sm">
                    Save JSON
                 </button>
                 <a 
                    href="https://doux.livecoding.fr/reference/"
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="px-3 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded text-xs text-zinc-600 font-medium transition-all shadow-sm flex items-center"
                 >
                    REFERENCE
                 </a>
            </div>
        </div>
        
        <div className="flex items-center gap-3">
            <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">MIDI In</label>
            <div className="relative">
                <select 
                    value={selectedInputId} 
                    onChange={(e) => onSelectInput(e.target.value)}
                    className="appearance-none bg-white border border-zinc-200 hover:border-zinc-300 text-xs rounded px-3 py-1.5 pr-8 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-zinc-700 min-w-[150px] shadow-sm transition-all"
                >
                    <option value="">No Device</option>
                    {devices.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-[10px]">▼</div>
            </div>
        </div>
      </header>
    );
};
