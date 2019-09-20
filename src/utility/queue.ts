export class Queue<T> {
    private _q: (T | undefined)[];
    private _front: number;
    private _back: number;
    public constructor(items?: Iterable<T>) {
        this._q = items ? Array.from(items) : [];
        this._front = 0;
        this._back = this._q.length;
        while (this._q.length < 4) {
            this._q.push(undefined);
        }
    }
    public get length(): number {
        return this._front > this._back ? (this._q.length - this._front + this._back - 1) : this._back - this._front;
    }
    public enqueue(item: T): void {
        const eback = this._back > this._front ? (this._back - this._q.length) : this._back;
        if (this._front - eback === 1) {
            // Queue is full.
            const newQ: (T | undefined)[] = new Array(this._q.length * 2);
            if (this._back > this._front) {
                for (let i = this._front; i < this._back; i++)
                    newQ[i - this._front] = this._q[i];
            } else {
                for (let i = this._front; i < this._q.length; i++)
                    newQ[i - this._front] = this._q[i];
                const newOrigin = this._q.length - this._front;
                for (let i = 0; i < this._back; i++)
                    newQ[newOrigin + i] = this._q[i];
            }
            this._front = 0;
            this._back = this._q.length;
            this._q = newQ;
        }
        this._q[this._back] = item;
        this._back = (this._back + 1) % this._q.length;
    }
    public dequeue(): T | undefined {
        if (this._front === this._back)
            return undefined;
        const item = this._q[this._front];
        this._q[this._front] = undefined;
        this._front = (this._front + 1) % this._q.length;
        return item;
    }
    public peek(): T | undefined {
        return this._front === this._back ? undefined : this._q[this._front];
    }
}
