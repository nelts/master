import * as os from 'os';
import * as net from 'net';
import { WidgetComponent, Processer, Node } from '@nelts/process';
import { Factory, InCommingMessage } from '@nelts/factory';
import { Master as MasterMessager, MessageReceiveDataOptions } from '@nelts/messager';
import { StickyBlalance } from '@nelts/utils';
import MasterPlugin from './plugin';
import AgentAutoCompiler from './compilers/agent';
import BootstrapCompiler from './compilers/bootstrap';

export {
  MasterPlugin
}

export default class MasterFactory extends Factory<MasterPlugin> implements WidgetComponent {
  private _max: number;
  private _port: number;
  private _socket: boolean;
  private _sticky = 'sticky:balance';
  private _EXPORT_MODULE_FILE_WORKER: string;
  private _EXPORT_MODULE_FILE_AGENT: string;
  private _forker: () => Promise<Node>;
  private _messager = new MasterMessager<this>(this);
  constructor(processer: Processer, args: InCommingMessage) {
    super(processer, args, MasterPlugin);
    this._max = Number(args.max || os.cpus().length);
    this._socket = !!args.socket;
    this._port = Number(args.port || 8080);
    this._EXPORT_MODULE_FILE_WORKER = require.resolve('@nelts/worker');
    this._EXPORT_MODULE_FILE_AGENT = require.resolve('@nelts/agent');
  }

  get messager() {
    return this._messager;
  }

  get agentModuleFile() {
    return this._EXPORT_MODULE_FILE_AGENT;
  }

  async componentWillCreate() {
    if (this._socket) await this.createSocketInterceptor();
    await super.componentWillCreate();
    this.compiler.addCompiler(AgentAutoCompiler);
    this.compiler.addCompiler(BootstrapCompiler);
    this._forker = this.createWorkerForker(this._EXPORT_MODULE_FILE_WORKER, { 
      base: this.base, 
      config: this.inCommingMessage.config, 
      port: this._port, 
      socket: this._socket,
      sticky: this._sticky, 
    });
  }

  async componentDidCreated(){
    await super.componentDidCreated();
    for (let i = 0; i < this._max; i++) {
      this.logger.info('<Forking>', '[Worker]', '...');
      const worker = await this._forker();
      this.logger.info('<Forked>', '[Worker]', worker.pid);
    }
    // notify to workers and agents.
    const promises: Promise<any>[] = [];
    const workers = this.processer.workers;
    const agents = this.processer.agents;
    const keys = Object.keys(agents);
    promises.push(...keys.map(key => this.messager.asyncSend('event:get:ready', null, { to: key })));
    promises.push(...workers.map(worker => this.messager.asyncSend('event:get:ready', null, { to: worker.pid })));
    await Promise.all(promises);
    await this.sync('ServerStarted');
    this.logger.info('Congratulations, all services are started.');
  }

  async componentWillDestroy() {
    await this.sync('ServerStopping');
  }

  async componentDidDestroyed() {
    await this.sync('ServerStopped');
  }

  async componentCatchError(err: Error) {
    this.logger.error(err);
  }

  componentReceiveMessage(message: MessageReceiveDataOptions, socket?: any) {
    this.messager.receiveMessage(message, socket);
  }

  private createSocketInterceptor() {
    return new Promise((resolve, reject) => {
      const server = net.createServer({ pauseOnConnect: true }, (socket: net.Socket) => {
        if (!socket.remoteAddress) return socket.destroy();
        const hash = StickyBlalance(socket.remoteAddress);
        const worker = this.processer.workers[hash % this.processer.workers.length];
        if (!worker) return socket.destroy();
        worker.send(this._sticky, socket);
      });
      server.listen(this._port, (err?: Error) => {
        if (err) return reject(err);
        this.logger.info('[master] start socket server interceptor on', this._port);
        resolve();
      })
    })
  }
}