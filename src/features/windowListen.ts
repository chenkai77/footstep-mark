/*
 * @Author: depp.chen
 * @Date: 2021-10-25 11:14:36
 * @LastEditors: depp.chen
 * @LastEditTime: 2021-11-01 10:39:39
 * @Description:
 */
import { window, Range, Position} from "vscode";
import { FmWebViewPanel } from "../features/webView";
import { state, getter, mutations } from '../store';

export class FmWindowListen {
  private constructor() {
    this.activeTextEditorChange();
  }

  // FmShortcut类实例
  public static currentFmWindowListen: FmWindowListen | undefined;
  // 实例化
  public static initFmWindowListen() {
    FmWindowListen.currentFmWindowListen = new FmWindowListen();
  }

  /**
   * @description: 监听编辑器编辑的文件修改时
   * @author: depp.chen
   */
  public activeTextEditorChange() {
    window.onDidChangeActiveTextEditor((textEditor) => {
      let fileName = textEditor?.document.fileName;
      let markData;
      if(fileName){
        markData = state.markData[fileName]?.markDetails;
      }
      if(markData){
        markData.forEach(e=>{
          // 计算范围
          let range = new Range(
            new Position(e.range[0], 0),
            new Position(e.range[1], e.range[2])
          );
          textEditor?.setDecorations(e.textEditorDecorationType, [
            {
              range,
              renderOptions: {
                after: {
                  contentText: e.record?e.record:'',
                  color: "rgba(208,2,27,0.4)",
                  margin: "0 0 0 20px",
                },
              },
            },
          ]);
        });
      }
    });
  }
}
