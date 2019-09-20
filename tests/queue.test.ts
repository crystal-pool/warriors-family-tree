import * as Assert from "assert";
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
    [0, 3, 4, 6, 10, 100].forEach(itemCount =>
        it(`ctor with items (${itemCount})`, () => {
            const items = wu.count().take(itemCount).toArray();
            const q = new Queue(items);
            for (let i = 0; i < items.length; i++) {
                Assert.strictEqual(q.length, items.length - i);
                Assert.strictEqual(items[i], q.dequeue());
            }
            Assert.strictEqual(q.length, 0);
        }));
    [0, 3, 4, 6, 10, 100].forEach(itemCount =>
        it(`enqueue-dequeue with items (${itemCount})`, () => {
            const items = wu.count().take(itemCount).toArray();
            const q = new Queue<number>();
            for (let i = 0; i < items.length; i++) {
                q.enqueue(items[i]);
                Assert.strictEqual(items[i], q.dequeue());
                Assert.strictEqual(q.length, 0);
            }
            Assert.strictEqual(q.length, 0);
        }));
    wu.count().take(10).forEach(rep =>
        it(`random operations (${rep})`, () => {
            const trusted = wu.count().take(Math.round(Math.random() * 10)).toArray();
            // console.log("Enqueue", trusted);
            const q = new Queue<number>();
            for (const item of trusted)
                q.enqueue(item);
            let nextItem = 100;
            for (let op = 0; op < 1000; op++) {
                if (Math.random() > 0.5) {
                    trusted.push(nextItem);
                    // console.log("Enqueue", nextItem);
                    q.enqueue(nextItem);
                    nextItem++;
                } else {
                    const expected = trusted.shift();
                    // console.log("Dequeue", expected);
                    Assert.strictEqual(q.dequeue(), expected);
                }
                Assert.strictEqual(q.length, trusted.length);
            }
        }));
});
