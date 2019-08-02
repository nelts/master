import { Plugin } from '@nelts/factory';
import MasterFactory from './index';
export default class MasterPlugin extends Plugin<MasterFactory> {
    constructor(app: MasterFactory, name: string, cwd: string);
}
