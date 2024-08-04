<script setup>
import { Vex } from 'vexflow';
import { onMounted, ref } from 'vue'
import { Midi } from '@tonejs/midi'
import { generateStaveNotes,generateTickMap } from './utils/convert'

const { Renderer, Stave, StaveNote, Voice, Formatter,Barline, TickContext, StaveConnector,
  Accidental, Beam, Dot} = Vex.Flow;

//const notes = ref([])

const inputRef = ref();

const viewWidth = ref(0);


const triggerFileChose = () => {
  inputRef.value.click();
}

const handleChoseFile =  async (event) => {
  const file = event.target.files[0];
  console.log('files:', file);
  await transformMidi(file)
}


// 监听屏幕旋转
const listScreenRotate = () => {
  window.addEventListener('resize', updateViewWidth)
}

const updateViewWidth = () => {
  viewWidth.value = document.documentElement.clientWidth;
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



const generateNotes = (midi) => { 
    console.log("midi:", midi)

    const header = midi.header
    const keySignature = header.keySignatures[0].key
    const timeSignature1 = header.timeSignatures[0].timeSignature[0]
    const timeSignature2 = header.timeSignatures[0].timeSignature[1]
    const ppq = header.ppq 

    // 高音谱表的tarck
    const trebleTrack = midi.tracks[0];
    const trebleNotes = trebleTrack.notes;
    
    // 低音谱track
    const bassNotes = midi.tracks[1].notes;
    
    // 视窗宽度 - 100 全部取视窗宽度会被遮挡
    const width = viewWidth.value - 90;
    // 一行的音符个数 , 50 表示间隔
    const note_num = Math.ceil(width / 50);

    // 按照时序处理获得tickmap
    let trebleTickMap = generateTickMap(trebleNotes)
    let bassTickMap = generateTickMap(bassNotes)  

    console.log('trebleTickMap:', trebleTickMap)
    console.log('bassTickMap:',bassTickMap)

    // 对tickmap处理获得需要渲染的note
    let vexTrebleNotes = generateStaveNotes(trebleTickMap,ppq)
    let vexBassNotes = generateStaveNotes(bassTickMap,ppq)

    // 获取音符数量，并根据每行音符数量获得五线谱的数量
    const maxNotesLength = Math.max(trebleTickMap.size,bassTickMap.size)

    const stave_num = Math.ceil(maxNotesLength / note_num)

    // 按照一行的note数量控制宽度
    const canvasWidth =  width;
    // 按照stave的个数控制render的长度
    const canvasHeight = stave_num * 130
    
    // 使用 VexFlow 渲染五线谱
    const div = document.getElementById("sheet");
    const renderer = new Renderer(div, Renderer.Backends.SVG);
    renderer.resize(canvasWidth, canvasHeight);
    const context = renderer.getContext();
    context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");

    // 每一行距离左侧的距离
    const staveOffsetX  = 10;
    // 第一行离顶部的距离
    const staveOffsetY  = 70;

    // 每一行的高度
    const staveHeight = 80;

    for (var i = 0; i < stave_num; i++) {
      
      // canvas - 20 是为了美观
      const trebleStave = new Stave(staveOffsetX, (staveHeight + staveOffsetY) * 2 * i + staveOffsetY, canvasWidth - 20, 'treble'); 
      
      const bassStave = new Stave(staveOffsetX, (staveHeight + staveOffsetY) * 2 * i  + staveOffsetY * 2, canvasWidth - 20, 'bass');

      // 添加起始小节分割线
      trebleStave.setBegBarType(Barline.type.REPEAT_BEGIN);

      // 添加结尾小节分割线
      trebleStave.setEndBarType(Barline.type.DOUBLE);

      // 在标准的MIDI文件中，并没有专门用来表示谱号（clef）的标记或者事件
      trebleStave.addClef("treble").addTimeSignature(`${timeSignature1}/${timeSignature2}`).addKeySignature(keySignature);

      trebleStave.setContext(context).draw();

      bassStave.setBegBarType(Barline.type.REPEAT_BEGIN);
      bassStave.setEndBarType(Barline.type.DOUBLE);
      bassStave.addClef("bass").addTimeSignature(`${timeSignature1}/${timeSignature2}`).addKeySignature(keySignature);
      bassStave.setContext(context).draw();

      const trebleStaveNotes = vexTrebleNotes.slice(note_num*i, note_num*(i+1));

      const bassStaveNotes = vexBassNotes.slice(note_num*i, note_num*(i+1));

      //增加符梁、调整符干方向
      const beams_treble = Beam.generateBeams(trebleStaveNotes)
      const beams_bass = Beam.generateBeams(bassStaveNotes)

      Formatter.FormatAndDraw(context, trebleStave, trebleStaveNotes);
      Formatter.FormatAndDraw(context, bassStave, bassStaveNotes);

      beams_treble.forEach((b) => {
      b.setContext(context).draw();
      });
      beams_bass.forEach((b) => {
      b.setContext(context).draw();
      });
      function dotted(note) {// A helper function to add a dot to a note.
        Dot.buildAndAttach([note]);
        return note;
      }

      const connector = new StaveConnector(trebleStave, bassStave);
      connector.setType(StaveConnector.type.BRACE);
      connector.setContext(context).draw();

      // 获取音符表中音符的宽度分布
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

onMounted(() => {
  // 初始化宽度
  updateViewWidth();
  // 监听屏幕旋转
  listScreenRotate();
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
