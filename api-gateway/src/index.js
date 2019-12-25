  "use strict";

/**
 * This example uses all features of API Gateway:
 *  - SSL
 * 	- server assets
 *  - Multi routes
 *  - role-based authorization with JWT
 *  - whitelist
 *  - alias
 *  - body-parsers
 *  - file upload
 *  - HTTP2
 *
 * Metrics, statistics, validation features of Moleculer is enabled.
 *
 * Example:
 *
 *  - Open index.html
 * 		https://localhost:4000
 *
 *  - Access to assets
 * 		https://localhost:4000/images/logo.png
 *
 *  - API: Add two numbers (use alias name)
 * 		https://localhost:4000/api/add?a=25&b=13
 *
 * 	- or with named parameters
 * 		https://localhost:4000/api/add/25/13
 *
 *  - API: Divide two numbers with validation
 * 		https://localhost:4000/api/math/div?a=25&b=13
 * 		https://localhost:4000/api/math/div?a=25      <-- Throw validation error because `b` is missing
 *
 *  - Authorization:
 * 		https://localhost:4000/api/admin/~node/health  <-- Throw `Unauthorized` because no `Authorization` header
 *
 * 		First you have to login . You will get a token and set it to the `Authorization` key in header
 * 			https://localhost:4000/api/login?username=admin&password=admin
 *
 * 		Set the token to header and try again
 * 			https://localhost:4000/api/admin/~node/health
 *
 *  - File upload:
 * 		Open https://localhost:4000/upload.html in the browser and upload a file. The file will be placed to the "examples/full/uploads" folder.
 *
 */

const fs	 				= require("fs");
const path 					= require("path");
const { ServiceBroker } 	= require("moleculer");
const { MoleculerError } 	= require("moleculer").Errors;
const { ForbiddenError, UnAuthorizedError, ERR_NO_TOKEN, ERR_INVALID_TOKEN } = require("moleculer-web").Errors;
const hostname = require("os").hostname();
// ----

const ApiGatewayService = require("moleculer-web");

// Create broker
const broker = new ServiceBroker({
	logger: true,
	namespace: "docker",
	nodeID: `api-gateway-${hostname}`,
	transporter: {
		type: "TCP",
		options: {
		}
	},
	hotReload: true,
	metrics: true
});

// Load other services
// broker.loadServices(path.join(__dirname, "./src/services"), "*.service.js");
broker.loadService("./src/services/auth.service.js");

// Load metrics example service from Moleculer
//broker.createService(require("moleculer/examples/metrics.service.js")());

