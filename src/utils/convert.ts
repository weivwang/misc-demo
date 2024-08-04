import { StaveNote } from "vexflow";

// 定义音符时值枚举对象
const NoteDurations = Object.freeze({
    1: 'q',   // 四分音符
    0.5: '8', // 八分音符
    0.25: '16', // 十六分音符
    2: 'h',   // 二分音符
    4: 'w'    // 全音符
  });
  
// 计算近似值，处理duration
const approximateToSet = (value, targetSet) => {
    return targetSet.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
  }


export const generateStaveNotes = (notes, ppq) => {
    const staveNotes = notes.map(note => {
        const durationTicks = note.durationTicks
        const targetValues = [0.25, 0.5, 1, 2, 4];
        let result = durationTicks/ppq
        let approximatedResult = approximateToSet(result, targetValues);
        
        if (!targetValues.includes(approximatedResult)) {
          console.log('error notes: ', note)
        }
        
        return new StaveNote({
              keys: [`${note.pitch}/${note.octave}`],  // 音高/八度
              duration: NoteDurations[approximatedResult]
        });
      });
    return staveNotes;
}
