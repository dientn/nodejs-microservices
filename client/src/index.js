"use strict";

module.exports = {
	name: "clients",
	started() {
        let broker = this.broker;
		let reqCount = 0;
		broker.waitForServices("math").then(() => {
			setInterval(() => {
				let payload = {
					n: 1 + Math.floor(Math.random() * 49),
					c: ++reqCount
				};
				let p = broker.call("math.fibo", payload);
				if (p.ctx)
					broker.logger.info(`${reqCount}. Send request 'fibo(${payload.n})' to ${p.ctx.nodeID ? p.ctx.nodeID : "some node"} (queue: ${broker.transit.pendingRequests.size})...`);

				p.then(res => {
					broker.logger.info(`${payload.c}. fibo(${payload.n}) = ${res} (from: ${p.ctx.nodeID})`);
				}).catch(err => {
					broker.logger.warn(`${reqCount}. Request 'fibo(${payload.n})' ERROR! ${err.message}`);
				});

			}, 1000);
		});
	}
};
