export class Queue<T> {
    private _q: (T | undefined)[];
    private _front: number;
    private _back: number;
    public constructor(items?: Iterable<T>) {
        this._q = items ? Array.from(items) : [];
        this._front = 0;
        this._back = this._q.length;
        // We need 1 extra element to determine whether the queue is empty or full.
        this._q.push(undefined);
        while (this._q.length < 5) {
            this._q.push(undefined);
        }
    }
    public get length(): number {
        return this._front > this._back ? this._q.length - this._front + this._back : this._back - this._front;
    }
    private _copyTo(dest: (T | undefined)[]): void {
        if (this._back > this._front) {
            for (let i = this._front; i < this._back; i++)
                dest[i - this._front] = this._q[i];
        } else {
            for (let i = this._front; i < this._q.length; i++)
                dest[i - this._front] = this._q[i];
            const newOrigin = this._q.length - this._front;
            for (let i = 0; i < this._back; i++)
                dest[newOrigin + i] = this._q[i];
        }
    }
    public enqueue(item: T): void {
        const eback = this._back > this._front ? (this._back - this._q.length) : this._back;
        if (this._front - eback === 1) {
            // Queue is full.
            const newQ: (T | undefined)[] = new Array(this._q.length * 2 - 1);
            this._copyTo(newQ);
            this._front = 0;
            this._back = this._q.length - 1;
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
        if (this._q.length > 10) {
            const length = this.length;
            if (length < this._q.length / 2) {
                // We can shrink the queue.
                const newQ: (T | undefined)[] = new Array(Math.floor(this._q.length / 2) + 1);
                this._copyTo(newQ);
                this._front = 0;
                this._back = length;
                this._q = newQ;
            }
        }
        return item;
    }
    public peek(): T | undefined {
        return this._front === this._back ? undefined : this._q[this._front];
    }
}
