"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const path = require("path");
const globby = require("globby");
const utils_1 = require("@nelts/utils");
const agent_1 = require("@nelts/agent");
async function AgentAutoRun(plu) {
    const cwd = plu.source;
    const files = await globby([
        'agent/**/*.ts',
        'agent/**/*.js',
        '!agent/**/*.d.ts'
    ], { cwd });
    for (let i = 0; i < files.length; i++) {
        const file = path.resolve(cwd, files[i]);
        const callback = utils_1.RequireDefault(file);
        if (Reflect.getMetadata(agent_1.Namespace.AUTO, callback)) {
            if (!callback.name)
                throw new Error('agent must defined with a name.');
            await plu.app.createAgent(callback.name, plu.app.agentModuleFile, {
                file,
                base: plu.app.base,
                config: plu.app.inCommingMessage.config,
                name: callback.name,
                mpid: plu.app.inCommingMessage.mpid
            });
        }
    }
}
exports.default = AgentAutoRun;
