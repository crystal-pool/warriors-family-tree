import List from "linked-list";

export class ListItem<T> extends List.Item {
    public constructor(public readonly data: T) {
        super();
    }
}

export function logFromItem<T>(item?: ListItem<T> | null): void {
    if (!item) {
        console.log(item);
        return;
    }
    const items: T[] = [];
    let i: ListItem<T> | null | undefined = item;
    while (i) {
        items.push(i.data);
        i = i.next;
    }
    console.log(items);
}
