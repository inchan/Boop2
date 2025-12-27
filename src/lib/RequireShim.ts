import _ from 'lodash';
import he from 'he';
import yaml from 'js-yaml';
import Papa from 'papaparse';
// @ts-expect-error - jshashes has no type definitions
import Hashes from 'jshashes';
// @ts-expect-error - vkbeautify has no type definitions
import vkbeautify from 'vkbeautify';

// Base64 Wrapper with Unicode support
const Base64 = {
  encode: (str: string) => {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      })
    );
  },
  decode: (str: string) => {
    try {
      return decodeURIComponent(
        atob(str)
          .split('')
          .map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
    } catch {
      return atob(str);
    }
  },
};

/**
 * Explicit shim for vkBeautify to match Boop's expected interface.
 */
const vkBeautifyShim = {
  css: (t: string, s?: number) => vkbeautify.css(t, s),
  cssmin: (t: string, p?: boolean) => vkbeautify.cssmin(t, p),
  sql: (t: string, s?: number) => vkbeautify.sql(t, s),
  sqlmin: (t: string) => vkbeautify.sqlmin(t),
  xml: (t: string, s?: number) => vkbeautify.xml(t, s),
  xmlmin: (t: string, p?: boolean) => vkbeautify.xmlmin(t, p),
  json: (t: string, s?: number) => vkbeautify.json(t, s),
  jsonmin: (t: string) => vkbeautify.jsonmin(t),
};

// Mapping Boop's expected file paths to actual library instances
const modules: Record<string, unknown> = {
  // Lodash
  lodash: _,
  '@boop/lodash.boop': _,
  './lib/lodash.boop.js': _,

  // Base64
  '@boop/base64': Base64,
  './lib/base64.js': Base64,

  // HTML Entities
  '@boop/he': he,
  './lib/he.js': he,

  // YAML
  '@boop/js-yaml': yaml,
  './lib/js-yaml.js': yaml,

  // CSV
  '@boop/papaparse.js': Papa,
  './lib/papaparse.js': Papa,

  // Hashes
  '@boop/hashes': Hashes,
  './lib/hashes.js': Hashes,

  // Beautify
  '@boop/vkBeautify': vkBeautifyShim,
  './lib/vkBeautify.js': vkBeautifyShim,
};

export function requireShim(moduleName: string): unknown {
  if (modules[moduleName]) {
    return modules[moduleName];
  }

  const cleanName = moduleName.split('/').pop()?.replace('.js', '');
  if (cleanName) {
    const found = Object.keys(modules).find((k) =>
      k.toLowerCase().includes(cleanName.toLowerCase())
    );
    if (found) return modules[found];
  }

  console.warn(`[RequireShim] Warning: Script requested unknown module '${moduleName}'`);
  return {};
}
