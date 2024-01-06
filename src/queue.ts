type Value = object | number | string | boolean;

class QueueNode<T extends Value> {
	private _next: QueueNode<T> | null = null;

	public constructor(public readonly value: T) {}

	public get next() {
		return this._next;
	}

	public setNext(newNode: QueueNode<T>) {
		this._next = newNode;
	}
}

export class Queue<T extends Value> {
	private head: QueueNode<T> | null = null;
	private tail: QueueNode<T> | null = null;
	private _size = 0;

	public constructor() {}

	public enqueue(value: T): void {
		const newNode = new QueueNode(value);
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

	public dequeueMultiple(count: number): T[] {
		const array: T[] = [];
		for (let i = 0; i < count; ++i) {
			const value = this.dequeue();
			if (!value) {
				break;
			}
			array.push(value);
		}
		return array;
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

	public has(value: T | ((value: T) => boolean)): boolean {
		let node = this.head;
		while (node !== null) {
			if (typeof value === 'function') {
				if (value(node.value)) {
					return true;
				}
			} else {
				if (node.value === value) {
					return true;
				}
			}
			node = node.next;
		}
		return false;
	}

	public toArray(): T[] {
		let node = this.head;
		if (!node) {
			return [];
		}
		const array: T[] = [];
		while (node) {
			array.push(node.value);
			node = node.next;
		}
		return array;
	}
}
