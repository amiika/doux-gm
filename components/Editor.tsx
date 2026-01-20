
import React from 'react';
import { ChannelState } from '../types';
import { getNoteName } from '../utils/helpers';

interface EditorProps {
    channel: ChannelState;
    drumMap: Record<number, string>;
    lastTriggeredNote: number;
    onUpdateSyntax: (val: string) => void;
}

export const Editor = ({
    channel,
    drumMap,
    lastTriggeredNote,
    onUpdateSyntax
}: EditorProps) => {
    return (
        <div className="flex-1 flex flex-col bg-white relative group">
            <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-between px-4 bg-zinc-50/80 border-b border-zinc-100 backdrop-blur-sm z-10">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    Doux Syntax Editor
                    {channel.id === 9 && (
                        <span className="text-[9px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded border border-blue-200">
                            KEY: {getNoteName(lastTriggeredNote)}
                        </span>
                    )}
                </label>
                <div className="text-[9px] text-zinc-400 font-mono">
                   Use /param/value syntax
                </div>
            </div>
            
            <textarea
                value={channel.id === 9 ? (drumMap[lastTriggeredNote] || "") : channel.customSyntax}
                onChange={(e) => onUpdateSyntax(e.target.value)}
                className="flex-1 w-full bg-white text-blue-600 text-sm font-mono leading-relaxed outline-none p-4 pt-10 resize-none selection:bg-blue-100 placeholder-zinc-300"
                spellCheck={false}
                placeholder={channel.id === 9 ? "Select a drum key to edit sound..." : "Enter Doux code..."}
            />
        </div>
    );
};
