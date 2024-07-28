<script setup>
import { Vex } from 'vexflow';
import { onMounted, ref } from 'vue'
import { Midi } from '@tonejs/midi'

const { Renderer, Stave, StaveNote, Voice, Formatter } = Vex.Flow;

const inputRef = ref();

const triggerFileChose = () => {
  inputRef.value.click();
}

const handleChoseFile =  async (event) => {
  const file = event.target.files[0];
  console.log('files:', file);
  await transformMidi(file)
}

const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
};

const transformMidi = async (file) => {
  const arrayBuffer = await readFileAsArrayBuffer(file)
  console.log('arrayBuffer', arrayBuffer);
  const midiJson = new Midi(arrayBuffer);
  console.log('midiObject', midiJson);
  generateNotes(midiJson);
}

const generateNotes = (midiJson) => {
  const div = document.getElementById("sheet");
  const renderer = new Renderer(div, Renderer.Backends.SVG);

  renderer.resize(500, 500);
  const context = renderer.getContext();

  const stave = new Stave(10, 40, 400);

  stave.addClef("treble").addTimeSignature("4/4");

  stave.setContext(context).draw();
  const notes = [];
  midiJson.tracks.forEach((track) => {
    console.log('tracks:', track);
    const tracksNote = track.notes;
    notes.forEach((note) => {
      const key = note.pitch + '/' + note.octave + '';
      const duration = 'q';
      const item = new StaveNote({ keys: key, duration, });
      notes.push(item);
    })
  })
  const voice = new Voice({ num_beats: 4, beat_value: 4 });
      voice.addTickables(notes);

      // Format and justify the notes to 400 pixels.
      new Formatter().joinVoices([voice]).format([voice], 350);

    // Render voice
      voice.draw(context, stave);
}

onMounted(() => {

const div = document.getElementById("output");
const renderer = new Renderer(div, Renderer.Backends.SVG);

renderer.resize(500, 500);
const context = renderer.getContext();

const stave = new Stave(10, 40, 400);

stave.addClef("treble").addTimeSignature("4/4");

stave.setContext(context).draw();

// Create the notes
const notes = [
    // A quarter-note C.
    new StaveNote({ keys: ["c/4"], duration: "q" }),

    // A quarter-note D.
    new StaveNote({ keys: ["d/4"], duration: "q" }),

    // A quarter-note rest. Note that the key (b/4) specifies the vertical
    // position of the rest.
    new StaveNote({ keys: ["b/4"], duration: "qr" }),

    // A C-Major chord.
    new StaveNote({ keys: ["c/4", "e/4", "g/4"], duration: "q" }),
];

// Create a voice in 4/4 and add above notes
const voice = new Voice({ num_beats: 4, beat_value: 4 });
voice.addTickables(notes);

// Format and justify the notes to 400 pixels.
new Formatter().joinVoices([voice]).format([voice], 350);

// Render voice
voice.draw(context, stave);
})

</script>

<template>
  <div id='test'>
    <div>
      <button @click="triggerFileChose">上传midi文件
      </button>
      <input @change="handleChoseFile" ref="inputRef" type="file" accept=".mid,.midi" id="fileUpload" hidden />
    </div>
    <div id="output"></div>
    <div id="sheet"></div>
  </div>
</template>

<style scoped>
.test {
  display: flex;
  flex-direction: colum;
  align-items: center;
}
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
