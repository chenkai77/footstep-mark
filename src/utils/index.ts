/*
 * @autoAdd: false
 * @Author: depp.chen
 * @Date: 2021-10-14 16:15:42
 * @LastEditors: depp.chen
 * @LastEditTime: 2021-11-01 11:37:27
 * @Description: 公共方法
 */

import { commands, Uri, ExtensionContext } from 'vscode';

/**
 * @description: 判断command是否已经注册
 * @author: depp.chen
 * @param { string } key : command值
 */
export const commandIsRegister = async (key: string) => {
  const commandList = await commands.getCommands(true);
  return commandList.indexOf(key) > -1;
};

/**
 * @description: 对齐去除前面空格
 * @author: depp.chen
 * @param { string } text : 文本
 */
export const removeBlankSpace = (text: string | undefined) => {
  if (!text) {
     return '';
  }
  let textArr = text?.split('\n');
  let minIndex = text.length;
  textArr?.forEach(e => {
    let index = e.search(/[^\s]/);
    if (index > -1 && index < minIndex) {
      minIndex = index;
    }
  });
  textArr = textArr.map(e => {
    return e.substr(minIndex);
  });
  return textArr.join('\n'); 
};