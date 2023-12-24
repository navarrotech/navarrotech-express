// Copyright © 2023 Navarrotech

import type { Application, Request as NormalRequest, Response as NormalResponse, NextFunction } from "express";
import type { SessionOptions, Store, Session } from "express-session";
import type { AnyObjectSchema } from "yup";
import type { PGStoreOptions } from "connect-pg-simple";
import type { HelmetOptions } from "helmet";
import type { Options as RateLimitOptions } from "express-rate-limit";

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
  method?: "all" | "get" | "post" | "put" | "delete";
  validator?: AnyObjectSchema;
  handler: (req: Request, res: Response) => void;
};

export type BaseOptions = {
  cors?: boolean | string;
  routes?: Route[];
  customMiddleware?: any[];
  dontTrustProxy?: boolean;
  helmetOptions?: Partial<HelmetOptions>;
  rateLimitOptions?: Partial<RateLimitOptions>;
  sessionSecret?: string;
  sessionSettings?: Partial<SessionOptions>;
  publicFolderPath?: string;
  store: string;
  storeSettings: any;
};

export type PostgresOptions = BaseOptions & {
  store: "postgres";
  storeSettings: Partial<PGStoreOptions>;
};

export type MemoryOptions = BaseOptions & {
  store: "memory";
  storeSettings: any;
};

export type OtherStoreOptions = BaseOptions & {
  store: Store;
  storeOptions: any;
}

export type CreateOptions = PostgresOptions | MemoryOptions | OtherStoreOptions;

export type SessionedCallback = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;
export type SessionedRoute = (path: string, fn: SessionedCallback) => Application;
export type SessionedApplication = Application & {
  use: SessionedRoute;
  get: SessionedRoute;
  post: SessionedRoute;
  put: SessionedRoute;
  delete: SessionedRoute;
};

export type Response = NormalResponse;

export type {
    Store,
    NextFunction,
}