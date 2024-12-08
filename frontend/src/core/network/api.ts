/* Copyright 2024 Marimo. All rights reserved. */
import { once } from "@/utils/once";
import { Logger } from "../../utils/Logger";
import { getMarimoServerToken } from "../dom/marimo-tag";
import { getSessionId } from "../kernel/session";
import { createMarimoClient } from "@joshvera/marimo-api";
import { Logger as logger } from "../../utils/Logger";


const getServerTokenOnce = once(() => {
  return getMarimoServerToken();
});

/**
 * Wrapper around fetch that adds XSRF token and session ID to the request and
 * strong types.
 */
export const API = {
  async post<REQ, RESP = null>(
    url: string,
    body: REQ,
    opts: {
      headers?: Record<string, string>;
      baseUrl?: string;
    } = {},
  ): Promise<RESP> {
    const baseUrl = opts.baseUrl ?? document.baseURI;
    const fullUrl = `${baseUrl}api${url}`;
    const newHeaders: Record<string, string> = {};
    const headers = API.headers()
    newHeaders["Marimo-Session-Id"] = headers["Marimo-Session-Id"]
    newHeaders["Marimo-Server-Token"] = await headers["Marimo-Server-Token"]
    logger.log("newHeaders", newHeaders)

    return fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...newHeaders,
        ...opts.headers,
      },
      body: JSON.stringify(body),
    })
      .then(async (response) => {
        const isJson = response.headers
          .get("Content-Type")
          ?.startsWith("application/json");
        if (!response.ok) {
          const errorBody = isJson
            ? await response.json()
            : await response.text();
          throw new Error(response.statusText, { cause: errorBody });
        } else if (isJson) {
          return response.json() as RESP;
        } else {
          return response.text() as unknown as RESP;
        }
      })
      .catch((error) => {
        // Catch and rethrow
        Logger.error(`Error requesting ${fullUrl}`, error);
        throw error;
      });
  },
  async get<RESP = null>(
    url: string,
    opts: {
      headers?: Record<string, string>;
      baseUrl?: string;
    } = {},
  ): Promise<RESP> {
    const baseUrl = opts.baseUrl ?? document.baseURI;
    const fullUrl = `${baseUrl}api${url}`;
    const newHeaders: Record<string, string> = {};
    const headers = API.headers()
    newHeaders["Marimo-Session-Id"] = headers["Marimo-Session-Id"]
    newHeaders["Marimo-Server-Token"] = await headers["Marimo-Server-Token"]
    return fetch(fullUrl, {
      method: "GET",
      headers: {
        ...newHeaders,
        ...opts.headers,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response.statusText);
        } else if (
          response.headers.get("Content-Type")?.startsWith("application/json")
        ) {
          return response.json() as RESP;
        } else {
          return null as RESP;
        }
      })
      .catch((error) => {
        // Catch and rethrow
        Logger.error(`Error requesting ${fullUrl}`, error);
        throw error;
      });
  },
  headers() {
    return {
      "Marimo-Session-Id": getSessionId(),
      "Marimo-Server-Token": getServerTokenOnce(),
    };
  },
  handleResponse: <T>(response: {
    data?: T | undefined;
    error?: Error;
    response: Response;
  }): Promise<T> => {
    if (response.error) {
      return Promise.reject(response.error);
    }
    return Promise.resolve(response.data as T);
  },
  handleResponseReturnNull: (response: {
    error?: Error;
    response: Response;
  }): Promise<null> => {
    if (response.error) {
      return Promise.reject(response.error);
    }
    return Promise.resolve(null);
  },
};

export const marimoClient = createMarimoClient({
  // eslint-disable-next-line ssr-friendly/no-dom-globals-in-module-scope
  baseUrl: typeof document === "undefined" ? undefined : document.baseURI,
});

marimoClient.use({
  onRequest: async (req) => {
    logger.log("req", req)
    for (const [key, value] of Object.entries(API.headers())) {
      logger.log("header", key)
      const resolvedValue = await Promise.resolve(value);
      logger.log("resolvedValue", resolvedValue)
      req.headers.set(key, resolvedValue);
    }
    return req;
  },
});
