interface OPTIONS {
    // 启用严格模式
    useStrict?: boolean;
    // 使用 with 来拦截作用域访问
    useWith?: boolean;
    // 沙箱中自动继承 window
    inheritWindow?: boolean;
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
const extend = (origin: any, target: any) => {
    return Object.assign(Object.create(target), origin);
};

export const createSandbox = (context: any = {}, options: OPTIONS = {}) => {
    const {
        useStrict,
        useWith = true,
        inheritWindow = true,
        interceptFunction,
        interceptEval,
        blacklist = []
    } = options;
    context = inheritWindow ? Object.assign(Object.create(window), context) : { ...context };
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
                if (interceptFunction && p === 'Function') return (...args) => Function(...args).bind(proxy);
                if (interceptEval && p === 'eval') return code => Function(`return ${code}`).bind(proxy);
                if (p === 'window' || p === 'global' || p === 'self' || p === 'globalThis') return proxy;
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
            'window',
            `
${useWith ? `with (window) {` : ''}
    (function() {
        ${useStrict ? '"use strict";' : ''}
        ${script}
    }).bind(window)();
${useWith ? '};' : ''}
`
        )(context);
    };
    sandbox.context = context;
    sandbox.exec = sandbox;
    return sandbox;
};
