<script setup>
import { Vex } from 'vexflow';
import { onMounted, ref } from 'vue'
import { Midi } from '@tonejs/midi'

const { Renderer, Stave, StaveNote, Voice, Formatter,Barline,TickContext } = Vex.Flow;

//const notes = ref([])

const inputRef = ref();

// 定义音符时值枚举对象
const NoteDurations = Object.freeze({
  1: 'q',   // 四分音符
  0.5: '8', // 八分音符
  0.25: '16', // 十六分音符
  2: 'h',   // 二分音符
  4: 'w'    // 全音符
});

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

// 计算近似值，处理duration
const approximateToSet = (value, targetSet) => {
  return targetSet.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );
}

const generateNotes = (midi) => { 
    console.log("midi:", midi)

    const header = midi.header
    const keySignature = header.keySignatures[0].key
    const timeSignature1 = header.timeSignatures[0].timeSignature[0]
    const timeSignature2 = header.timeSignatures[0].timeSignature[1]
    const ppq = header.ppq 

      // 获取第一个轨道的音符
    const track1 = midi.tracks[0];
    const notes1 = track1.notes;

    let noteMap1 = new Map();
    notes1.forEach(note => {
      //console.log('note:',note)
      const tick = note.ticks;
  
      // 检查 Map 中是否已有该 tick 的键
      if (noteMap1.has(tick)) {
        // 如果有，获取现有的数组并添加新的 note
        noteMap1.get(tick).push(note);
      } else {
        // 如果没有，创建一个新的数组，并添加到 Map 中
        noteMap1.set(tick, [note]);
      }
    });

    console.log('noteMap:',noteMap1)
    
    const length1 = noteMap1.size
    // 一行的音符个数 
    const note_num = 24
    const stave_num = Math.ceil(length1 / note_num)

    console.log('stave_num:',stave_num)

    // 按照一行的note数量控制宽度
    const canvasWidth = note_num * 50;
    // 按照stave的个数控制render的长度
    const canvasHeight = stave_num * 130
    
    // 使用 VexFlow 渲染五线谱
    const div = document.getElementById("sheet");
    const renderer = new Renderer(div, Renderer.Backends.SVG);
    renderer.resize(canvasWidth, canvasHeight);
    const context = renderer.getContext();
    context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");

    let vexNotes = [];
    noteMap1.forEach((noteArray, tick) => {
      let keysArray = []
      const durationTicks = noteArray[0].durationTicks
      const targetValues = [0.25, 0.5, 1, 2, 4];
      let result = durationTicks/ppq
      let approximatedResult = approximateToSet(result, targetValues);

      noteArray.forEach(note => {
          keysArray.push(`${note.pitch}/${note.octave}`)
      });
      console.log(keysArray)
      // 创建 VexFlow 的 StaveNote
      const staveNote = new StaveNote({
        keys: keysArray, 
        duration: NoteDurations[approximatedResult]
      });

      // 添加到 notes 数组
      vexNotes.push(staveNote);
    });

    console.log('vexNotes:',vexNotes)

    // 创建一个 Voice 并添加 notes
    // const voice = new Voice({ num_beats: 4, beat_value: 4 });
    // voice.addTickables(vexNotes);

    // const vexNotes = notes1.map(note => {
    //   const durationTicks = note.durationTicks
    //   const targetValues = [0.25, 0.5, 1, 2, 4];
    //   let result = durationTicks/ppq
    //   let approximatedResult = approximateToSet(result, targetValues);
      
    //   if (!targetValues.includes(approximatedResult)) {
    //     console.log(note)
    //   }
      
    //   return new StaveNote({
    //         keys: [`${note.pitch}/${note.octave}`],  // 音高/八度
    //         duration: NoteDurations[approximatedResult]
    //   });
    // });

    for (var i = 0; i < stave_num; i++) {
      // 这里的120很重要，关系到两个stave之间的上下距离
      const stave = new Stave(10, 120 * i + 50, canvasWidth - 20);  

      // 添加起始小节分割线
      stave.setBegBarType(Barline.type.REPEAT_BEGIN);

      // 添加结尾小节分割线
      stave.setEndBarType(Barline.type.DOUBLE);

      // 在标准的MIDI文件中，并没有专门用来表示谱号（clef）的标记或者事件
      stave.addClef("treble").addTimeSignature(`${timeSignature1}/${timeSignature2}`).addKeySignature(keySignature);

      stave.setContext(context).draw();

      const staveNotes = vexNotes.slice(24*i, 24*(i+1));

      Formatter.FormatAndDraw(context, stave, staveNotes)

      // // 获取音符表中音符的宽度分布
      // const tickContext = new TickContext().addTickable(staveNotes[0]).preFormat();
      // const widthPerNote = tickContext.getWidth();

      // // 计算插入小节分割线的位置
      // const barlineX = stave.getX() + stave.getModifierXShift() + widthPerNote * 2;

      // // 创建和绘制小节分割线
      // const barline = new Barline(Barline.type.SINGLE, barlineX);
      // barline.setContext(context);
      // barline.checkContext();
      // barline.draw();
    }
}

// const generateNotes = (midiJson) => {
//   const div = document.getElementById("sheet");
//   const renderer = new Renderer(div, Renderer.Backends.SVG);

//   renderer.resize(500, 500);
//   const context = renderer.getContext();

//   const stave = new Stave(10, 40, 400);

//   stave.addClef("treble").addTimeSignature("4/4");

//   stave.setContext(context).draw();
//   const notes = [];
//   midiJson.tracks.forEach((track) => {
//     console.log('tracks:', track);
//     const tracksNote = track.notes;
//     notes.forEach((note) => {
//       const key = note.pitch + '/' + note.octave + '';
//       console.log('key:',key)
//       const duration = 'q';
//       console.log('duration',duration)
//       const item = new StaveNote({ keys: key, duration, });
//       notes.push(item);
//     })
//   })
//   const voice = new Voice({ num_beats: 4, beat_value: 4 });
//       voice.addTickables(notes);

//       // Format and justify the notes to 400 pixels.
//       new Formatter().joinVoices([voice]).format([voice], 350);

//     // Render voice
//       voice.draw(context, stave);
// }

// onMounted(() => {

// const div = document.getElementById("output");
// const renderer = new Renderer(div, Renderer.Backends.SVG);

// renderer.resize(500, 500);
// const context = renderer.getContext();

// const stave = new Stave(10, 40, 400);

// stave.addClef("treble").addTimeSignature("4/4");

// stave.setContext(context).draw();

// // Create the notes
// const notes = [
//     // A quarter-note C.
//     new StaveNote({ keys: ["c/4"], duration: "q" }),

//     // A quarter-note D.
//     new StaveNote({ keys: ["d/4"], duration: "q" }),

//     // A quarter-note rest. Note that the key (b/4) specifies the vertical
//     // position of the rest.
//     new StaveNote({ keys: ["b/4"], duration: "qr" }),

//     // A C-Major chord.
//     new StaveNote({ keys: ["c/4", "e/4", "g/4"], duration: "q" }),
// ];

// // Create a voice in 4/4 and add above notes
// const voice = new Voice({ num_beats: 4, beat_value: 4 });
// voice.addTickables(notes);

// // Format and justify the notes to 400 pixels.
// new Formatter().joinVoices([voice]).format([voice], 350);

// // Render voice
// voice.draw(context, stave);
// })

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
