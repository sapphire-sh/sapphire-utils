import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LogLevel, logger } from '../src/logger';

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
		const output = vi.mocked(console.log).mock.calls[0][0] as string;
		expect(output).toContain('"key"');
		expect(output).toContain('"value"');
	});

	it('serializes Error payloads', () => {
		const err = new Error('boom');
		logger.error('with error', err);
		const output = vi.mocked(console.error).mock.calls[0][0] as string;
		expect(output).toContain('boom');
	});
});
