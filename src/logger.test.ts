import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
});
