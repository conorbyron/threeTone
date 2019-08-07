import Tone from 'tone';

let fmSynth = new Tone.FMSynth({
  harmonicity: 3,
  modulationIndex: 2,
  detune: 0,
  oscillator: {
    type: 'sine'
  },
  envelope: {
    attack: 0.0,
    decay: 0.0,
    sustain: 1,
    release: 0
  },
  modulation: {
    type: 'sine'
  },
  modulationEnvelope: {
    attack: 0,
    decay: 0,
    sustain: 1,
    release: 0
  }
}).toMaster();

const keyDown = e => {
  Tone.context.resume().then(() => {
    Tone.Transport.start();
    fmSynth.triggerAttack('C5');
    fmSynth.harmonicity.linearRampToValueAtTime(0.01, '+10');
  });
};

window.addEventListener('keydown', keyDown);
