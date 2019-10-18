import { createSandbox } from './build/index.min.js';
import fs from 'fs';

// test for use global variables as common variables
test('sandbox use with', () => {
    const sandbox = createSandbox(
        {
            a: 1,
            b: 2,
            expect
        },
        { useWith: true }
    );
    sandbox(`
        expect(a).toBe(1);
        expect(b).toBe(2);
        expect(window.a).toBe(1);
        expect(window.b).toBe(2);
    `);
    expect('a' in window).toBe(false);
    expect('b' in window).toBe(false);
});

test('sandbox without arguments run without breaking', () => {
    const sandbox = createSandbox();
    sandbox(`
        var a = 1;
        var b = 2;
        expect(a+b).toBe(3);
    `);
    expect('a' in window).toBe(false);
    expect('b' in window).toBe(false);
});

test('sandbox blacklist', () => {
    const oError = console.error;
    const errorfn = (console.error = jest.fn());
    const sandbox = createSandbox({ a: { b: 1 }, b: 2 }, { useWith: true, blacklist: ['a'] });
    sandbox(`
        expect(a).toBe(undefined);
        try {
            console.log(a.b);
        } catch(e) {
            expect(!!e).toBe(true);
        }
        expect(b).toBe(2);
    `);
    expect(errorfn).toHaveBeenCalledTimes(2);
    console.error = oError;
});

test('sandbox this', function() {
    const sandbox = createSandbox({ expect }, { useWith: true });
    sandbox(`
        expect(global).toBe(window);
        expect(self).toBe(window);
        expect(globalThis).toBe(window);
        expect(this).toBe(window);
    `);
});

test('sandbox full test', () => {
    const sandbox = createSandbox(
        {
            a: 1,
            b: 2,
            expect
        },
        { useWith: true }
    );
    sandbox(`
        var b = 3;
        expect(b).toBe(3);
        expect(window.b).toBe(2);
        a = 2;
        expect(a).toBe(2);
        expect(window.a).toBe(2);
        var c = 1;
        expect(c).toBe(1);
        // expect('c' in window).toBe(false);
        window.c = 10;
        expect(c).toBe(1);
        expect(window.c).toBe(10);
        expect('c' in window).toBe(true);
        d = 100;
        expect(d).toBe(100);
        expect(window.d).toBe(100);
        expect('d' in window).toBe(true);
        e = 'test';
        expect(e).toBe('test');
        expect(window.e).toBe('test');
        delete window.e;
        // expect('e' in window).toBe(false);
        this.f = 7;
        expect(this.f).toBe(7);
        expect(window.f).toBe(7);
        expect(f).toBe(7);
    `);
    expect('a' in window).toBe(false);
    try {
        console.log(a);
    } catch (error) {
        expect(!!error).toBe(true);
    }
    expect('b' in window).toBe(false);
    try {
        console.log(b);
    } catch (error) {
        expect(!!error).toBe(true);
    }
    expect('c' in window).toBe(false);
    try {
        console.log(c);
    } catch (error) {
        expect(!!error).toBe(true);
    }
    expect('d' in window).toBe(false);
    try {
        console.log(d);
    } catch (error) {
        expect(!!error).toBe(true);
    }
    expect('f' in window).toBe(false);
});

test('sandbox run lodash', () => {
    const lodashScript = fs.readFileSync('./test/lodash.js');
    const sandbox = createSandbox(
        {
            expect
        },
        { useWith: true }
    );
    sandbox(`
        ${lodashScript};
        expect(_.chunk(['a', 'b', 'c', 'd'], 2)).toStrictEqual([['a', 'b'], ['c', 'd']]);
        expect(_.compact([0, 1, false, 2, '', 3])).toStrictEqual([1, 2, 3]);
        expect(
            _.zipWith([1, 2], [10, 20], [100, 200], function(a, b, c) {
                return a + b + c;
            })
        ).toStrictEqual([111, 222]);
        expect(_.countBy([6.1, 4.2, 6.3], Math.floor)).toStrictEqual({ '4': 1, '6': 2 });
        var compiled = _.template('hello <%= user %>!');
        expect(compiled({ user: 'fred' })).toBe('hello fred!');
        var compiled = _.template('<% _.forEach(users, function(user) { %><li><%- user %></li><% }); %>');
        expect(compiled({ users: ['fred', 'barney'] })).toBe('<li>fred</li><li>barney</li>');
    `);

    expect('_' in window).toBe(false);
    try {
        console.log(_);
    } catch (error) {
        expect(!!error).toBe(true);
    }
    expect('lodash' in window).toBe(false);
    try {
        console.log(lodash);
    } catch (error) {
        expect(!!error).toBe(true);
    }
});

test('sandbox readme', () => {
    const sandboxOptions = {
        // default: true
        useStrict: true,
        // default: false
        useWith: true,
        // default: true
        inheritWindow: true,
        // default: []
        blacklist: ['blacklistContent']
    };

    const context = {
        blacklistContent: "this content is in the blacklist, you can't get it in the sandbox",
        hello: 'hello z-sandbox'
    };

    const sandbox = createSandbox(context, sandboxOptions);

    sandbox`
        expect(blacklistContent).toBe(undefined);
        expect(window.blacklistContent).toBe(undefined);
        expect(this.blacklistContent).toBe(undefined);
        expect(self.blacklistContent).toBe(undefined);

        expect(hello).toBe('hello z-sandbox');

        window.testInject = true;

        expect(window.testInject).toBe(true);
    `;
    expect(window.testInject).toBe(undefined);
    expect('testInject' in window).toBe(false);
});
