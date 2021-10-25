/*
 * @autoAdd: false
 * @Author: depp.chen
 * @Date: 2021-10-14 16:15:42
 * @LastEditors: depp.chen
 * @LastEditTime: 2021-10-22 13:57:35
 * @Description: 公共方法
 */

import { commands } from 'vscode';

/**
 * @description: 判断command是否已经注册
 * @author: depp.chen
 * @param { string } key : command值
 */
export const commandIsRegister = async (key: string) => {
  const commandList = await commands.getCommands(true);
  return commandList.indexOf(key) > -1;
};