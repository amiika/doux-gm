
import React from 'react';
import { Instrument, ChannelState } from '../types';

interface InspectorProps {
    channel: ChannelState;
    instruments: Instrument[];
    isEditingName: boolean;
    setIsEditingName: (editing: boolean) => void;
    onProgramChange: (id: number) => void;
    onUpdateInstrument: (id: number, patch: Partial<Instrument>) => void;
    onRandomize: () => void;
    onReset: () => void;
    sampleLibraryUrl: string;
    onUpdateSampleLibrary: (url: string) => void;
    onLoadSamples: () => void;
    loading: boolean;
}

export const Inspector = ({
    channel,
    instruments,
    isEditingName,
    setIsEditingName,
    onProgramChange,
    onUpdateInstrument,
    onRandomize,
    onReset,
    sampleLibraryUrl,
    onUpdateSampleLibrary,
    onLoadSamples,
    loading
}: InspectorProps) => {
    return (
        <div className="w-64 bg-zinc-50/50 border-r border-zinc-200 p-4 flex flex-col gap-4 overflow-y-auto">
             <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 bg-zinc-400 rounded-sm"></span>
                    {channel.id === 9 ? 'Drum Channel' : `Channel ${channel.id + 1}`}
                </span>
             </div>
             
             {channel.id !== 9 ? (
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Instrument Preset</label>
                    <select 
                        value={channel.program}
                        onChange={(e) => onProgramChange(parseInt(e.target.value))}
                        className="w-full bg-white text-zinc-700 text-xs border border-zinc-300 rounded px-2 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 shadow-sm"
                    >
                        {instruments.map(inst => (
                            <option key={inst.id} value={inst.id}>
                                {inst.id + 1}. {inst.name}
                            </option>
                        ))}
                    </select>
                    
                    {/* Rename Input */}
                    {isEditingName && (
                         <input 
                            type="text"
                            autoFocus
                            value={instruments.find(i => i.id === channel.program)?.name || ''}
                            onChange={(e) => onUpdateInstrument(channel.program, { name: e.target.value })}
                            onKeyDown={(e) => { if(e.key === 'Enter') setIsEditingName(false); }}
                            className="w-full bg-white text-zinc-800 text-xs border border-blue-400 rounded px-2 py-1 outline-none mt-1 shadow-sm"
                            placeholder="Instrument Name"
                         />
                    )}

                    {/* Actions Row */}
                    <div className="flex gap-1 mt-1">
                         <button 
                            onClick={() => setIsEditingName(!isEditingName)}
                            className={`flex-1 px-2 py-1 border rounded text-[9px] uppercase tracking-wider transition-colors shadow-sm ${
                                isEditingName 
                                    ? 'bg-blue-50 text-blue-600 border-blue-200' 
                                    : 'bg-white text-zinc-500 border-zinc-300 hover:bg-zinc-50 hover:text-zinc-700'
                            }`}
                         >
                            {isEditingName ? 'Done' : 'Rename'}
                         </button>
                         <button 
                            onClick={onRandomize}
                            className="flex-1 px-2 py-1 bg-white text-zinc-500 border border-zinc-300 rounded text-[9px] uppercase tracking-wider hover:bg-zinc-50 hover:text-zinc-700 shadow-sm"
                            title="Generate random syntax for this category"
                         >
                            Randomize
                         </button>
                         <button 
                            onClick={onReset}
                            className="flex-1 px-2 py-1 bg-white text-zinc-500 border border-zinc-300 rounded text-[9px] uppercase tracking-wider hover:bg-red-50 hover:text-red-500 hover:border-red-200 shadow-sm"
                            title="Reset to factory default"
                         >
                            Reset
                         </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Sample Library</label>
                    <div className="flex gap-1">
                        <input 
                            type="text" 
                            value={sampleLibraryUrl}
                            onChange={(e) => onUpdateSampleLibrary(e.target.value)}
                            className="flex-1 bg-white border border-zinc-300 rounded text-[10px] px-2 py-1.5 outline-none focus:border-blue-500 text-zinc-700 placeholder-zinc-400 shadow-sm"
                            placeholder="github:user/repo"
                        />
                        <button 
                            onClick={onLoadSamples}
                            disabled={loading}
                            className="px-2 py-1 bg-zinc-100 text-zinc-600 border border-zinc-300 rounded text-[10px] hover:bg-zinc-200 hover:text-zinc-800 disabled:opacity-50 shadow-sm"
                        >
                            {loading ? '...' : 'Load'}
                        </button>
                    </div>
                    <div className="text-[9px] text-zinc-400">
                        Repo containing <code>strudel.json</code>
                    </div>
                    <div className="flex gap-1">
                         <button 
                            onClick={onReset}
                            className="w-full px-2 py-1 bg-white text-zinc-500 border border-zinc-300 rounded text-[9px] uppercase tracking-wider hover:bg-red-50 hover:text-red-500 hover:border-red-200 shadow-sm"
                         >
                            Reset Drum Map
                         </button>
                    </div>
                </div>
            )}
        </div>
    );
};
