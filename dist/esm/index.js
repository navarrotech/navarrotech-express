"use strict";
// Copyright © 2023 Navarrotech
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Express & Middleware
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Session stores
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const express_session_1 = __importDefault(require("express-session"));
// Misc
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
function createApplication(options) {
    const app = (0, express_1.default)();
    if (options.cors === true) {
        app.use("*", (0, cors_1.default)({
            origin: true,
            credentials: true,
        }));
    }
    else if (options.cors !== undefined) {
        app.use("*", (0, cors_1.default)({
            origin: options.cors,
            credentials: true,
        }));
    }
    if (!options.dontTrustProxy) {
        app.set("trust proxy", 1);
    }
    // Register middleware
    app.use('*', (0, helmet_1.default)({
        contentSecurityPolicy: false,
        ...(options.helmetOptions || {}),
    }), (0, cookie_parser_1.default)(), 
    // Parse incoming POST request bodys
    express_1.default.json({
        limit: "100mb",
    }), 
    // @ts-ignore If they've sent an invalid JSON in the body of a POST request, let's catch it here!
    function catchJsonError(err, req, res, next) {
        // @ts-ignore
        if (err instanceof SyntaxError && err?.status === 400 && "body" in err) {
            res.status(400).send({
                code: 400,
                message: "Bad request: Invalid JSON received in body payload",
            });
            return;
        }
        else {
            next();
        }
    }, 
    // Rate limiter:
    (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1 * 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes) (66 requests per minute)
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        ...(options.rateLimitOptions || {}),
    }));
    // Session middleware
    let madeStore;
    if (options.store === "postgres") {
        const Store = (0, connect_pg_simple_1.default)(express_session_1.default);
        madeStore = new Store(options.storeSettings);
    }
    else if (options.store !== "memory" && options.store !== undefined) {
        madeStore = options.store;
    }
    else {
        madeStore = new express_session_1.default.MemoryStore();
    }
    app.use((0, express_session_1.default)({
        secret: options.sessionSecret || "lizard-kangaroo",
        genid: function (req) {
            return (0, uuid_1.v4)(); // use UUIDs for session IDs
        },
        name: "sid",
        resave: true, // Save even if nothing is changed
        saveUninitialized: false, // Save even if nothing has been set in req.session yet
        rolling: true,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
        },
        ...(options.sessionSettings || {}),
        store: madeStore,
    }), function sessionMiddleware(req, res, next) {
        if (req.session) {
            // @ts-ignore
            req.session.saveAsync = () => new Promise(acc => req.session.save(() => acc(true)));
            // @ts-ignore
            req.session.destroyAsync = () => new Promise(acc => req.session.destroy(() => acc(true)));
            // @ts-ignore
            req.session.reloadAsync = () => new Promise(acc => req.session.reload(() => acc(true)));
            // @ts-ignore
            req.session.regenerateAsync = () => new Promise(acc => req.session.regenerate(() => acc(true)));
            // @ts-ignore
            if (!!req.session?.user?.id) {
                // @ts-ignore
                req.session.authorized = true;
            }
        }
        next();
    });
    if (options.customMiddleware) {
        options.customMiddleware.forEach((middleware) => {
            app.use(middleware);
        });
    }
    // Advanced route registration
    app.all("/ping", (req, res) => res.status(200).send("pong"));
    if (options.routes) {
        options.routes.forEach((func) => {
            const { handler, method = "post", path, validator, middlewares } = func;
            app[method](path, async (request, response) => {
                if (validator) {
                    try {
                        await validator.validate(request.body);
                    }
                    catch (err) {
                        response
                            .status(400)
                            .send({
                            code: 400,
                            ...err,
                        });
                        return;
                    }
                }
                try {
                    if (middlewares?.length) {
                        for (const middleware of middlewares) {
                            await middleware(request, response, null);
                        }
                    }
                    // @ts-ignore
                    handler(request, response);
                }
                catch (err) {
                    console.error(err);
                    if (!response.headersSent) {
                        response
                            .status(500)
                            .send({
                            code: 500,
                            message: "Internal server error",
                            error: process.env.NODE_ENV === "development" ? err : null,
                        });
                    }
                }
            });
        });
    }
    // 404 - Attempt to serve static public folder first for all GET requests
    if (options.publicFolderPath) {
        const publicDist = options.publicFolderPath;
        app.use(express_1.default.static(publicDist));
        app.get("*", (req, res) => res.sendFile(path_1.default.join(publicDist, "index.html")));
    }
    // 404 - Return a 404 for everything else
    app.all("*", (req, res) => res.status(404).send({
        code: 404,
        message: "Route not found",
    }));
    return app;
}
exports.default = createApplication;
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map