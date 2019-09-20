import * as Assert from "assert";
import { describe, it } from "mocha";
import wu from "wu";
import { Queue } from "../src/utility/queue";

describe("queue", () => {
    it("empty ctor", () => {
        const q = new Queue();
        Assert.strictEqual(q.length, 0);
        Assert.strictEqual(q.peek(), undefined);
        Assert.strictEqual(q.dequeue(), undefined);
        Assert.strictEqual(q.length, 0);
    });
    it("ctor with items 1", () => {
        const q = new Queue([100, 200, 300]);
        Assert.strictEqual(q.length, 3);
        Assert.strictEqual(q.peek(), 100);
        Assert.strictEqual(q.dequeue(), 100);
        Assert.strictEqual(q.length, 2);
        Assert.strictEqual(q.dequeue(), 200);
        Assert.strictEqual(q.length, 1);
        Assert.strictEqual(q.dequeue(), 300);
        Assert.strictEqual(q.length, 0);
        Assert.strictEqual(q.dequeue(), undefined);
    });
    it("ctor with items 2", () => {
        const items = wu.count().take(100).toArray();
        const q = new Queue(items);
        for (let i = 0; i < items.length; i++) {
            Assert.strictEqual(q.length, items.length - i);
            Assert.strictEqual(items[i], q.dequeue());
        }
        Assert.strictEqual(q.length, 0);
    });
    it("random operations", () => {
        for (let op0 = 0; op0 < 10; op0++) {
            const trusted = wu.count().take(Math.round(Math.random() * 10)).toArray();
            const q = new Queue<number>();
            for (const item of trusted)
                q.enqueue(item);
            let nextItem = 100;
            for (let op = 0; op < 1000; op++) {
                if (Math.random() > 0.5) {
                    trusted.push(nextItem);
                    q.enqueue(nextItem);
                    nextItem++;
                } else {
                    const expected = trusted.shift();
                    Assert.strictEqual(q.dequeue(), expected);
                }
                Assert.strictEqual(q.length, trusted.length);
            }
        }
    });
});
