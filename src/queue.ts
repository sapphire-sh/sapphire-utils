class QueueNode<T> {
	private _next: QueueNode<T> | null = null;

	public constructor(public readonly value: T) {}

	public get next() {
		return this._next;
	}

	public setNext(newNode: QueueNode<T>) {
		this._next = newNode;
	}
}

export class Queue<T> {
	private head: QueueNode<T> | null = null;
	private tail: QueueNode<T> | null = null;
	private _size = 0;

	public constructor() {}

	public enqueue(element: T): void {
		const newNode = new QueueNode(element);
		if (this.isEmpty() || !this.tail) {
			this.head = newNode;
			this.tail = newNode;
		} else {
			this.tail.setNext(newNode);
			this.tail = newNode;
		}
		this._size += 1;
	}

	public dequeue(): T | undefined {
		if (this.isEmpty() || !this.head) {
			return;
		}

		const value = this.head.value;
		this.head = this.head.next;
		this._size -= 1;

		if (this.isEmpty()) {
			this.tail = null;
		}

		return value;
	}

	public get size(): number {
		return this._size;
	}

	public isEmpty(): boolean {
		return this._size === 0;
	}

	public peek(): T | undefined {
		return this.head?.value;
	}

	public has(element: T): boolean {
		let node = this.head;
		while (node !== null) {
			if (node.value === element) {
				return true;
			}
			node = node.next;
		}
		return false;
	}
}
