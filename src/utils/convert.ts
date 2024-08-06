import { StaveNote } from "vexflow";

// 定义音符时值枚举对象
const NoteDurations = Object.freeze({
    0.03125: '128', // 128分音符
    0.0625: '64', // 六十四分音符
    0.125: '32', // 三十二分音符
    0.25: '16', // 十六分音符
    0.5: '8', // 八分音符
    1: 'q',   // 四分音符
    2: 'h',   // 二分音符
    4: 'w'    // 全音符
});
  
const targetValues = [0.03125, 0.0625, 0.125, 0.25, 0.5, 1, 2, 4];

// 计算近似值，处理duration
const approximateToSet = (value, targetSet) => {
    return targetSet.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
  }


// TODO: 后续最好将定义出note的interface取代any类型
export const generateStaveNotes = (tickMap, ppq) => {
    let vexNotes : any[] = []
    try {
      tickMap.forEach((noteArray, tick) => {
        let keysArray: any[] = []
        const durationTicks = noteArray[0].durationTicks
        
        let result = durationTicks/ppq
        let approximatedResult = approximateToSet(result, targetValues);
  
        noteArray.forEach(note => {
            keysArray.push(`${note.pitch}/${note.octave}`)
        });
        //console.log(keysArray)
        // 创建 VexFlow 的 StaveNote
        const staveNote = new StaveNote({
          keys: keysArray, 
          duration: NoteDurations[approximatedResult]
        });
  
        // 添加到 notes 数组
        vexNotes.push(staveNote);
      });
    } catch (error) {
      console.log('errorMap', tickMap)
      return
    }
    return vexNotes;
}

export const generateTickMap = (notes) => { 
    let tickMap = new Map();
  
    notes.forEach(note => {
      const noteoff = note.noteOffVelocity
      if(noteoff != 0) console.log('noteoff:',note)

      //console.log('note:',note)
      const tick = note.ticks;
  
      // 检查 Map 中是否已有该 tick 的键
      if (tickMap.has(tick)) {
        // 如果有，获取现有的数组并添加新的 note
        tickMap.get(tick).push(note);
      } else {
        // 如果没有，创建一个新的数组，并添加到 Map 中
        tickMap.set(tick, [note]);
      }
    });
    return tickMap
}
