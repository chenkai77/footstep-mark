/*
 * @autoAdd: false
 * @Author: depp.chen
 * @Date: 2021-10-12 14:55:40
 * @LastEditors: depp.chen
 * @LastEditTime: 2021-10-27 15:40:09
 * @Description: 状态栏扩展
 */
import { window, StatusBarItem, StatusBarAlignment, commands } from "vscode";
import { statusBarCommandEnum, extensionWebViewEnum } from "../enums";
import { commandIsRegister } from "../utils/index";
import { FmWebViewPanel } from "../features/webView";
export class WebviewStatusBar {
  private static readonly statusBarShowWebView =
    statusBarCommandEnum.statusBarShowWebView;
  // statusBar实例
  private readonly FMstatusBar: StatusBarItem;
  // FmStatusBar实例
  public static currentInstance: WebviewStatusBar | undefined;

  private constructor(StatusBarItem: StatusBarItem) {
    this.FMstatusBar = StatusBarItem;
    this.FMstatusBar.command = WebviewStatusBar.statusBarShowWebView;
    this.FMstatusBar.text = `$(repo-clone)off`;
    this.registerFMStatusCommands();
    this.FMstatusBar.show();
  }

  /**
   * @description: 注册command
   * @author: depp.chen
   */
  async registerFMStatusCommands() {
    let isRegister = await commandIsRegister(
      WebviewStatusBar.statusBarShowWebView
    );
    // 如果已经注册了command Key则不再进行注册
    if (isRegister) {
      return;
    }
    commands.registerCommand(
      WebviewStatusBar.statusBarShowWebView,
      async () => {
        FmWebViewPanel.createOrDispose();
      }
    );
  }

  /**
   * @description: 初始化按钮
   * @author: depp.chen
   */
  public static initFMstatusBar() {
    let statusBar = window.createStatusBarItem(StatusBarAlignment.Left);
    WebviewStatusBar.currentInstance = new WebviewStatusBar(statusBar);
  }

  /**
   * @description: 销毁状态栏
   * @author: depp.chen
   */
  public static disposeFMstatusBar() {
    WebviewStatusBar.currentInstance?.FMstatusBar?.dispose();
  }

  /**
   * @description: 修改按钮文本为开启
   * @author: depp.chen
   */
  public changeButtonOn() {
    this.FMstatusBar.text = `$(repo-clone)on`;
  }

  /**
   * @description: 修改按钮文本为为关闭
   * @author: depp.chen
   */
  public changeButtonOff() {
    this.FMstatusBar.text = `$(repo-clone)off`;
  }
}
