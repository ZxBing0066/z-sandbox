interface OPTIONS {
    useStrict?: boolean;
    useWith?: boolean;
    inheritWindow?: boolean;
    blacklist?: string[];
}
interface BLACKMAP {
    [other: string]: boolean;
}
const extend = (origin: any, target: any) => {
    return Object.assign(Object.create(target), origin);
};

export const createSandbox = (context: any, options: OPTIONS = {}) => {
    const { useStrict = true, useWith = false, inheritWindow = true, blacklist = [] } = options;
    context = inheritWindow ? extend(context, window) : context;
    context = extend({}, context);
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
                if (blackmap[p]) {
                    console.error(`Can't assess property: ${p} in blacklist`);
                    return undefined;
                }
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
    return (script: string) => {
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
};
