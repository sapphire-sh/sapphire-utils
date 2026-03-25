import { describe, expect, it } from 'vitest';
import { Queue } from './queue';

describe('Queue', () => {
	it('starts empty', () => {
		const q = new Queue<number>();
		expect(q.isEmpty()).toBe(true);
		expect(q.size).toBe(0);
	});

	it('enqueues and dequeues in FIFO order', () => {
		const q = new Queue<number>();
		q.enqueue(1);
		q.enqueue(2);
		q.enqueue(3);

		expect(q.dequeue()).toBe(1);
		expect(q.dequeue()).toBe(2);
		expect(q.dequeue()).toBe(3);
	});

	it('tracks size correctly', () => {
		const q = new Queue<string>();
		q.enqueue('a');
		q.enqueue('b');
		expect(q.size).toBe(2);
		q.dequeue();
		expect(q.size).toBe(1);
	});

	it('returns undefined when dequeuing from an empty queue', () => {
		const q = new Queue<number>();
		expect(q.dequeue()).toBeUndefined();
	});

	it('isEmpty returns true after all items are dequeued', () => {
		const q = new Queue<number>();
		q.enqueue(1);
		q.dequeue();
		expect(q.isEmpty()).toBe(true);
	});

	it('peek returns the head value without removing it', () => {
		const q = new Queue<number>();
		q.enqueue(10);
		q.enqueue(20);
		expect(q.peek()).toBe(10);
		expect(q.size).toBe(2);
	});

	it('peek returns undefined on empty queue', () => {
		const q = new Queue<number>();
		expect(q.peek()).toBeUndefined();
	});

	it('has returns true when value exists', () => {
		const q = new Queue<number>();
		q.enqueue(5);
		expect(q.has(5)).toBe(true);
	});

	it('has returns false when value does not exist', () => {
		const q = new Queue<number>();
		q.enqueue(5);
		expect(q.has(99)).toBe(false);
	});

	it('has works with a predicate function', () => {
		const q = new Queue<number>();
		q.enqueue(3);
		q.enqueue(7);
		expect(q.has((v) => v > 5)).toBe(true);
		expect(q.has((v) => v > 10)).toBe(false);
	});

	it('dequeueMultiple returns up to count items', () => {
		const q = new Queue<number>();
		q.enqueue(1);
		q.enqueue(2);
		q.enqueue(3);
		q.enqueue(4);
		expect(q.dequeueMultiple(3)).toEqual([1, 2, 3]);
		expect(q.size).toBe(1);
	});

	it('dequeueMultiple stops early when queue is exhausted', () => {
		const q = new Queue<number>();
		q.enqueue(1);
		q.enqueue(2);
		expect(q.dequeueMultiple(5)).toEqual([1, 2]);
	});

	it('toArray returns all values in order', () => {
		const q = new Queue<number>();
		q.enqueue(10);
		q.enqueue(20);
		q.enqueue(30);
		expect(q.toArray()).toEqual([10, 20, 30]);
	});

	it('toArray returns empty array for empty queue', () => {
		const q = new Queue<number>();
		expect(q.toArray()).toEqual([]);
	});
});
