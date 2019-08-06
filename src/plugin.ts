import { Plugin } from '@nelts/factory';
import MasterFactory from './index';
import { MessageSendOptions } from '@nelts/messager';

export default class MasterPlugin extends Plugin<MasterFactory> {
  constructor(app: MasterFactory, name: string, cwd: string) {
    super(app, name, cwd);
  }

  get messager() {
    return this.app.messager;
  }

  send(method: string, data?: any, options?: MessageSendOptions) {
    return this.messager.send(method, data, options);
  }

  asyncSend(method: string, data?: any, options?: MessageSendOptions) {
    return this.messager.asyncSend(method, data, options);
  }
}