"use strict";
// Copyright © 2023 Navarrotech
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Express & Middleware
var express_1 = __importDefault(require("express"));
var helmet_1 = __importDefault(require("helmet"));
var cookie_parser_1 = __importDefault(require("cookie-parser"));
var cors_1 = __importDefault(require("cors"));
var express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Session stores
var connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
var connect_redis_1 = __importDefault(require("connect-redis"));
var express_session_1 = __importDefault(require("express-session"));
// Misc
var path_1 = __importDefault(require("path"));
function createApplication(options) {
    var _this = this;
    var app = (0, express_1.default)();
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
        app.enable("trust proxy");
    }
    // Register middleware
    app.use((0, helmet_1.default)(__assign({ contentSecurityPolicy: false }, (options.helmetOptions || {}))), (0, cookie_parser_1.default)(), 
    // Parse incoming POST request bodys
    express_1.default.json({
        limit: "100mb",
    }), 
    // If they've sent an invalid JSON in the body of a POST request, let's catch it here!
    function (err, req, res, next) {
        // @ts-ignore
        if (err instanceof SyntaxError && (err === null || err === void 0 ? void 0 : err.status) === 400 && "body" in err) {
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
    (0, express_rate_limit_1.default)(__assign({ windowMs: 15 * 60 * 1000, max: 1 * 1000, standardHeaders: true }, (options.rateLimitOptions || {}))));
    if (options.customMiddleware) {
        options.customMiddleware.forEach(function (middleware) {
            app.use(middleware);
        });
    }
    // Session middleware
    var madeStore;
    if (options.store === "postgres") {
        var Store_1 = (0, connect_pg_simple_1.default)(express_session_1.default);
        madeStore = new Store_1(options.storeSettings);
    }
    else if (options.store === "redis") {
        var Store_2 = (0, connect_redis_1.default)(express_session_1.default);
        madeStore = new Store_2(options.storeSettings);
    }
    else if (options.store !== "memory" && options.store !== undefined) {
        madeStore = options.store;
    }
    else {
        madeStore = new express_session_1.default.MemoryStore();
    }
    app.use((0, express_session_1.default)(__assign(__assign({ secret: options.sessionSecret || "lizard-kangaroo", name: "sid", resave: true, saveUninitialized: false, rolling: true, cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            sameSite: true,
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
        } }, (options.sessionSettings || {})), { store: madeStore })));
    // Advanced route registration
    app.all("/ping", function (req, res) { return res.status(200).send("pong"); });
    if (options.routes) {
        options.routes.forEach(function (func) {
            var fn = func.fn, method = func.method, path = func.path, validator = func.validator;
            app[method](path, function (request, response) { return __awaiter(_this, void 0, void 0, function () {
                var err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!validator) return [3 /*break*/, 4];
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, validator.validate(request.body)];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            err_1 = _a.sent();
                            response
                                .status(400)
                                .send(__assign({ code: 400 }, err_1));
                            return [2 /*return*/];
                        case 4:
                            // @ts-ignore
                            fn(request, response);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    }
    // 404 - Attempt to serve static public folder first for all GET requests
    if (options.publicFolderPath) {
        var publicDist_1 = options.publicFolderPath;
        app.use(express_1.default.static(publicDist_1));
        app.get("*", function (req, res) {
            return res.sendFile(path_1.default.join(publicDist_1, "index.html"));
        });
    }
    // 404 - Return a 404 for everything else
    app.all("*", function (req, res) {
        return res.status(404).send({
            code: 404,
            message: "Route not found",
        });
    });
    return app;
}
exports.default = createApplication;
