
import React from 'react';
import { doux, douxsamples } from '../doux';
import { VoiceAllocator } from '../utils/voiceAllocator';
import { DouxEvent, ChannelState } from '../types';
import { INITIAL_PROJECT } from '../constants';

export const useAudio = (
    channelsRef: { current: ChannelState[] },
    drumMapRef: { current: Record<number, string> }
) => {
    const [audioStarted, setAudioStarted] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const voiceAllocator = React.useRef(new VoiceAllocator());

    // Initialize Engine
    React.useEffect(() => {
        const init = async () => {
            try {
                await doux.ready;
                setLoading(false);
                console.log("Doux engine ready");
            } catch (e) {
                console.error("Failed to load Doux engine", e);
            }
        };
        init();
    }, []);

    const startAudio = async () => {
        await doux.resume();
        setAudioStarted(true);
    };

    const loadSamples = async (url: string) => {
        setLoading(true);
        try {
            console.log(`Loading samples from: ${url}`);
            await douxsamples(url);
        } catch (e) {
            console.error("Failed to load samples", e);
            alert("Failed to load sample map.");
        } finally {
            setLoading(false);
        }
    };

    const triggerNoteOn = (channelId: number, note: number, velocity: number = 100) => {
        const ch = channelsRef.current[channelId];
        if (ch.mute) return;

        const voiceId = voiceAllocator.current.allocate(channelId, note);
        const isDrum = channelId === 9;
        
        console.log(`[NoteOn] Ch: ${channelId}, Note: ${note}, Voice: ${voiceId}`);
    
        let baseSettings: Partial<DouxEvent> = {};
        
        if (isDrum) {
            const drumString = drumMapRef.current[note] || "/sound/silence";
            baseSettings = doux.parsePath(drumString);
        } else {
            try {
                baseSettings = doux.parsePath(ch.customSyntax);
            } catch (e) {
                console.warn("Invalid Doux syntax", channelId);
                baseSettings = doux.parsePath(INITIAL_PROJECT.instruments[0].syntax);
            }
        }
        
        const event: DouxEvent = {
            voice: voiceId,
            ...baseSettings,
            note: isDrum ? undefined : note,
            velocity: velocity / 127,
            gain: (ch.volume / 127) * (isDrum ? 2.0 : 1.5),
            pan: ch.pan / 127,
            reset: 1,
        };
        
        doux.evaluate(event);
    };

    const triggerNoteOff = (channelId: number, note: number) => {
        const isDrum = channelId === 9;
        const activeIndices = voiceAllocator.current.findActive(channelId, note);

        activeIndices.forEach(idx => {
            if (!isDrum) {
                  doux.evaluate({
                     voice: idx,
                     sustain: 0,
                     decay: 0.25,
                 });
            }
            voiceAllocator.current.release(idx);
        });
    };

    const silenceChannel = (channelId: number) => {
        const activeIndices = voiceAllocator.current.findActiveByChannel(channelId);
        activeIndices.forEach(idx => {
            doux.evaluate({
                voice: idx,
                gain: 0, 
                sustain: 0,
                decay: 0.05
            });
            voiceAllocator.current.release(idx);
        });
    };

    const panic = async () => {
        console.log("[Panic] Killing all audio");
        await doux.panic();
        voiceAllocator.current.reset();
    };

    return {
        audioStarted,
        loading,
        startAudio,
        loadSamples,
        triggerNoteOn,
        triggerNoteOff,
        silenceChannel,
        panic
    };
};
