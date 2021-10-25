/*
 * @autoAdd: false
 * @Author: depp.chen
 * @Date: 2021-10-14 15:39:29
 * @LastEditors: depp.chen
 * @LastEditTime: 2021-10-14 16:47:56
 * @Description: 
 */
// /*
//  * @autoAdd: false
//  * @Author: depp.chen
//  * @Date: 2021-10-12 14:55:40
//  * @LastEditors: depp.chen
//  * @LastEditTime: 2021-10-14 15:30:54
//  * @Description: 状态栏扩展
//  */
// import { window, StatusBarItem, StatusBarAlignment, TextEditor, commands, workspace, OverviewRulerLane, Range, Position, Location, TextEditorRevealType, ViewColumn } from 'vscode';
// import { statusBarCommandEnum, locationMarkEnum, extensionEditorEnum } from '../enums';

// const FMstatusBarCommand  = statusBarCommandEnum.statusBarGoMask;
// const locationMarkKey  = locationMarkEnum.locationMark;

// // statusBar实例
// let FMstatusBar: StatusBarItem;

// let activeEditor = window.activeTextEditor;

// async function registerFMStatusCommands(key: statusBarCommandEnum){
// 	const commandList = await commands.getCommands(true);
//   // 如果已经注册了command Key则不再进行注册
//   if (commandList.includes(key)) {return;}
// 	commands.registerCommand(key, async () => {
//     window.showInformationMessage('测试成功');
//   });
// }

// export async function initFMstatusBar(){
//   FMstatusBar = window.createStatusBarItem(StatusBarAlignment.Right, 100);
//   FMstatusBar.command = FMstatusBarCommand;
//   // const n = getNumberOfSelectedLines(window.activeTextEditor);


// 	window.createWebviewPanel('likeTt.ttt', '88', ViewColumn.Beside);


// 	commands.registerCommand(locationMarkKey, async () => {
// 		let range = new Range(new Position(20, 0), new Position(20, 999));
// 		activeEditor?.setDecorations(window.createTextEditorDecorationType({
// 				overviewRulerColor: '#ffbd2a',
// 				backgroundColor: '#ffbd2a',
// 				overviewRulerLane: OverviewRulerLane.Full
// 		}), [{ range, renderOptions: {after:{ contentText: '898989898' }} }]);
// 		activeEditor?.revealRange(new Range(new Position(20, 0), new Position(20, 999)), TextEditorRevealType.InCenter);
// 	});

// 	// let inputBox = window.createInputBox();
// 	// inputBox.show();

// 	// window.createWebviewPanel('aa', '888', ViewColumn.Active);

// 	// window.registerCustomEditorProvider(extensionEditorEnum.extensionEditor, '测试', );

// 	workspace.onDidChangeTextDocument(async event=>{
// 		// console.log(event.contentChanges);
// 		// console.log(activeEditor?.document.getText());
	

// 		const definitions = await commands.executeCommand<Location[]>(
// 			'vscode.executeDefinitionProvider',
// 			activeEditor?.document.uri,
// 			activeEditor?.selection.active
// 		);
	



// 		console.log(activeEditor?.document.uri, activeEditor?.selection.active);
// 		// console.log(event.document.offsetAt());
// 		// console.log(event.document.lineAt);
// 	});
//   // console.log(window.activeTextEditor, 'window.activeTextEditor', 100);
//   FMstatusBar.text = '888';
// 	await registerFMStatusCommands(FMstatusBarCommand);
//   FMstatusBar.show();
// 	// if (n > 0) {
// 	// 	FMstatusBar.text = `$(megaphone) ${n} line(s) selected`;
// 	// 	FMstatusBar.show();
// 	// } else {
// 	// 	// FMstatusBar.hide();
// 	// }
// }



// function getNumberOfSelectedLines(editor: TextEditor | undefined): number {
// 	let lines = 0;
//   console.log(editor);
// 	if (editor) {
// 		lines = editor.selections.reduce((prev, curr) => prev + (curr.end.line - curr.start.line), 0);
// 	}
// 	return lines;
// }
