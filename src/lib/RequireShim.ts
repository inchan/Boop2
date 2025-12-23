import _ from 'lodash';
import he from 'he';
import yaml from 'js-yaml';
import Papa from 'papaparse';
// @ts-ignore
import Hashes from 'jshashes';
// @ts-ignore
import vkbeautify from 'vkbeautify';

// Base64 Wrapper
const Base64 = {
    encode: (s: string) => btoa(s),
    decode: (s: string) => atob(s),
};

// Mapping Boop's expected file paths to actual library instances
const modules: Record<string, any> = {
    // Lodash
    'lodash': _,
    '@boop/lodash.boop': _,
    './lib/lodash.boop.js': _, // Legacy path support

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

    // Beautify (XML, SQL, CSS)
    '@boop/vkBeautify': vkbeautify,
    './lib/vkBeautify.js': vkbeautify,
};

export function requireShim(moduleName: string): any {
    if (modules[moduleName]) {
        return modules[moduleName];
    }
    
    // Fallback for relative paths trying to find these libs
    const cleanName = moduleName.split('/').pop()?.replace('.js', '');
    if (cleanName) {
        // Find by fuzzy match keys
        const found = Object.keys(modules).find(k => k.includes(cleanName));
        if (found) return modules[found];
    }
    
    console.warn(`[RequireShim] Warning: Script requested unknown module '${moduleName}'`);
    return {};
}