export class Queue<T> {
	private storage: Record<number, T> = {};
	private head: number = 0;
	private tail: number = 0;

	private increaseHead() {
		if (this.head === Number.MAX_SAFE_INTEGER) {
			this.head = 0;
		} else {
			this.head += 1;
		}
	}

	private increaseTail() {
		if (this.tail === Number.MAX_SAFE_INTEGER) {
			this.tail = 0;
		} else {
			this.tail += 1;
		}
	}

	public enqueue(element: T): void {
		this.storage[this.tail] = element;
		this.increaseTail();
	}

	public dequeue(): T | undefined {
		if (this.size === 0) {
			return;
		}

		const element = this.storage[this.head];
		delete this.storage[this.head];
		this.increaseHead();

		return element;
	}

	public get size(): number {
		const size = this.tail - this.head;

		if (size < 0) {
			return size + Number.MAX_SAFE_INTEGER;
		}

		return size;
	}
}
