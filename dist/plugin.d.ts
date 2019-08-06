import { Plugin } from '@nelts/factory';
import MasterFactory from './index';
import { MessageSendOptions } from '@nelts/messager';
export default class MasterPlugin extends Plugin<MasterFactory> {
    constructor(app: MasterFactory, name: string, cwd: string);
    readonly messager: import("@nelts/messager").Master<MasterFactory>;
    send(method: string, data?: any, options?: MessageSendOptions): number;
    asyncSend(method: string, data?: any, options?: MessageSendOptions): Promise<any>;
}
