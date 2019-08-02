import 'reflect-metadata';
import * as path from 'path';
import * as globby from 'globby';
import { RequireDefault } from '@nelts/utils';
import { Namespace } from '@nelts/agent';
import Plugin from '../plugin';
export default async function AgentAutoRun(plu: Plugin) {
  const cwd = plu.source;
  const files = await globby([ 
    'agent/**/*.ts', 
    'agent/**/*.js', 
    '!agent/**/*.d.ts' 
  ], { cwd });
  for (let i = 0 ; i < files.length ; i++) {
    const file = path.resolve(cwd, files[i]);
    const callback = RequireDefault(file);
    if (Reflect.getMetadata(Namespace.AUTO, callback)) {
      if (!callback.name) throw new Error('agent must defined with a name.');
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