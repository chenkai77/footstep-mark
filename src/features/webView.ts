/*
 * @Author: depp.chen
 * @Date: 2021-10-21 11:23:55
 * @LastEditors: depp.chen
 * @LastEditTime: 2021-10-25 11:18:12
 * @Description: 扩展编辑器
 */
import { window, StatusBarItem, StatusBarAlignment, Uri, commands, workspace, OverviewRulerLane, Range, Position, Location, TextEditorRevealType, ViewColumn, WebviewPanel, Disposable, ExtensionContext, Webview } from 'vscode';
import { extensionWebViewEnum, webViewScriptEnum } from '../enums';
import { state, getter, mutations } from '../store';
import { WebviewStatusBar } from '../statusBar/webviewBar';

// 随机码生成器
function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export class FmWebViewPanel {
  private constructor (panel: WebviewPanel,){
    this.FMwebView = panel;

    this.FMwebView.webview.html = this.getHtmlForWebview();

    this.FMwebView.webview.options = {
      enableScripts: true,
      localResourceRoots: [Uri.joinPath((state.context as ExtensionContext).extensionUri, 'media')]
    };

    this.registerReceiveMessage();

    WebviewStatusBar.currentInstance?.changeButtonOn();

    this.FMwebView.onDidDispose(()=>{
      this.dispose();
		}, null, this.disposables);
  }
  // 扩展编辑器标记枚举
  private static readonly extensionWebViewType  = extensionWebViewEnum.extensionWebView;
  
  // 关闭的页面
  private disposables: Disposable[] = [];

  // window.createWebviewPanel的实例
  protected readonly FMwebView: WebviewPanel;

  // FmWebViewPanel类实例
  public static currentPanel: FmWebViewPanel | undefined;

  // 初始化
  public static createOrDispose(){
    if(FmWebViewPanel.currentPanel){
      FmWebViewPanel.currentPanel.dispose();
      return;
    }
    const webView = window.createWebviewPanel(FmWebViewPanel.extensionWebViewType, '操作栏', {preserveFocus: false, viewColumn:ViewColumn.Beside});
    FmWebViewPanel.currentPanel = new FmWebViewPanel(webView);
    FmWebViewPanel.currentPanel.changeListData();
  }

  /**
   * @description: 销毁
   * @author: depp.chen
   */  
  public dispose(){
    FmWebViewPanel.currentPanel = undefined;
    this.FMwebView.dispose();
    console.log(this.disposables.length, this.disposables, 'this.disposables');
    WebviewStatusBar.currentInstance?.changeButtonOff();
    while (this.disposables.length) {
			const x = this.disposables.pop();
			if (x) {
				x.dispose();
			}
		}
  }

  /**
   * @description: 接受webview Script的信息
   * @author: depp.chen
   */  
  public registerReceiveMessage(){
    this.FMwebView.webview.onDidReceiveMessage((message)=>{
      console.log(message);
			let visibleTextEditors = window.visibleTextEditors;
      let targetFile = visibleTextEditors.find(e=>{
        return e.document.fileName === message.fileName;
      });
      if(!targetFile){
        return;
      }
      if(message.decorationTypeKey){
        let activeMarkData = state.markData[message.fileName];
        if(activeMarkData){
          let index = -1;
          let target = activeMarkData.find((e, i)=>{
            if(e.textEditorDecorationType?.key===message.decorationTypeKey){
              index = i;
              return true;
            }
          });
          if(target && index > -1){
            target.textEditorDecorationType?.dispose();
            mutations.deleteMarkData(message.fileName, index);
          }
        }
      }else if(message.range){
				let messageRange = message.range.split(',');
        let rangeArr = messageRange.map((e:string)=>Number(e));
				targetFile.revealRange(new Range(new Position(rangeArr[0], 0), new Position(rangeArr[1], rangeArr[2])), TextEditorRevealType.InCenter);
			}
		});
  }

  /**
   * @description: 向webview发送信息
   * @author: depp.chen
   * @param { any } message : 发送的信息体 
   */  
  public sendMessage(message:any){
    if(this.FMwebView){
      this.FMwebView.webview.postMessage(message);
    }
  }

  /**
   * @description: 修改webview列表数据
   * @author: depp.chen
   */  
  public changeListData(){
    let activeTextEditor = window.activeTextEditor;
    if(activeTextEditor){
      let fileName = activeTextEditor.document.fileName;
      let markData = state.markData[fileName] || [];
      let data = markData.map(e=>{
        return {
          ...e,
          textEditorDecorationType: undefined,
          textEditorDecorationTypeKey: e.textEditorDecorationType?.key,
        };
      });
      FmWebViewPanel.currentPanel?.sendMessage({
        type: webViewScriptEnum.changeAllMark,
        fileName,
        data,
      });
    }
  }


  /**
   * @description: 获取html
   * @author: depp.chen
   */  
  public getHtmlForWebview(){
    let webview = this.FMwebView.webview;

    const scriptPathOnDisk = Uri.joinPath((state.context as ExtensionContext).extensionUri, 'media', 'main.js');
    const scriptUri = (scriptPathOnDisk).with({ 'scheme': 'vscode-resource' });

		const styleMainPath = Uri.joinPath((state.context as ExtensionContext).extensionUri, 'media', 'main.css');
    const stylesMainUri = webview.asWebviewUri(styleMainPath);

    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource}  https:; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${stylesMainUri}" rel="stylesheet">
      </head>
      <body>
        <div class='mark-list'></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
    </html>`;
  }
}