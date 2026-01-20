
import React, { useEffect, useState, InputHTMLAttributes, HTMLAttributes } from 'react';
import { Header } from './components/Header';
import { Mixer } from './components/Mixer';
import { Inspector } from './components/Inspector';
import { Editor } from './components/Editor';
import { KeyboardArea } from './components/KeyboardArea';

import { useProject } from './hooks/useProject';
import { useAudio } from './hooks/useAudio';
import { useMidi } from './hooks/useMidi';
import { useKeyboard } from './hooks/useKeyboard';

const App = () => {
  // 1. State Management Hook
  const project = useProject();
  
  // 2. Audio Engine Hook (Needs refs to state to play correct sounds)
  const audio = useAudio(project.channelsRef, project.drumMapRef);

  // Local UI State
  const [selectedChannelId, setSelectedChannelId] = useState<number>(0);
  const [lastTriggeredNote, setLastTriggeredNote] = useState<number>(36); 
  const [isEditingName, setIsEditingName] = useState(false);

  // --- Logic Coordinators ---

  const handleNoteOn = (channelId: number, note: number, velocity: number = 100) => {
      // 1. Update Visuals
      project.setChannelActiveNote(channelId, note, true);
      
      // 2. Trigger Audio
      audio.triggerNoteOn(channelId, note, velocity);

      // 3. Update Editor Context
      if (channelId === 9 || channelId === selectedChannelId) {
          setLastTriggeredNote(note);
      }
  };

  const handleNoteOff = (channelId: number, note: number) => {
      project.setChannelActiveNote(channelId, note, false);
      audio.triggerNoteOff(channelId, note);
  };

  const handlePanic = () => {
      audio.panic();
      project.clearAllActiveNotes();
  };

  const handleProgramChange = (channelId: number, program: number) => {
      // Silence existing notes before changing sound
      audio.silenceChannel(channelId);
      setIsEditingName(false);
      project.handleProgramChange(channelId, program);
  };

  const handleResetWrapper = () => {
      project.handleReset(selectedChannelId);
      setIsEditingName(false);
  };
  
  const toggleMute = (channelId: number) => {
      const ch = project.channels[channelId];
      if (!ch.mute) {
          audio.silenceChannel(channelId);
          project.updateChannel(channelId, { mute: true, activeNotes: new Set() });
      } else {
          project.updateChannel(channelId, { mute: false });
      }
  };

  // 3. MIDI Hook
  const midi = useMidi(handleNoteOn, handleNoteOff, handleProgramChange);

  // 4. Keyboard Hook
  useKeyboard(
      selectedChannelId,
      (note) => handleNoteOn(selectedChannelId, note),
      (note) => handleNoteOff(selectedChannelId, note)
  );

  // Global Auto-Start Audio on interaction
  useEffect(() => {
    const handleUserGesture = async () => {
        if (!audio.audioStarted) {
            await audio.startAudio();
        }
    };
    window.addEventListener('click', handleUserGesture);
    window.addEventListener('pointerdown', handleUserGesture);
    window.addEventListener('keydown', handleUserGesture);
    return () => {
        window.removeEventListener('click', handleUserGesture);
        window.removeEventListener('pointerdown', handleUserGesture);
        window.removeEventListener('keydown', handleUserGesture);
    };
  }, [audio.audioStarted, audio.startAudio]);

  const currentChannel = project.channels[selectedChannelId];

  return (
    <div className="flex flex-col h-screen bg-zinc-50 text-zinc-800 font-sans selection:bg-blue-200">
      <Header 
        audioStarted={audio.audioStarted}
        loading={audio.loading}
        devices={midi.devices}
        selectedInputId={midi.selectedInputId}
        onStartAudio={audio.startAudio}
        onPanic={handlePanic}
        onImport={project.handleImport}
        onExport={project.handleExport}
        onSelectInput={midi.selectInput}
      />

      <Mixer 
        channels={project.channels}
        selectedChannelId={selectedChannelId}
        onSelectChannel={setSelectedChannelId}
        onUpdateChannel={project.updateChannel}
        onToggleMute={toggleMute}
      />

      {/* Channel Inspector / Editor */}
      <div className="bg-white border-t border-zinc-200 shadow-[0_-5px_30px_rgba(0,0,0,0.05)] z-10">
        <div className="flex h-48">
            <Inspector 
                channel={currentChannel}
                instruments={project.instruments}
                isEditingName={isEditingName}
                setIsEditingName={setIsEditingName}
                onProgramChange={(pid) => handleProgramChange(currentChannel.id, pid)}
                onUpdateInstrument={project.updateInstrument}
                onRandomize={() => project.handleRandomize(selectedChannelId)}
                onReset={handleResetWrapper}
                sampleLibraryUrl={project.sampleLibraryUrl}
                onUpdateSampleLibrary={project.setSampleLibraryUrl}
                onLoadSamples={() => audio.loadSamples(project.sampleLibraryUrl)}
                loading={audio.loading}
            />

            <Editor 
                channel={currentChannel}
                drumMap={project.drumMap}
                lastTriggeredNote={lastTriggeredNote}
                onUpdateSyntax={(val) => {
                    if (currentChannel.id === 9) {
                        project.updateDrumMap(lastTriggeredNote, val);
                    } else {
                        project.updateChannel(currentChannel.id, { customSyntax: val });
                        if (currentChannel.id !== 9) {
                            project.updateInstrument(currentChannel.program, { syntax: val });
                        }
                    }
                }}
            />
        </div>
      </div>
      
      <KeyboardArea 
        channel={currentChannel}
        instrumentName={project.instruments.find(i => i.id === project.channels[selectedChannelId].program)?.name}
        lastTriggeredNote={lastTriggeredNote}
        onNoteOn={(n) => handleNoteOn(selectedChannelId, n)}
        onNoteOff={(n) => handleNoteOff(selectedChannelId, n)}
        loading={audio.loading}
      />
    </div>
  );
};

export default App;
