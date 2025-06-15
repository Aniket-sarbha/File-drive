/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as clerk from "../clerk.js";
import type * as convert from "../convert.js";
import type * as crons from "../crons.js";
import type * as debug_pdf from "../debug_pdf.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as mutations from "../mutations.js";
import type * as quota_check from "../quota_check.js";
import type * as summarize from "../summarize.js";
import type * as test_pdf from "../test_pdf.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  clerk: typeof clerk;
  convert: typeof convert;
  crons: typeof crons;
  debug_pdf: typeof debug_pdf;
  files: typeof files;
  http: typeof http;
  mutations: typeof mutations;
  quota_check: typeof quota_check;
  summarize: typeof summarize;
  test_pdf: typeof test_pdf;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
