
import React from 'react';
import { MidiDevice } from '../types';
import { parseMidiMessage, MIDI_COMMANDS } from '../utils/midiUtils';

export const useMidi = (
    onNoteOn: (channel: number, note: number, velocity: number) => void,
    onNoteOff: (channel: number, note: number) => void,
    onProgramChange: (channel: number, program: number) => void
) => {
    const [devices, setDevices] = React.useState<MidiDevice[]>([]);
    const [selectedInputId, setSelectedInputId] = React.useState<string>('');
    const midiAccessRef = React.useRef<any>(null);

    const updateDevices = (access: any) => {
        const inputs: MidiDevice[] = [];
        for (const input of access.inputs.values()) {
            inputs.push({
                id: input.id,
                name: input.name,
                manufacturer: input.manufacturer,
                state: input.state,
                connection: input.connection
            });
        }
        setDevices(inputs);
        if (inputs.length > 0 && !selectedInputId) {
            selectInput(inputs[0].id);
        }
    };

    const handleMidiMessage = (msg: any) => {
        const { command, channel, data1, data2 } = parseMidiMessage(msg.data);
        
        if (command === MIDI_COMMANDS.NOTE_ON && data2 > 0) {
            onNoteOn(channel, data1, data2);
        } else if (command === MIDI_COMMANDS.NOTE_OFF || (command === MIDI_COMMANDS.NOTE_ON && data2 === 0)) {
            onNoteOff(channel, data1);
        } else if (command === MIDI_COMMANDS.PROGRAM_CHANGE) {
            onProgramChange(channel, data1);
        }
    };

    const selectInput = (id: string) => {
        setSelectedInputId(id);
        const access = midiAccessRef.current;
        if (!access) return;
        for (const input of access.inputs.values()) {
            input.onmidimessage = null;
        }
        const input = access.inputs.get(id);
        if (input) {
            input.onmidimessage = handleMidiMessage;
        }
    };

    React.useEffect(() => {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then((access) => {
                midiAccessRef.current = access;
                updateDevices(access);
                access.onstatechange = () => updateDevices(access);
            }).catch(err => console.warn('MIDI access denied or failed', err));
        }
    }, []);

    // Re-attach listeners if the callback functions change (if needed)
    // In practice, we update the selected input if callbacks change to ensure they use latest refs
    React.useEffect(() => {
        if (selectedInputId) selectInput(selectedInputId);
    }, [onNoteOn, onNoteOff, onProgramChange]);

    return {
        devices,
        selectedInputId,
        selectInput
    };
};
