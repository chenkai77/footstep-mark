/*
 * @autoAdd: false
 * @Author: depp.chen
 * @Date: 2021-10-14 16:15:42
 * @LastEditors: depp.chen
 * @LastEditTime: 2021-10-29 11:45:32
 * @Description: 公共方法
 */

import { commands, Uri, ExtensionContext } from 'vscode';
import { state } from '../store';

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
 * @description: 根据当前Uri创建新uri
 * @author: depp.chen
 * @param { string[] } path : 路径集合
 */
export const createNewUri = (path: string[]) => {
  const newUri = Uri.joinPath((state.context as ExtensionContext).extensionUri, ...path);
  return newUri;
};