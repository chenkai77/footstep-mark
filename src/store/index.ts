import { ExtensionContext, TextEditorDecorationType, window } from 'vscode';
export interface IMarkDetails {
  range: [number, number, number],
  record?: string | undefined,
  fileMarkText?: string | undefined,
  textEditorDecorationType: TextEditorDecorationType,
  viewColumn?: number, // 编辑器所处的序号
}

interface State {
  // 扩展程序激活上下文
  context: ExtensionContext | undefined,
  // 标记的数据集合
  markData: {[fileName:string]:IMarkDetails[]}
}

const state: State = {
  context: undefined,
  markData: {},
};

const getter = {
  getActiveMarkData(){
      let fileName = window.activeTextEditor?.document.fileName;
      if(fileName){
        return state.markData[fileName];
      }
  }
};

const mutations = {
  // 增加标记数据
  addMarkData(fileName: string | undefined, markData: IMarkDetails) {
    if(!fileName){
      return;
    }
    if (state.markData[fileName]) {
      state.markData[fileName].push({
        ...markData,
      });
      state.markData[fileName].sort((a,b)=>a.range[0] - b.range[0]);
    }else{
      state.markData[fileName] = [markData];
    }
  },
  // 删除标记数据
  deleteMarkData(fileName: string, i: number){
    if(fileName && state.markData[fileName]){
      state.markData[fileName].splice(i, 1);
    }
  },
  // 删除所有标记数据
  clearAll(){
    console.log(state.markData);
    for(let file in state.markData){
      state.markData[file].forEach(e=>{
        e.textEditorDecorationType?.dispose();
      });
    }
    state.markData = {};
  }
};


export { state, mutations, getter };
