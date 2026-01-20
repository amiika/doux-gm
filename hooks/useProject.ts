
import React from 'react';
import { Instrument, ChannelState } from '../types';
import { INITIAL_PROJECT } from '../constants';
import { generateRandomSyntax } from '../utils/randomizeUtils';

const STORAGE_KEY = 'doux_synth_config_v1';

export const useProject = () => {
    const [instruments, setInstruments] = React.useState<Instrument[]>(INITIAL_PROJECT.instruments);
    const [channels, setChannels] = React.useState<ChannelState[]>(() => 
        (INITIAL_PROJECT.channels as any[]).map(ch => ({ ...ch, activeNotes: new Set() }))
    );
    const [drumMap, setDrumMap] = React.useState<Record<number, string>>({ ...INITIAL_PROJECT.drumMap });
    const [sampleLibraryUrl, setSampleLibraryUrl] = React.useState<string>(INITIAL_PROJECT.sampleLibraryUrl);
    
    // Refs for accessing latest state in callbacks without dependencies
    const channelsRef = React.useRef(channels);
    const drumMapRef = React.useRef(drumMap);
    const instrumentsRef = React.useRef(instruments);

    React.useEffect(() => {
        channelsRef.current = channels;
    }, [channels]);
    
    React.useEffect(() => {
        drumMapRef.current = drumMap;
    }, [drumMap]);
    
    React.useEffect(() => {
        instrumentsRef.current = instruments;
    }, [instruments]);

    // --- Persistence ---
    React.useEffect(() => {
        const loadSettings = async () => {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    if (data.instruments) setInstruments(data.instruments);
                    if (data.channels) {
                        setChannels(data.channels.map((ch: any) => ({
                            ...ch,
                            activeNotes: new Set()
                        })));
                    }
                    if (data.drumMap) setDrumMap(data.drumMap);
                    if (data.sampleLibraryUrl) setSampleLibraryUrl(data.sampleLibraryUrl);
                } catch (e) {
                    console.error("Failed to load settings", e);
                }
            }
        };
        loadSettings();
    }, []);

    React.useEffect(() => {
        const config = { channels, drumMap, sampleLibraryUrl, instruments };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }, [channels, drumMap, sampleLibraryUrl, instruments]);

    // --- Actions ---

    const updateChannel = (id: number, patch: Partial<ChannelState>) => {
        setChannels(prev => {
            const next = [...prev];
            next[id] = { ...next[id], ...patch };
            return next;
        });
    };

    const updateInstrument = (id: number, changes: Partial<Instrument>) => {
        setInstruments(prev => prev.map(inst => 
            inst.id === id ? { ...inst, ...changes } : inst
        ));
    };

    const updateDrumMap = (note: number, syntax: string) => {
        setDrumMap(prev => ({ ...prev, [note]: syntax }));
    };

    const setChannelActiveNote = (channelId: number, note: number, on: boolean) => {
        setChannels(prev => {
            const next = [...prev];
            const newSet = new Set(next[channelId].activeNotes);
            if (on) newSet.add(note);
            else newSet.delete(note);
            next[channelId] = { ...next[channelId], activeNotes: newSet };
            return next;
        });
    };
    
    const clearAllActiveNotes = () => {
        setChannels(prev => prev.map(ch => ({ ...ch, activeNotes: new Set() })));
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                if (data.instruments) setInstruments(data.instruments);
                if (data.channels) {
                    setChannels(data.channels.map((ch: any) => ({ ...ch, activeNotes: new Set() })));
                }
                if (data.drumMap) setDrumMap(data.drumMap);
                if (data.sampleLibraryUrl) setSampleLibraryUrl(data.sampleLibraryUrl);
                alert("Configuration loaded successfully!");
            } catch (err) {
                console.error(err);
                alert("Failed to parse configuration file.");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleExport = () => {
        const config = { channels, drumMap, sampleLibraryUrl, instruments };
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'doux-synth-config.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleRandomize = (channelId: number) => {
        if (channels[channelId].id === 9) return;
        const inst = instruments.find(i => i.id === channels[channelId].program);
        if (!inst) return;
        
        const newSyntax = generateRandomSyntax(inst.category);
        updateInstrument(inst.id, { syntax: newSyntax });
        updateChannel(channelId, { customSyntax: newSyntax });
    };

    const handleReset = (channelId: number) => {
        if (channels[channelId].id === 9) {
            setDrumMap({ ...INITIAL_PROJECT.drumMap });
            return;
        }
        const programId = channels[channelId].program;
        const originalInst = INITIAL_PROJECT.instruments.find(i => i.id === programId);
        
        if (originalInst) {
            updateInstrument(programId, { 
                name: originalInst.name, 
                syntax: originalInst.syntax,
                category: originalInst.category
            });
            updateChannel(channelId, { customSyntax: originalInst.syntax });
        }
    };

    const handleProgramChange = (channelId: number, program: number) => {
        if (channelId !== 9) {
            const inst = instrumentsRef.current.find(i => i.id === program);
            const presetString = inst ? inst.syntax : "";
            setChannels(prev => {
                const next = [...prev];
                next[channelId] = { 
                    ...next[channelId], 
                    program, 
                    customSyntax: presetString,
                    activeNotes: new Set() 
                };
                return next;
            });
        }
    };

    return {
        instruments,
        channels,
        drumMap,
        sampleLibraryUrl,
        setSampleLibraryUrl,
        updateChannel,
        updateInstrument,
        updateDrumMap,
        setChannelActiveNote,
        clearAllActiveNotes,
        handleImport,
        handleExport,
        handleRandomize,
        handleReset,
        handleProgramChange,
        channelsRef,
        drumMapRef,
        instrumentsRef
    };
};
