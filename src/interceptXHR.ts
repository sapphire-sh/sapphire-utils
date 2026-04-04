const originalSend = XMLHttpRequest.prototype.send;

export const interceptXHR = (pattern: string | RegExp, handler: (xhr: XMLHttpRequest) => void) => {
	XMLHttpRequest.prototype.send = function (body) {
		this.addEventListener('load', () => {
			if (this.status !== 200) {
				return;
			}

			const matches =
				typeof pattern === 'string'
					? this.responseURL.includes(pattern)
					: pattern.test(this.responseURL);

			if (!matches) {
				return;
			}

			handler(this);
		});
		return originalSend.call(this, body);
	};
};
