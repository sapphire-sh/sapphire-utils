import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LogSink } from './logger';
import { LogLevel, logger } from './logger';

describe('logger', () => {
	beforeEach(() => {
		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(console, 'debug').mockImplementation(() => {});
		// Reset to default level before each test
		logger.setLevel(LogLevel.INFO);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('info logs to console.log', () => {
		logger.info('test message');
		expect(console.log).toHaveBeenCalledOnce();
		expect(vi.mocked(console.log).mock.calls[0][0]).toContain('[INFO] test message');
	});

	it('warn logs to console.warn', () => {
		logger.warn('warn message');
		expect(console.warn).toHaveBeenCalledOnce();
		expect(vi.mocked(console.warn).mock.calls[0][0]).toContain('[WARN] warn message');
	});

	it('error logs to console.error', () => {
		logger.error('error message');
		expect(console.error).toHaveBeenCalledOnce();
		expect(vi.mocked(console.error).mock.calls[0][0]).toContain('[ERROR] error message');
	});

	it('debug is suppressed at INFO level', () => {
		logger.setLevel(LogLevel.INFO);
		logger.debug('debug message');
		expect(console.debug).not.toHaveBeenCalled();
	});

	it('debug logs when level is set to DEBUG', () => {
		logger.setLevel(LogLevel.DEBUG);
		logger.debug('debug message');
		expect(console.debug).toHaveBeenCalledOnce();
	});

	it('setLevel accepts a string', () => {
		logger.setLevel('debug');
		logger.debug('debug message');
		expect(console.debug).toHaveBeenCalledOnce();
	});

	it('setLevel ignores invalid string levels', () => {
		logger.setLevel(LogLevel.INFO);
		logger.setLevel('invalid');
		// level remains INFO, so warn still logs
		logger.warn('still logs');
		expect(console.warn).toHaveBeenCalled();
	});

	it('includes payload in output', () => {
		logger.info('with payload', { key: 'value' });
		const output = String(vi.mocked(console.log).mock.calls[0][0]);
		expect(output).toContain('"key"');
		expect(output).toContain('"value"');
	});

	it('serializes Error payloads', () => {
		const err = new Error('boom');
		logger.error('with error', err);
		const output = String(vi.mocked(console.error).mock.calls[0][0]);
		expect(output).toContain('boom');
	});

	it('serializes a string payload', () => {
		logger.info('with string', 'text');
		expect(String(vi.mocked(console.log).mock.calls[0][0])).toContain('"text"');
	});

	it('serializes a number payload', () => {
		logger.info('with number', 42);
		expect(String(vi.mocked(console.log).mock.calls[0][0])).toContain('42');
	});

	it('serializes an array payload', () => {
		logger.info('with array', [1, 'two']);
		expect(String(vi.mocked(console.log).mock.calls[0][0])).toContain('[1,"two"]');
	});
});

describe('logger sinks', () => {
	const removers: (() => void)[] = [];

	const addSink = (sink: LogSink) => {
		const remove = logger.addSink(sink);
		removers.push(remove);
		return remove;
	};

	beforeEach(() => {
		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(console, 'debug').mockImplementation(() => {});
		logger.setLevel(LogLevel.INFO);
	});

	afterEach(() => {
		while (removers.length > 0) {
			removers.pop()?.();
		}
		vi.restoreAllMocks();
	});

	it('passes the entry to a registered sink', () => {
		const sink = vi.fn();
		addSink(sink);

		logger.warn('to sink', { key: 'value' });

		expect(sink).toHaveBeenCalledTimes(1);
		expect(sink).toHaveBeenCalledWith({
			level: LogLevel.WARN,
			message: 'to sink',
			payload: { key: 'value' },
			timestamp: expect.any(Date),
		});
	});

	it('stops calling a sink once its remover is called', () => {
		const sink = vi.fn();
		const remove = addSink(sink);

		logger.info('first');
		remove();
		logger.info('second');

		expect(sink).toHaveBeenCalledTimes(1);
	});

	it('does not call sinks for entries below the current level', () => {
		const sink = vi.fn();
		addSink(sink);
		logger.setLevel(LogLevel.WARN);

		logger.info('suppressed');

		expect(sink).not.toHaveBeenCalled();
	});

	it('calls sinks in registration order after the console output', () => {
		const order: string[] = [];
		vi.mocked(console.log).mockImplementation(() => {
			order.push('console');
		});
		addSink(() => {
			order.push('first');
		});
		addSink(() => {
			order.push('second');
		});

		logger.info('ordered');

		expect(order).toEqual(['console', 'first', 'second']);
	});

	it('keeps the remaining sinks running when one throws', () => {
		const failing = vi.fn(() => {
			throw new Error('sink boom');
		});
		const following = vi.fn();
		addSink(failing);
		addSink(following);

		logger.info('with a failing sink');

		expect(failing).toHaveBeenCalledTimes(1);
		expect(following).toHaveBeenCalledTimes(1);
		expect(console.log).toHaveBeenCalledTimes(1);
		expect(console.error).toHaveBeenCalledWith('[logger] sink failed', expect.any(Error));
	});
});

describe('logger initialization from LOG_LEVEL', () => {
	const originalEnv = process.env.LOG_LEVEL;

	afterEach(() => {
		if (originalEnv === undefined) {
			delete process.env.LOG_LEVEL;
		} else {
			process.env.LOG_LEVEL = originalEnv;
		}
		vi.restoreAllMocks();
	});

	const loadLogger = async (level: string | undefined) => {
		vi.resetModules();
		if (level === undefined) {
			delete process.env.LOG_LEVEL;
		} else {
			process.env.LOG_LEVEL = level;
		}
		return import('./logger');
	};

	it('initializes to DEBUG when LOG_LEVEL=debug', async () => {
		const { logger } = await loadLogger('debug');
		const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
		logger.debug('debug message');
		expect(spy).toHaveBeenCalledOnce();
	});

	it('is case-insensitive for LOG_LEVEL=DEBUG', async () => {
		const { logger } = await loadLogger('DEBUG');
		const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
		logger.debug('debug message');
		expect(spy).toHaveBeenCalledOnce();
	});

	it('defaults to INFO when LOG_LEVEL is unset', async () => {
		const { logger } = await loadLogger(undefined);
		const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
		logger.debug('debug message');
		expect(spy).not.toHaveBeenCalled();
	});

	it('defaults to INFO when LOG_LEVEL is an empty string', async () => {
		const { logger } = await loadLogger('');
		const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
		logger.debug('debug message');
		expect(spy).not.toHaveBeenCalled();
	});

	it('falls back to INFO on an invalid LOG_LEVEL', async () => {
		const { logger } = await loadLogger('verbose');
		const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
		logger.debug('debug message');
		expect(spy).not.toHaveBeenCalled();
	});

	it('loads at INFO when process is not defined', async () => {
		process.env.LOG_LEVEL = 'debug';
		vi.resetModules();

		const originalProcess = globalThis.process;
		Reflect.deleteProperty(globalThis, 'process');

		let loaded;
		try {
			loaded = await import('./logger');
		} finally {
			globalThis.process = originalProcess;
		}

		const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
		loaded.logger.debug('debug message');
		expect(spy).not.toHaveBeenCalled();
	});
});
