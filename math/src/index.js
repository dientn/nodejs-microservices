"use strict";

const { MoleculerClientError } = require("moleculer").Errors;

module.exports = {
	name: "math",
	actions: {

		add:{
			rest: 'GET /add',
			params: {
				a: { type: "number", convert: true },
				b: { type: "number", convert: true }
			},
			handler(ctx) {
				let rs = Number(ctx.params.a) + Number(ctx.params.b);
				this.logger.info(`'Add' request received from ${ctx.nodeID}. Reply result:`, rs);
				return rs;
			}
		},

		sub: {
			rest: 'GET /subtract',
			handler(ctx) {
				let rs = Number(ctx.params.a) - Number(ctx.params.b);
				this.logger.info(`'Subtract' request received from ${ctx.nodeID}. Reply result:`, rs);
				return rs;
			}
		},

		mult: {
			rest: 'GET /multiple',
			params: {
				a: { type: "number", convert: true },
				b: { type: "number", convert: true }
			},
			handler(ctx) {
				let rs = Number(ctx.params.a) * Number(ctx.params.b);
				this.logger.info(`'Multiple' request received from ${ctx.nodeID}. Reply result:`, rs);
				return rs;
			}
		},

		div: {
			rest: 'GET /divive',
			params: {
				a: { type: "number", convert: true },
				b: { type: "number", convert: true }
			},
			handler(ctx) {
				let a = Number(ctx.params.a);
				let b = Number(ctx.params.b);
				let rs;
				if (b != 0 && !Number.isNaN(b)){
					rs =  a / b;
					this.logger.info(`'Divive' request received from ${ctx.nodeID}. Reply result:`, b);
					return rs;
				}else
					throw new MoleculerClientError("Divide by zero!", 422, null, ctx.params);
			}
		},
		fibo: {
			rest: 'GET /fibo',
			params: {
				n: { type: "number", convert: true }
			},
			handler(ctx) {
				let num = Number(ctx.params.n);
				let a = 1, b = 0, temp;

				while (num >= 0) {
					temp = a;
					a = a + b;
					b = temp;
					num--;
				}

				this.logger.info(`'fibo' request received from ${ctx.nodeID}. Reply result:`, b);

				return b;
			}
		}
	}
};
