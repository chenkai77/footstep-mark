/*
 * @Author: depp.chen
 * @Date: 2021-10-21 11:23:55
 * @LastEditors: depp.chen
 * @LastEditTime: 2021-11-05 16:42:48
 * @Description: 扩展编辑器
 */
import {
  window,
  Uri,
  workspace,
  Range,
  Position,
  TextEditorRevealType,
  WebviewPanel,
  Disposable,
  ExtensionContext,
} from "vscode";
import {
  extensionWebViewEnum,
  webViewScriptEnum,
  plugInOperationEnum,
} from "../enums";
import { state, getter, mutations } from "../store";
import { WebviewStatusBar } from "../statusBar/webviewBar";

// 随机码生成器
function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export class FmWebViewPanel {
  private constructor(panel: WebviewPanel) {
    this.FMwebView = panel;

    this.FMwebView.webview.html = this.getHtmlForWebview();

    this.FMwebView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        Uri.joinPath((state.context as ExtensionContext).extensionUri, "media"),
      ],
    };

    this.registerReceiveMessage();

    WebviewStatusBar.currentInstance?.changeButtonOn();

    this.FMwebView.onDidDispose(
      () => {
        this.dispose();
      },
      null,
      // this.disposables
    );
  }
  // 扩展编辑器标记枚举
  private static readonly extensionWebViewType =
    extensionWebViewEnum.extensionWebView;

  // 关闭的页面
  private disposables: Disposable[] = [];

  // window.createWebviewPanel的实例
  protected readonly FMwebView: WebviewPanel;

  // FmWebViewPanel类实例
  public static currentPanel: FmWebViewPanel | undefined;

  // 初始化
  public static createOrDispose() {
    if (FmWebViewPanel.currentPanel) {
      FmWebViewPanel.currentPanel.dispose();
      return;
    }
    let visibleTextEditors = window.visibleTextEditors;
    const webView = window.createWebviewPanel(
      FmWebViewPanel.extensionWebViewType,
      "操作栏",
      { preserveFocus: false, viewColumn: visibleTextEditors.length + 1 }
    );
    FmWebViewPanel.currentPanel = new FmWebViewPanel(webView);
	// 扩展webview移动位置时
	webView.onDidChangeViewState(e=>{
		FmWebViewPanel.currentPanel?.changeListData();
	});
    FmWebViewPanel.currentPanel.changeListData();
  }

  /**
   * @description: 销毁
   * @author: depp.chen
   */
  public dispose() {
    FmWebViewPanel.currentPanel = undefined;
    this.FMwebView.dispose();
    // console.log(this.disposables.length, this.disposables, "this.disposables");
    WebviewStatusBar.currentInstance?.changeButtonOff();
    // while (this.disposables.length) {
    //   const x = this.disposables.pop();
    //   if (x) {
    //     x.dispose();
    //   }
    // }
  }

  private registerMessageFunction: any = {
    [plugInOperationEnum.openOrShowFile]: async (message: any) => {
      let visibleTextEditors = window.visibleTextEditors;
      let targetFile = visibleTextEditors.find((e) => {
        return e.document.fileName === message.fileName;
      });
      // 如果文件在打开的编辑器中
      if (targetFile) {
        window.showTextDocument(targetFile.document.uri, {
          viewColumn: targetFile.viewColumn,
        });
        if (targetFile.viewColumn !== Number(message.viewColumn)) {
          mutations.changeViewColumn(
            message.fileName,
            targetFile.viewColumn as number
          );
          FmWebViewPanel.currentPanel?.sendMessage({
            type: webViewScriptEnum.changeViewColumn,
            data: {
              fileName: message.fileName,
              viewColumn: targetFile.viewColumn,
            },
          });
        }
        return targetFile;
      } else {
        let uri = Uri.file(message.fileName);
        let openFile = await window.showTextDocument(uri, {
          viewColumn: Number(message.viewColumn) || 1,
        });
        return openFile;
      }
    },
    [plugInOperationEnum.rangeJump]: async (message: any) => {
      let target = await this.registerMessageFunction[
        plugInOperationEnum.openOrShowFile
      ](message);
      let messageRange = message.range.split(",");
      let rangeArr = messageRange.map((e: string) => Number(e));
      if (target) {
        target.revealRange(
          new Range(
            new Position(rangeArr[0], 0),
            new Position(rangeArr[1], rangeArr[2])
          ),
          TextEditorRevealType.InCenter
        );
      }
    },
    [plugInOperationEnum.deleteMarkItem]: async (message: any) => {
      let activeMarkData = state.markData[message.fileName].markDetails;
      if (activeMarkData) {
        let index = -1;
        let target = activeMarkData.find((e, i) => {
          if (e.attributeDecorationTypeKey === message.decorationTypeKey) {
            index = i;
            return true;
          }
        });
        if (target && index > -1) {
          target.textEditorDecorationType?.dispose();
          mutations.deleteMarkData(message.fileName, index);
        }
      }
    },
    [plugInOperationEnum.deleteFileAllMark]: (message:any) => {
      mutations.deleteFileAllMarkData(message.fileName);
    }
  };

  /**
   * @description: 接收webview Script的信息
   * @author: depp.chen
   */
  public async registerReceiveMessage() {
    this.FMwebView.webview.onDidReceiveMessage(async (message) => {
      this.registerMessageFunction[message.type](message);
    });
  }

  /**
   * @description: 向webview发送信息
   * @author: depp.chen
   * @param { any } message : 发送的信息体
   */
  public sendMessage(message: any) {
    if (this.FMwebView) {
      this.FMwebView.webview.postMessage(message);
    }
  }

  /**
   * @description: 修改webview列表数据
   * @author: depp.chen
   */
  public changeListData() {
    let rootPath = '';
    if (workspace.workspaceFolders) {
      rootPath = workspace.workspaceFolders[0].uri.fsPath;
    }
    let data = {
      ...state.markData,
      rootPath,
    };
    FmWebViewPanel.currentPanel?.sendMessage({
      type: webViewScriptEnum.changeAllMark,
      data,
    });
  }

  /**
   * @description: 获取html
   * @author: depp.chen
   */
  public getHtmlForWebview() {
    let webview = this.FMwebView.webview;

    const scriptPathOnDisk = Uri.joinPath(
      (state.context as ExtensionContext).extensionUri,
      "media",
      "main.js"
    );
    const scriptUri = scriptPathOnDisk.with({ scheme: "vscode-resource" });

    const styleMainPath = Uri.joinPath(
      (state.context as ExtensionContext).extensionUri,
      "media",
      "main.css"
    );

    const deleteImgPath = Uri.joinPath(
      (state.context as ExtensionContext).extensionUri,
      "media",
      "delete-icon.png"
    );
    const stylesMainUri = webview.asWebviewUri(styleMainPath);
    const deleteImgPathUri = webview.asWebviewUri(deleteImgPath);

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
        <div class='img-info'>${deleteImgPathUri}</div>
      </body>
    </html>`;
  }
}
