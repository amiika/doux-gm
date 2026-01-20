
import React, { PointerEvent } from 'react';
import { ChannelState } from '../types';

interface MixerProps {
    channels: ChannelState[];
    selectedChannelId: number;
    onSelectChannel: (id: number) => void;
    onUpdateChannel: (id: number, patch: Partial<ChannelState>) => void;
    onToggleMute: (id: number) => void;
}

export const Mixer = ({
    channels,
    selectedChannelId,
    onSelectChannel,
    onUpdateChannel,
    onToggleMute
}: MixerProps) => {

    const startVolumeDrag = (e: PointerEvent, id: number) => {
        e.preventDefault();
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        target.setPointerCapture(e.pointerId);
  
        const updateVol = (clientY: number) => {
            const height = rect.height;
            const relativeY = clientY - rect.top;
            const percent = 1 - (relativeY / height);
            const newVal = Math.max(0, Math.min(127, Math.floor(percent * 127)));
            onUpdateChannel(id, { volume: newVal });
        };
  
        updateVol(e.clientY);
        const onPointerMove = (ev: globalThis.PointerEvent) => updateVol(ev.clientY);
        const onPointerUp = (ev: globalThis.PointerEvent) => {
            target.releasePointerCapture(ev.pointerId);
            target.removeEventListener('pointermove', onPointerMove as any);
            target.removeEventListener('pointerup', onPointerUp as any);
        };
        target.addEventListener('pointermove', onPointerMove as any);
        target.addEventListener('pointerup', onPointerUp as any);
    };

    return (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-zinc-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white to-zinc-100">
            <div className="flex gap-3 h-full min-w-max mx-auto justify-center">
                {channels.map(ch => {
                    const isActive = selectedChannelId === ch.id;
                    const isDrum = ch.id === 9;
                    return (
                    <div 
                        key={ch.id} 
                        onClick={() => onSelectChannel(ch.id)}
                        className={`flex flex-col w-[88px] rounded-xl border relative overflow-hidden transition-all duration-200 cursor-pointer group ${
                            isActive 
                                ? 'bg-white border-blue-400 shadow-lg ring-1 ring-blue-100 translate-y-[-2px]' 
                                : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md'
                        }`}
                    >
                        {/* Channel Header */}
                        <div className={`p-3 text-center border-b border-zinc-100 ${isActive ? 'bg-blue-50' : ''}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isActive ? 'text-blue-600' : 'text-zinc-400'}`}>
                                {isDrum ? 'DRM' : `CH ${ch.id + 1}`}
                            </div>
                            {/* Activity LED */}
                            <div className={`w-1.5 h-1.5 rounded-full mx-auto transition-all duration-100 ${
                                ch.activeNotes.size > 0 
                                    ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] scale-125' 
                                    : 'bg-zinc-300'
                            }`}></div>
                        </div>

                        {/* Fader Section */}
                        <div className="flex-1 flex flex-col p-3 gap-4 items-center justify-center bg-gradient-to-b from-transparent to-zinc-50/50">
                            
                            {/* Volume Fader Track */}
                            <div className="flex flex-col items-center h-full w-full relative">
                                 <div 
                                    className="relative w-10 flex-1 bg-zinc-100 rounded-md border border-zinc-200 shadow-inner overflow-hidden cursor-ns-resize group/fader"
                                    onPointerDown={(e) => startVolumeDrag(e, ch.id)}
                                 >
                                    {/* Grid Lines */}
                                    <div className="absolute inset-0 flex flex-col justify-between py-2 px-1 opacity-20 pointer-events-none z-10">
                                        {[...Array(9)].map((_, i) => <div key={i} className="h-px bg-zinc-400 w-full"></div>)}
                                    </div>
                                    
                                    {/* Meter Level */}
                                    <div 
                                        className={`absolute bottom-0 left-0 right-0 transition-[height] duration-75 ease-out ${
                                            isActive ? 'bg-gradient-to-t from-blue-500 to-blue-300' : 'bg-gradient-to-t from-zinc-400 to-zinc-300'
                                        } opacity-80 group-hover/fader:opacity-100`}
                                        style={{ height: `${(ch.volume / 127) * 100}%` }}
                                    ></div>
                                    
                                    {/* Fader Handle */}
                                    <div 
                                        className="absolute left-0 right-0 h-4 bg-white border border-zinc-300 shadow-sm rounded-sm pointer-events-none flex items-center justify-center"
                                        style={{ bottom: `calc(${(ch.volume / 127) * 100}% - 8px)` }}
                                    >
                                        <div className="w-full h-px bg-zinc-300"></div>
                                    </div>
                                 </div>
                                 <span className="mt-2 text-[10px] font-mono text-zinc-400">{ch.volume}</span>
                            </div>

                            {/* Pan Control */}
                            <div className="flex flex-col items-center gap-1 w-full">
                                <span className="text-[8px] uppercase font-bold text-zinc-400 tracking-wider">Pan</span>
                                <div className="relative w-full h-4 flex items-center">
                                    <input 
                                        type="range" min="0" max="127" value={ch.pan}
                                        onChange={(e) => onUpdateChannel(ch.id, { pan: parseInt(e.target.value) })}
                                        className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-zinc-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-sm hover:[&::-webkit-slider-thumb]:bg-blue-400 hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                                    />
                                    {/* Center marker */}
                                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-300 -z-10"></div>
                                </div>
                            </div>
                        </div>

                        {/* Mute / Solo */}
                        <div className="flex border-t border-zinc-100">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggleMute(ch.id); }}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                                    ch.mute 
                                        ? 'bg-red-50 text-red-500 shadow-inner' 
                                        : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
                                }`}
                            >
                                Mute
                            </button>
                            <div className="w-px bg-zinc-100"></div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onUpdateChannel(ch.id, { solo: !ch.solo }); }}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                                    ch.solo 
                                        ? 'bg-yellow-50 text-yellow-500 shadow-inner' 
                                        : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
                                }`}
                            >
                                Solo
                            </button>
                        </div>
                    </div>
                )})}
            </div>
        </div>
    );
};
