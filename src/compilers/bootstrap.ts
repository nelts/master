import * as path from 'path';
import * as globby from 'globby';
import { RequireDefault } from '@nelts/utils';
import Plugin from '../plugin';
export default async function Bootstrap(plu: Plugin) {
  const cwd = plu.source;
  const files = await globby([ 
    'master.ts', 
    'master.js', 
    '!master.d.ts' 
  ], { cwd });
  if (files.length) {
    const file = path.resolve(cwd, files[0]);
    const callback = RequireDefault<(plu: Plugin) => Promise<any>>(file);
    if (typeof callback === 'function') {
      await callback(plu);
    }
  }
}