// Copyright © 2023 Navarrotech

// Types
import type { Application, Request as NormalRequest, Response } from "express";
import type { SessionOptions, Store, Session } from "express-session";
import type { AnyObjectSchema } from "yup";
import type { PGStoreOptions } from "connect-pg-simple";
import type { RedisStoreOptions } from "connect-redis";
import type { HelmetOptions } from "helmet";
import type { Options as RateLimitOptions } from "express-rate-limit";

// Express & Middleware
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";
import rateLimit from "express-rate-limit";

// Session stores
import PGStore from "connect-pg-simple";
import RedisStore from "connect-redis";
import expressSession from "express-session";

// Misc
import path from "path";
import { v4 as uuid } from "uuid";

export type Request<T extends object = Record<string, any>> = {
  session: {
    user: {
      id: string;
    } & T &
      Record<string, any>;
  } & Session;
} & NormalRequest;

export type Route = {
  path: string;
  method: "all" | "get" | "post" | "put" | "delete";
  validator?: AnyObjectSchema;
  fn: (req: Request, res: Response) => void;
};

export type CreateOptions<
  T extends "redis" | "postgres" | "memory" | Store = "postgres"
> = {
  store: T;
  storeSettings: T extends "redis"
    ? Partial<RedisStoreOptions>
    : Partial<PGStoreOptions>;
  cors?: boolean | string;
  routes?: Route[];
  customMiddleware?: any[],
  dontTrustProxy?: boolean;
  helmetOptions?: Partial<HelmetOptions>;
  rateLimitOptions?: Partial<RateLimitOptions>;
  sessionSecret?: string;
  sessionSettings?: Partial<SessionOptions>;
  publicFolderPath?: string;
};

type SessionedCallback = (req: Request, res: Response, next?: () => void) => void;
type SessionedRoute = (path: string, fn: SessionedCallback) => Application;
type SessionedApplication = Application & {
  use: SessionedRoute;
  get: SessionedRoute;
  post: SessionedRoute;
  put: SessionedRoute;
  delete: SessionedRoute;
}

export default function createApplication(options: CreateOptions): SessionedApplication {
  const app = express() as unknown as SessionedApplication;

  if (options.cors === true) {
    app.use(
      "*",
      cors({
        origin: true,
        credentials: true,
      })
    );
  } else if (options.cors !== undefined) {
    app.use(
      "*",
      cors({
        origin: options.cors,
        credentials: true,
      })
    );
  }

  if (!options.dontTrustProxy) {
    app.set("trust proxy", 1);
  }

  // Register middleware
  app.use(
    helmet({
      contentSecurityPolicy: false,
      ...(options.helmetOptions || {}),
    }),
    cookieParser(),
    // Parse incoming POST request bodys
    express.json({
      limit: "100mb",
    }),
    // If they've sent an invalid JSON in the body of a POST request, let's catch it here!
    function (err, req, res, next) {
      // @ts-ignore
      if (err instanceof SyntaxError && err?.status === 400 && "body" in err) {
        res.status(400).send({
          code: 400,
          message: "Bad request: Invalid JSON received in body payload",
        });
        return;
      } else {
        next();
      }
    },
    // Rate limiter:
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1 * 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes) (66 requests per minute)
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      ...(options.rateLimitOptions || {}),
    })
  );

  if(options.customMiddleware){
    options.customMiddleware.forEach((middleware) => {
      app.use(middleware);
    });
  }

  // Session middleware
  let madeStore: Store;
  if (options.store === "postgres") {
    const Store = PGStore(expressSession);
    madeStore = new Store(options.storeSettings);
  } else if (options.store === "redis") {
    const Store = RedisStore(expressSession);
    madeStore = new Store(options.storeSettings);
  } else if (options.store !== "memory" && options.store !== undefined) {
    madeStore = options.store;
  } else {
    madeStore = new expressSession.MemoryStore();
  }

  app.use(
    expressSession({
      secret: options.sessionSecret || "lizard-kangaroo",
      genid: function(req) {
        return uuid() // use UUIDs for session IDs
      },
      name: "sid",
      resave: true, // Save even if nothing is changed
      saveUninitialized: false, // Save even if nothing has been set in req.session yet
      rolling: true,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: true,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
      },
      ...(options.sessionSettings || {}),
      store: madeStore,
    })
  );

  // Advanced route registration
  app.all("/ping", (req, res) => res.status(200).send("pong"));

  if (options.routes) {
    options.routes.forEach((func) => {
      const { fn, method, path, validator } = func;
      app[method](path, async (request, response) => {

        if (validator) {
          try {
            await validator.validate(request.body);
          } catch (err: any) {
            response
              .status(400)
              .send({
                code: 400,
                ...err,
              });
            return;
          }
        }

        // @ts-ignore
        fn(request, response);
      });
    });
  }

  // 404 - Attempt to serve static public folder first for all GET requests
  if (options.publicFolderPath) {
    const publicDist = options.publicFolderPath;
    app.use(express.static(publicDist));
    app.get("*", (req, res) =>
      res.sendFile(path.join(publicDist, "index.html"))
    );
  }

  // 404 - Return a 404 for everything else
  app.all("*", (req: any, res: any) =>
    res.status(404).send({
      code: 404,
      message: "Route not found",
    })
  );

  return app;
}

export { Response };
