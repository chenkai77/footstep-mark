/*
 * @autoAdd: false
 * @Author: depp.chen
 * @Date: 2021-10-12 15:14:29
 * @LastEditors: depp.chen
 * @LastEditTime: 2021-10-29 13:56:24
 * @Description: 枚举
 */

// 快捷键command 文档标记枚举
export enum shortcutMarkEnum {
  // 标记动作command
  locationMark = 'footstepMark.locationMark',
  // 给标记写记录文本command
  markRecord = 'footstepMark.markRecord',
  // 删除标记
  removeMark = 'footstepMark.removeMark'
}

// 底部状态栏按钮枚举
export enum statusBarCommandEnum {
  statusBarShowWebView = 'extension.statusBarShowWebView',
  statusBarClearAll = 'extension.statusBarClearAll'
}

// 扩展编辑器标记枚举
export enum extensionWebViewEnum {
  extensionWebView = 'footstepMark.extensionWebView'
}

// 扩展页面script操作对应枚举(插件传递给扩展脚本)
export enum webViewScriptEnum {
  // 增加标记
  addMarkItem = 'addMarkItem',
  // 删除标记
  deleteMarkItem = 'deleteMarkItem',
  // 修改全部标记
  changeAllMark = 'changeAllMark',
  // 修改全部标记
  addMarkRecord = 'addMarkRecord',
}


// 扩展页面script操作对应枚举(扩展脚本传递给插件)
export enum  plugInOperationEnum {
  // 跳转文件
  openOrShowFile = 'openOrShowFile'
}