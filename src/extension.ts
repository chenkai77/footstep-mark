import { ExtensionContext } from 'vscode';
import { state } from './store';
import { WebviewStatusBar } from './statusBar/webviewBar';
import { ClearAllBar } from './statusBar/clearAllBar';
import { FmShortcut } from './shortcutMark';
import { FmWindowListen } from './features/windowListen';

// 在第一次执行命令时，才会激活扩展程序。
// 当扩展程序被激活的时候，会调用此方法。
export async function activate(context: ExtensionContext) {
  console.log(context.extensionUri, context.extensionPath);
  // 将上下文储存至store
  state.context = context;
  // 初始化底部状态栏
  WebviewStatusBar.initFMstatusBar();
  ClearAllBar.initFMstatusBar();
	// 初始化快捷标记
	FmShortcut.initFmShortcut();
  // window监听事件
  FmWindowListen.initFmWindowListen();
}
// 当扩展程序停用，调用此方法
export function deactivate() {
  WebviewStatusBar.disposeFMstatusBar();
  ClearAllBar.disposeFMstatusBar();
  FmShortcut.disposeShortcutMark();
}


