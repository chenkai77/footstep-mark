/*
 * @autoAdd: false
 * @Author: depp.chen
 * @Date: 2021-10-12 14:55:40
 * @LastEditors: depp.chen
 * @LastEditTime: 2021-10-25 10:01:20
 * @Description: 状态栏扩展
 */
import {
  window,
  StatusBarItem,
  StatusBarAlignment,
  commands,
} from "vscode";
import { statusBarCommandEnum, extensionWebViewEnum } from "../enums";
import { commandIsRegister } from "../utils/index";
import { FmWebViewPanel } from "../features/webView";
import { state, mutations } from "../store";
export class ClearAllBar {
	private static readonly statusBarClearAll = statusBarCommandEnum.statusBarClearAll;
  // statusBar实例
  private readonly FMstatusBar: StatusBarItem;
  // FmStatusBar实例
  public static currentInstance: ClearAllBar | undefined;

  private constructor(StatusBarItem: StatusBarItem) {
    this.FMstatusBar = StatusBarItem;
    this.FMstatusBar.command = ClearAllBar.statusBarClearAll;
    this.FMstatusBar.text = `$(stop)clear`;
		this.registerStatusClear();
		this.FMstatusBar.show();
  }

  /**
   * @description: 注册command,清除所有标记
   * @author: depp.chen
   */
  async registerStatusClear() {
    let isRegister = await commandIsRegister(ClearAllBar.statusBarClearAll);
    // 如果已经注册了command Key则不再进行注册
    if (isRegister) {
      return;
    }
    commands.registerCommand(ClearAllBar.statusBarClearAll, async () => {
      mutations.clearAll();
      if(FmWebViewPanel.currentPanel){
        FmWebViewPanel.currentPanel.dispose();
      }
    });
  }

  /**
   * @description: 初始化按钮
   * @author: depp.chen
   */
	public static initFMstatusBar() {
    let statusBar = window.createStatusBarItem(StatusBarAlignment.Left);
    ClearAllBar.currentInstance = new ClearAllBar(statusBar);
  }
}