// Load API Gateway
broker.createService({
	mixins: ApiGatewayService,

	settings: {
		// Exposed port
		port: 3000,

		// Exposed IP
		ip: "0.0.0.0",

		// HTTPS server with certificate
		// https: {
		// 	key: fs.readFileSync(path.join(__dirname, "../ssl/key.pem")),
		// 	cert: fs.readFileSync(path.join(__dirname, "../ssl/cert.pem"))
		// },

		//http2: true,

		// Global CORS settings
		cors: {
			origin: "*",
			methods: ["GET", "OPTIONS", "POST", "PUT", "DELETE"],
			allowedHeaders: "*",
			//exposedHeaders: "*",
			credentials: true,
			maxAge: null
		},

		// Rate limiter
		rateLimit: {
			window: 10 * 1000,
			limit: 10,
			headers: true
		},

		etag: true,

		// Exposed path prefix
		path: "/api",

		routes: [

			/**
			 * This route demonstrates a protected `/api/admin` path to access `users.*` & internal actions.
			 * To access them, you need to login first & use the received token in header
			 */
			{
				// Path prefix to this route
				path: "/admin",

				// Whitelist of actions (array of string mask or regex)
				whitelist: [
					"$node.*"
				],

				authorization: true,

				roles: ["admin"],

				// Action aliases
				aliases: {
					"health": "$node.health",
					"services": "$node.list",
					"custom"(req, res) {
						res.writeHead(201);
						res.end();
					}
				},

				// Use bodyparser module
				bodyParsers: {
					json: true
				},

				onBeforeCall(ctx, route, req, res) {
					this.logger.info("onBeforeCall in protected route");
					ctx.meta.authToken = req.headers["authorization"];
				},

				onAfterCall(ctx, route, req, res, data) {
					this.logger.info("onAfterCall in protected route");
					res.setHeader("X-Custom-Header", "Authorized path");
					return data;
				},

				// Route error handler
				onError(req, res, err) {
					res.setHeader("Content-Type", "text/plain");
					res.writeHead(err.code || 500);
					res.end("Route error: " + err.message);
				}

			},
			
			/**
			 * This route demonstrates a public `/api` path to access `posts`, `file` and `math` actions.
			 */
			{
				// Path prefix to this route
				path: "/auth",

				// Middlewares
				use: [
				],

				etag: true,

				// Whitelist of actions (array of string mask or regex)
				whitelist: [
					"auth.*",
				],

				authorization: false,

				// Convert "say-hi" action -> "sayHi"
				camelCaseNames: true,

				// Action aliases
				aliases: {
					"/login": "auth.login",
				},

				// Use bodyparser module
				bodyParsers: {
					json: true,
					urlencoded: { extended: true }
				},

				callOptions: {
					timeout: 3000,
					//fallbackResponse: "Fallback response via callOptions"
				},

				onBeforeCall(ctx, route, req, res) {
					return new this.Promise(resolve => {
						this.logger.info("async onBeforeCall in public. Action:", ctx.action.name);
						ctx.meta.userAgent = req.headers["user-agent"];
						//ctx.meta.headers = req.headers;
						resolve();
					});
				},

				onAfterCall(ctx, route, req, res, data) {
					this.logger.info("async onAfterCall in public");
					return new this.Promise(resolve => {
						res.setHeader("X-Response-Type", typeof(data));
						resolve(data);
					});
				},
			},
			{
				path: "/",
				whitelist: [
					"math.*",
				],
				roles: [
					"admin",
					"user"
				],
				authorization: true,
				autoAliases: true,
				// Disable direct URLs (`/math/list` or `/math.list`)
				// mappingPolicy: "restrict",
			},
		],

		// Folder to server assets (static files)
		assets: {
			// Root folder of assets
			folder: path.join(__dirname, "assets"),
			// Options to `server-static` module
			options: {}
		},

		// Global error handler
		onError(req, res, err) {
			res.setHeader("Content-Type", "text/plain");
			res.writeHead(err.code || 500);
			
			res.end("Global error: " + err.message);
			// console.log((err.ctx.broker));
		},

		// Do not log client side errors (does not log an error respons when the error.code is 400<=X<500)
		log4XXResponses: false,

	},

	events: {
		"node.broken"(node) {
			this.logger.warn(`The ${node.id} node is disconnected!`);
		}
	},

	methods: {
		/**
		 * Authorize the request
		 *
		 * @param {Context} ctx
		 * @param {Object} route
		 * @param {IncomingRequest} req
		 * @returns {Promise}
		 */
		authorize(ctx, route, req) {
			let authValue = req.headers["authorization"];
			if (authValue && authValue.startsWith("Bearer ")) {
				let token = authValue.slice(7);
				// Verify JWT token
				return ctx.call("auth.verifyToken", { token })
					.then(decoded => {
						console.log("decoded data", decoded);
						// Check the user role
						if (route.opts.roles && route.opts.roles.indexOf(decoded.role) === -1)
							return this.Promise.reject(new ForbiddenError());
						// If authorization was success, we set the user entity to ctx.meta
						return ctx.call("auth.getUserByID", { id: decoded.id }).then(user => {
							ctx.meta.user = user;
							this.logger.info("Logged in user", user);
						});
					})
					.catch(err => {
						console.log("decoded data", err);
						if (err instanceof MoleculerError)
							return this.Promise.reject(err);
						return this.Promise.reject(new UnAuthorizedError(ERR_INVALID_TOKEN));
					});
			} else
				return this.Promise.reject(new UnAuthorizedError(ERR_NO_TOKEN));
			

			// let token;
			// if (req.headers.authorization) {
			// 	let type = req.headers.authorization.split(" ")[0];
			// 	if (type === "Token") {
			// 		token = req.headers.authorization.split(" ")[1];
			// 	}
			// }
			// if (!token) {
			// 	return Promise.reject(new UnAuthorizedError(ERR_NO_TOKEN));
			// }
			// // Verify JWT token
			// return ctx.call("auth.resolveToken", { token })
			// 	.then(user => {
			// 		return Promise.reject(new UnAuthorizedError(ERR_NO_TOKEN));
			// 	});
		}
	},
	started(){

		broker.waitForServices(["auth"]).then(() => {
			broker.logger.info(`Auht service is available  !`);
			// Called after the `posts` & `users` services are available
		});
		broker.ping().then(res => broker.logger.info(res));
		broker.logger.info(`Api gateway listening on ${this.settings.port} !`);
	}
});

// Start server
broker.start();
