"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const net = require("net");
const factory_1 = require("@nelts/factory");
const messager_1 = require("@nelts/messager");
const utils_1 = require("@nelts/utils");
const plugin_1 = require("./plugin");
const agent_1 = require("./compilers/agent");
const bootstrap_1 = require("./compilers/bootstrap");
class MasterFactory extends factory_1.Factory {
    constructor(processer, args) {
        super(processer, args, plugin_1.default);
        this._sticky = 'sticky:balance';
        this._messager = new messager_1.Master(this);
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
        if (this._socket)
            await this.createSocketInterceptor();
        await super.componentWillCreate();
        this.compiler.addCompiler(agent_1.default);
        this.compiler.addCompiler(bootstrap_1.default);
        this._forker = this.createWorkerForker(this._EXPORT_MODULE_FILE_WORKER, {
            base: this.base,
            config: this.inCommingMessage.config,
            port: this._port,
            socket: this._socket,
            sticky: this._sticky,
        });
    }
    async componentDidCreated() {
        await super.componentDidCreated();
        for (let i = 0; i < this._max; i++) {
            this.logger.info('forking worker...');
            const worker = await this._forker();
            this.logger.info(`worker [pid:${worker.pid}] forked.`);
        }
        const promises = [];
        const workers = this.processer.workers;
        const agents = this.processer.agents;
        const keys = Object.keys(agents);
        promises.push(...keys.map(key => this.messager.asyncSend('event:get:ready', null, { to: key })));
        promises.push(...workers.map(worker => this.messager.asyncSend('event:get:ready', null, { to: worker.pid })));
        await Promise.all(promises);
        this.logger.info('Congratulations, all services are started.');
    }
    componentReceiveMessage(message, socket) {
        this.messager.receiveMessage(message, socket);
    }
    createSocketInterceptor() {
        return new Promise((resolve, reject) => {
            const server = net.createServer({ pauseOnConnect: true }, (socket) => {
                if (!socket.remoteAddress)
                    return socket.destroy();
                const hash = utils_1.StickyBlalance(socket.remoteAddress);
                const worker = this.processer.workers[hash % this.processer.workers.length];
                if (!worker)
                    return socket.destroy();
                worker.send(this._sticky, socket);
            });
            server.listen(this._port, (err) => {
                if (err)
                    return reject(err);
                this.logger.info('[master] start socket server interceptor on', this._port);
                resolve();
            });
        });
    }
}
exports.default = MasterFactory;
