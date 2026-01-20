
export const generateRandomSyntax = (category: string): string => {
    const r = (min: number, max: number) => Math.random() * (max - min) + min;
    const ri = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
    const rb = (chance: number = 0.5) => Math.random() < chance;
    
    let params: string[] = [];
    
    // Base Oscillators
    // 'fm2' is a 2-operator FM synth, often good for complex tones
    const oscillators = ['sine', 'tri', 'saw', 'square', 'pulse', 'fm2'];
    let sound = ri(oscillators);

    // Default Envelopes
    let attack = 0.01;
    let decay = 0.5;
    let sustain = 0.5;
    let release = 0.5;

    switch(category) {
        case 'Piano':
            // Electric Piano / Keys style
            if (rb(0.6)) { 
                sound = 'fm2'; 
                // FM ratios for bell/tine sounds
                params.push(`/fmh/${ri([1, 2, 4, 14])}`);
                params.push(`/fm/${r(1, 5).toFixed(1)}`);
                params.push(`/fmd/${r(0.5, 2).toFixed(2)}`);
            } else {
                sound = ri(['tri', 'pulse']);
                if (sound === 'pulse') params.push(`/pw/${r(0.2, 0.4).toFixed(2)}`);
            }
            attack = r(0.001, 0.02);
            decay = r(0.5, 2.5);
            sustain = 0; // Pianos don't infinite sustain usually
            release = r(0.3, 0.8);
            
            params.push(`/lpf/${r(800, 5000).toFixed(0)}`);
            
            // Tremolo (AM) or Chorus
            if (rb(0.4)) {
                // Tremolo
                params.push(`/am/${r(2, 6).toFixed(1)}/amdepth/${r(0.3, 0.8).toFixed(2)}`);
            } else if (rb(0.5)) {
                // Chorus
                params.push(`/chorus/${r(0.2, 0.8).toFixed(2)}/chorusdepth/${r(0.3, 0.6).toFixed(2)}`);
            }
            break;

        case 'Bass':
            sound = ri(['saw', 'square', 'pulse', 'fm2', 'tri']);
            attack = 0.01;
            decay = r(0.2, 0.8);
            sustain = r(0.4, 0.9);
            release = r(0.1, 0.3);

            if (sound === 'pulse') params.push(`/pw/${r(0.05, 0.5).toFixed(2)}`);
            
            // Filter is crucial for bass
            const filterFreq = r(200, 1500);
            params.push(`/lpf/${filterFreq.toFixed(0)}`);
            params.push(`/lpq/${r(0.2, 0.8).toFixed(2)}`); // Resonance
            
            // Filter Envelope
            if (rb(0.7)) {
                params.push(`/lpe/${r(500, 3000).toFixed(0)}`);
                params.push(`/lpd/${r(0.1, 0.4).toFixed(2)}`);
            }

            // Distort / Crush
            if (rb(0.3)) params.push(`/distort/${r(2, 8).toFixed(1)}`);
            if (rb(0.2)) params.push(`/crush/${ri([4, 6, 8])}`);
            break;

        case 'Strings':
            sound = ri(['saw', 'square']); // PWM strings are cool too
            if (sound === 'square') { sound = 'pulse'; params.push(`/pw/${r(0.1, 0.9).toFixed(2)}`); }
            
            attack = r(0.2, 1.0);
            decay = r(0.2, 1.0);
            sustain = r(0.6, 1.0);
            release = r(0.8, 2.5);

            params.push(`/lpf/${r(1500, 6000).toFixed(0)}`);
            
            // Vibrato (pitch modulation)
            params.push(`/vib/${r(4, 7).toFixed(1)}`);
            params.push(`/vibmod/${r(0.15, 0.3).toFixed(2)}`);
            
            // Ensemble effect
            params.push(`/chorus/${r(0.5, 3).toFixed(1)}`);
            params.push(`/chorusdepth/${r(0.5, 0.8).toFixed(2)}`);
            break;

        case 'Synth Pad':
            sound = ri(['saw', 'tri', 'pulse', 'white']);
            attack = r(0.5, 3.0);
            decay = 2.0;
            sustain = 1.0;
            release = r(1.5, 4.0);

            if (sound === 'white') {
                // Windy / Airy pad
                params.push(`/lpf/${r(400, 1500).toFixed(0)}`);
                params.push(`/lpq/0.6`);
            } else {
                params.push(`/lpf/${r(400, 3000).toFixed(0)}`);
                // Slow filter sweep
                if(rb(0.6)) {
                    params.push(`/lpe/${r(500, 2000).toFixed(0)}`);
                    params.push(`/lpa/${r(1, 4).toFixed(1)}`); // slow attack on filter
                }
            }
            
            // Movement: Phaser or Flanger
            if (rb(0.4)) {
                params.push(`/phaser/${r(0.1, 1).toFixed(2)}`);
                params.push(`/phaserdepth/0.7`);
                params.push(`/phasersweep/${r(500, 2000).toFixed(0)}`);
            } else if (rb(0.4)) {
                params.push(`/flanger/${r(0.1, 0.5).toFixed(2)}`);
                params.push(`/flangerdepth/0.8`);
                params.push(`/flangerfeedback/0.6`);
            }

            // Big Reverb
            params.push(`/verb/0.5`);
            params.push(`/verbdecay/${r(0.7, 0.98).toFixed(2)}`);
            params.push(`/verbdiff/0.8`);
            break;

        case 'Synth Lead':
            sound = ri(['saw', 'square', 'pulse', 'fm2']);
            attack = r(0.005, 0.05);
            decay = 0.2;
            sustain = r(0.6, 1.0);
            release = r(0.2, 0.6);

            // Glide (Portamento)
            if (rb(0.5)) params.push(`/glide/${r(0.05, 0.3).toFixed(2)}`);
            
            // Delay
            params.push(`/delay/${r(0.3, 0.5).toFixed(2)}`);
            params.push(`/delaytime/${r(0.15, 0.5).toFixed(2)}`);
            params.push(`/delayfeedback/0.5`);

            // Aggressive timbre
            if (rb(0.3)) params.push(`/distort/${r(2, 15).toFixed(1)}`);
            if (rb(0.3)) params.push(`/vib/6/vibmod/${r(0.2, 0.8).toFixed(2)}`);
            break;
            
        case 'Chromatic Percussion':
        case 'Percussive':
        case 'Ethnic':
            // FM is great for bells, marimbas
            if (rb(0.7)) {
                sound = 'fm2';
                // Non-integer ratios for metallic sounds
                const ratio = ri([1.0, 1.41, 1.5, 2.0, 2.5, 3.14]); 
                params.push(`/fmh/${ratio}`);
                params.push(`/fm/${r(2, 10).toFixed(1)}`);
                params.push(`/fmd/${r(0.1, 0.8).toFixed(2)}`); // FM decay
            } else {
                sound = ri(['sine', 'tri']);
            }
            attack = 0.005;
            decay = r(0.2, 1.5);
            sustain = 0;
            release = r(0.1, 1.0);
            break;

        case 'Organ':
             sound = ri(['saw', 'tri', 'square']);
             // Stack oscillators simulated via chorus or just rich waves
             if (sound === 'square') { sound = 'pulse'; params.push(`/pw/${r(0.1, 0.4).toFixed(2)}`); }
             
             attack = 0.04;
             sustain = 1.0;
             release = 0.1;
             
             params.push(`/lpf/${r(1500, 6000).toFixed(0)}`);
             
             // Leslie speaker simulation (Vibrato + Tremolo ish)
             const rate = r(4, 8).toFixed(1);
             params.push(`/vib/${rate}/vibmod/${r(0.1, 0.3).toFixed(2)}`);
             break;

        case 'Sound Effects':
             sound = ri(['white', 'pink', 'fm2', 'saw']);
             attack = r(0.01, 2);
             decay = r(0.1, 2);
             sustain = r(0, 1);
             release = r(0.1, 3);
             
             // Sci-Fi modulation
             if (rb(0.5)) params.push(`/rm/${r(100, 2000).toFixed(0)}/rmdepth/${r(0.5, 1).toFixed(2)}`); // Ring Mod
             if (rb(0.5)) params.push(`/am/${r(10, 100).toFixed(0)}/amdepth/${r(0.5, 1).toFixed(2)}`); // Fast AM
             if (rb(0.5)) params.push(`/crush/${ri([2,3,4,8])}`); // Bitcrush
             if (rb(0.5)) params.push(`/phaser/${r(1, 20).toFixed(1)}/phaserdepth/0.9`);
             
             // Pitch envelope
             if (rb(0.4)) {
                 params.push(`/penv/${r(-24, 24).toFixed(0)}`);
                 params.push(`/pdec/${r(0.1, 1).toFixed(2)}`);
             }
             break;

        default:
             // Generic random synth
             sound = ri(['saw', 'tri', 'pulse', 'fm2']);
             attack = r(0.01, 0.1);
             decay = r(0.1, 1);
             sustain = r(0.4, 0.8);
             release = r(0.1, 1);
             params.push(`/lpf/${r(500, 8000).toFixed(0)}`);
    }

    let syntax = `/sound/${sound}`;
    syntax += `/attack/${attack.toFixed(3)}`;
    syntax += `/decay/${decay.toFixed(2)}`;
    syntax += `/sustain/${sustain.toFixed(2)}`;
    syntax += `/release/${release.toFixed(2)}`;
    
    if (params.length > 0) {
        syntax += params.join('');
    }
    
    // Global chance for reverb if not explicitly added (and if category isn't dry like bass usually)
    if (category !== 'Bass' && !syntax.includes('/verb/')) {
         if (rb(0.3)) syntax += `/verb/0.3/verbdecay/0.7`;
    }

    return syntax;
};
