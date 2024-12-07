/* Copyright 2024 Marimo. All rights reserved. */
import { assertExists } from "@/utils/assertExists";
import { invariant } from "@/utils/invariant";
import { isIslands } from "@/core/islands/utils";

interface MarimoSettings {
  getMarimoVersion: () => Promise<string>;
  getMarimoServerToken: () => Promise<string>;
  getMarimoAppConfig: () => unknown;
  getMarimoUserConfig: () => unknown;
  getMarimoCode: () => string;
}

const domBasedMarimoSettings: MarimoSettings = {
  getMarimoVersion: () => {
    return getMarimoDOMValue("marimo-version", "version");
  },
  getMarimoServerToken: () => {
    return getMarimoDOMValue("marimo-server-token", "token");
  },
  getMarimoAppConfig: () => {
    return {}
  },
  getMarimoUserConfig: () => {
    return {}
  },
  getMarimoCode: () => {
    const tag = document.querySelector("marimo-code");
    invariant(tag, "internal-error: marimo-code not tag not found");
    const inner = tag.innerHTML;
    return decodeURIComponent(inner).trim();
  },
};

const islandsBasedMarimoSettings: MarimoSettings = {
  getMarimoVersion: () => {
    assertExists(import.meta.env.VITE_MARIMO_VERSION);
    return import.meta.env.VITE_MARIMO_VERSION;
  },
  getMarimoServerToken: () => {
    return "";
  },
  getMarimoAppConfig: () => {
    return {};
  },
  getMarimoUserConfig: () => {
    return {};
  },
  getMarimoCode: () => {
    return "";
  },
};

export const {
  getMarimoVersion,
  getMarimoServerToken,
  getMarimoAppConfig,
  getMarimoUserConfig,
  getMarimoCode,
} = isIslands() ? islandsBasedMarimoSettings : domBasedMarimoSettings;

async function getMarimoDOMValue(tagName: string, key: string) {
  const response = await fetch("http://localhost:2718");
  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const tag = doc.querySelector(tagName);
  invariant(
    tag !== null && tag instanceof HTMLElement,
    `internal-error: ${tagName} tag not found`,
  );

  const value = tag.dataset[key];
  invariant(
    value !== undefined,
    `internal-error: ${tagName} tag does not have ${key}`,
  );

  return value;
}
