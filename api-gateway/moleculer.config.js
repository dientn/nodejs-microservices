"use strict";
const hostname = require("os").hostname();

module.exports = {
	//logLevel: "debug",
	namespace: "docker",
	logger: console,
	// logLevel: "info",
	nodeID: `api-gateway-${hostname}`,
	transporter: {
		type: "TCP",
		options: {
		}
	},
	hotReload: true,
	created(broker){
		// broker.loadService(path.join(__dirname, "..", "*.service.js"));
	},
};
