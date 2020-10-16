import * as Tone from 'tone'

class BeeThree {
  constructor() {
    this.multC = new Tone.Multiply(0.25)

    this.osc1b = new Tone.Oscillator({ frequency: 0, type: 'sine' }).connect(
      this.multC
    )
    this.osc2b = new Tone.Oscillator({ frequency: 0, type: 'sine' }).connect(
      this.multC
    )
    this.osc3b = new Tone.Oscillator({ frequency: 0, type: 'sine' }).connect(
      this.multC
    )
    this.osc4b = new Tone.Oscillator({ frequency: 0, type: 'sine' }).connect(
      this.multC
    )

    this.add1 = new Tone.Add(0).connect(this.osc1b.frequency)
    this.add2 = new Tone.Add(0).connect(this.osc2b.frequency)
    this.add3 = new Tone.Add(0).connect(this.osc3b.frequency)
    this.add4 = new Tone.Add(0).connect(this.osc4b.frequency)

    this.mult1b = new Tone.Multiply(0).connect(this.add1.addend)
    this.mult2b = new Tone.Multiply(0).connect(this.add2.addend)
    this.mult3b = new Tone.Multiply(0).connect(this.add3.addend)
    this.mult4b = new Tone.Multiply(0).connect(this.add4.addend)

    this.osc1a = new Tone.Oscillator({ frequency: 0, type: 'sine' }).connect(
      this.mult1b
    )
    this.osc2a = new Tone.Oscillator({ frequency: 0, type: 'sine' }).connect(
      this.mult2b
    )
    this.osc3a = new Tone.Oscillator({ frequency: 0, type: 'sine' }).connect(
      this.mult3b
    )

    let vals = new Float32Array(44100)
    for (let i = 0; i < vals.length; i++) {
      let pos = i / vals.length
      if (pos <= 0.5) {
        const { abs, sin, PI } = Math
        vals[pos] = abs(sin(PI * pos * 4))
      } else {
        vals[pos] = 0.0
      }
    }
    let buffer = Tone.Buffer.fromArray(vals)
    this.fwavblnk = new Tone.BufferSource(buffer)
    this.fwavblnk.loop = true
    //this.fwavblnk.playbackRate = 6.009 * 440
    this.fwavblnk.connect(this.mult4b.input)

    this.mult1a = new Tone.Multiply(0.999)
      .connect(this.osc1a.frequency)
      .connect(this.mult1b.factor)
    this.mult2a = new Tone.Multiply(1.997)
      .connect(this.osc2a.frequency)
      .connect(this.mult2b.factor)
    this.mult3a = new Tone.Multiply(3.006)
      .connect(this.osc3a.frequency)
      .connect(this.mult3b.factor)
    this.mult4a = new Tone.Multiply(6.009).connect(this.mult4b.factor)

    this.frequency = new Tone.Signal({ value: 440, units: 'frequency' })
      .connect(this.mult1a)
      .connect(this.mult2a)
      .connect(this.mult3a)
      .connect(this.mult4a)

    Tone.Transport.scheduleRepeat(() => {
      this.fwavblnk.playbackRate = this.frequency.value
    }, '0.1')
  }

  start() {
    this.osc1a.start()
    this.osc2a.start()
    this.osc3a.start()
    this.fwavblnk.start()
    this.osc1b.start()
    this.osc2b.start()
    this.osc3b.start()
    this.osc4b.start()
  }

  connect(node) {
    this.multC.connect(node)
  }
}
// ~~~

const reverbCrossFade = new Tone.CrossFade(0).toDestination()
const reverb = new Tone.Reverb(10).connect(reverbCrossFade.b)
const totalGain = new Tone.Gain(0.75).connect(reverb).connect(reverbCrossFade.a)

// ~~~

const bee3Gain = new Tone.Gain(0.75).connect(totalGain)
const highpass = new Tone.BiquadFilter(1500, 'highpass').connect(bee3Gain)
const bee3a = new BeeThree()
const bee3b = new BeeThree()
const mult = new Tone.Multiply(0.5 + Math.random()).connect(bee3b.frequency)
bee3a.frequency.connect(mult)

bee3a.connect(highpass)
bee3b.connect(highpass)

// ~~~

const noiseGain = new Tone.Gain(0.75).connect(totalGain)
const lowpass = new Tone.BiquadFilter(1500, 'lowpass').connect(noiseGain)
const noiseCrossFade = new Tone.CrossFade(0).connect(lowpass.frequency)
const noise = new Tone.Noise('pink').connect(lowpass)
const lfo = new Tone.LFO('0.1', 500, 1500).connect(noiseCrossFade.a)
const randSig = new Tone.Signal(500, 'frequency').connect(noiseCrossFade.b)

Tone.Transport.scheduleRepeat(() => {
  randSig.linearRampTo(500 + Math.random() * 1000, '4')
}, '4')

// ~~~

Tone.Transport.scheduleRepeat(() => {
  bee3a.frequency.linearRampTo(50 + Math.random() * 150, '1000')
  mult.factor.linearRampTo(0.5 + Math.random(), '1000')
}, '1000')

const keyDown = (e) => {
  Tone.context.resume().then(() => {
    bee3a.start()
    bee3b.start()
    noise.start()
    lfo.start()
    randSig.start()
    Tone.Transport.start()
  })
}

window.addEventListener('keydown', keyDown)
