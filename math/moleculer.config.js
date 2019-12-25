"use strict";

const hostname = require("os").hostname();

module.exports = {
	namespace: "docker",
	nodeID: `math-${hostname}`,
	logger: true,
	logLevel: "info",
	transporter: {
		type: "TCP",
		options: {
		}
	},
	hotReload: true
};
