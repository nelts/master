import { WidgetComponent, Processer } from '@nelts/process';
import { Factory, InCommingMessage } from '@nelts/factory';
import { Master as MasterMessager, MessageReceiveDataOptions } from '@nelts/messager';
import MasterPlugin from './plugin';
export { MasterPlugin };
export default class MasterFactory extends Factory<MasterPlugin> implements WidgetComponent {
    private _max;
    private _port;
    private _socket;
    private _sticky;
    private _EXPORT_MODULE_FILE_WORKER;
    private _EXPORT_MODULE_FILE_AGENT;
    private _forker;
    private _messager;
    constructor(processer: Processer, args: InCommingMessage);
    readonly messager: MasterMessager<this>;
    readonly agentModuleFile: string;
    componentWillCreate(): Promise<void>;
    componentDidCreated(): Promise<void>;
    componentWillDestroy(): Promise<void>;
    componentDidDestroyed(): Promise<void>;
    componentCatchError(err: Error): Promise<void>;
    componentReceiveMessage(message: MessageReceiveDataOptions, socket?: any): void;
    private createSocketInterceptor;
}
