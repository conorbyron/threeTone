import Tone from 'tone'

function scaleGenerator(pattern) {
  const partialSums = pattern.reduce(
    (arr, val) => [...arr, arr[arr.length - 1] + val],
    [0]
  )

  const totalSum = partialSums[partialSums.length - 1]

  const scale = index => {
    const course = Math.floor(index / pattern.length) * totalSum
    const fine = partialSums[index % pattern.length]
    return course + fine
  }

  return scale
}

const pickNFromMGenerator = m => {
  function shuffle(arr) {
    let currentIndex = arr.length
    let temporaryValue
    let randomIndex
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex -= 1
      temporaryValue = arr[currentIndex]
      arr[currentIndex] = arr[randomIndex]
      arr[randomIndex] = temporaryValue
    }
    return arr
  }

  let values = []

  for (let i = 0; i < m; i++) {
    values.push(i)
  }

  const pickNFromM = n => {
    return shuffle(values).slice(0, n)
  }

  return pickNFromM
}

const scale = scaleGenerator([3, 2, 2, 3, 2])

const pickNFrom16 = pickNFromMGenerator(16)

let gain = new Tone.Gain(0.01).toMaster()

class CompleteVoice {
  constructor(buffer) {
    this.ramp = new Tone.BufferSource(buffer)
    this.ramp.loop = true
    this.ramp.playbackRate.value = 0.25
    this.filter = new Tone.Filter()
    this.filter.Q.value = 15
    this.ramp.connect(this.filter.frequency)
    this.osc = new Tone.Oscillator(440, 'square').connect(this.filter)
    this.meter = new Tone.Meter(0.0)
    this.ramp.connect(this.meter)
  }

  start() {
    this.osc.start()
    if (this.ramp.state != 'started') this.ramp.start()
  }

  rampTo(value, time) {
    this.osc.frequency.linearRampTo(value, time)
  }

  connect(node) {
    this.filter.connect(node)
  }

  getMeter() {
    return this.meter.getValue()
  }

  getFrequency() {
    return this.osc.frequency.value
  }
}

let vals = new Float32Array(44100)
for (let i = 0; i < 44100; i++) {
  let pos = i / 44100
  if (pos < 0.7) vals[i] = pos / 0.7
  else vals[i] = 1 - (pos - 0.7) / 0.3
  vals[i] *= 1250
}
let buffer = Tone.Buffer.fromArray(vals)
let voices = []
for (let i = 0; i < 4; i++) {
  let voice = new CompleteVoice(buffer)
  voice.connect(gain)
  voices.push(voice)
}

const keyDown = e => {
  Tone.context.resume().then(() => {
    Tone.Transport.start()
    voices.forEach(voice => {
      voice.start()
    })
    voices.forEach(voice => {
      console.log(voice)
    })
  })
}

window.addEventListener('keydown', keyDown)

const loopTime = 4
const rampTime = 1.5

let loop = new Tone.Loop(time => {
  const numbers = pickNFrom16(4).sort((a, b) => a - b)
  console.log(numbers)
  const notes = numbers.map(el => Tone.Frequency.mtof(scale(el) + 40))
  voices.forEach((voice, i) => {
    voice.rampTo(notes[i], rampTime)
  })
}, loopTime).start(0)

/*
setInterval(() => {
  console.log(
    meter1.getValue() +
      ' ' +
      meter2.getValue() +
      ' ' +
      meter3.getValue() +
      ' ' +
      meter4.getValue()
  )
}, 1000 / 60)
*/
