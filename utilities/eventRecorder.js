/*
Needs to:
- Record changes of value as they happen
- Represent everything in a serializable json file
- Load in a json file to play back the actions using ccapture
- Be downloadable. Doesn't need to be uploadable for ccapture; I can just put the json file in the build

How to adapt this to work for the midi entry system in Max?
Will need:
- Quantization
- The ability to load in a custom function mapping?
*/

function download(filename, text) {
  const a = document.createElement('a')
  element.setAttribute(
    'href',
    'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
  )
  a.setAttribute('download', filename)

  a.style.display = 'none'
  document.body.appendChild(a)

  a.click()

  document.body.removeChild(a)
}

// Start file download.
// download('hello.txt', 'This is the content of my file :)')

class EventRecorder {}
