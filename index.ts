interface OPTIONS {
    // 启用严格模式
    useStrict?: boolean;
    // 使用 with 来拦截作用域访问
    useWith?: boolean;
    // 沙箱中自动继承全局变量
    inheritGlobal?: boolean;
    // 黑名单列表
    blacklist?: string[];
    // 拦截 Function
    interceptFunction?: boolean;
    // 拦截 eval
    interceptEval?: boolean;
}
interface BLACKMAP {
    [other: string]: boolean;
}

export const createSandbox = (context: any = {}, options: OPTIONS = {}) => {
    const global = Function('return this')();
    const {
        useStrict,
        useWith = true,
        inheritGlobal = true,
        interceptFunction,
        interceptEval,
        blacklist = []
    } = options;
    const blackmap: BLACKMAP = {};
    for (let i = 0; i < blacklist.length; i++) {
        const name = blacklist[i];
        blackmap[name] = true;
    }
    const createProxy = (context: any) => {
        const proxy = new Proxy(context, {
            set(target: any, p: string, value: any): boolean {
                target[p] = value;
                return true;
            },
            get(target: any, p: string): any {
                if (blackmap.hasOwnProperty(p)) {
                    console.error(`Can't assess property: ${p} in blacklist`);
                    return undefined;
                }
                switch (p) {
                    case 'window':
                    case 'global':
                    case 'self':
                    case 'globalThis':
                        return proxy;
                    case 'Function':
                        if (interceptFunction) return (...args) => Function(...args).bind(proxy);
                        break;
                    case 'eval':
                        if (interceptEval) return code => Function(`return ${code}`).bind(proxy);
                        break;
                }
                if (inheritGlobal && !(p in target) && p in global) {
                    const value = global[p];
                    if (typeof value === 'function' && !value.prototype) return value.bind(global);
                    return value;
                }
                return target[p];
            },
            has(): boolean {
                return true;
            }
        });
        return proxy;
    };
    context = createProxy(context);
    const sandbox = (script: string) => {
        return new Function(
            'context',
            `
${useWith ? `with (context) {` : ''}
    (function() {
        ${useStrict ? '"use strict";' : ''}
        ${script}
    }).bind(global)();
${useWith ? '};' : ''}
`
        )(context);
    };
    sandbox.context = context;
    sandbox.exec = sandbox;
    return sandbox;
};
