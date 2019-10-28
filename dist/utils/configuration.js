"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
// @ts-ignore missing type defs
const cosmiconfig = require("cosmiconfig");
const merge = require("deepmerge");
const util_1 = require("util");
const configuration_1 = require("../configuration/configuration");
const logger_1 = require("./logger");
const { isArray } = Array;
const { assign, keys } = Object;
exports.explorer = cosmiconfig('percy', {
    searchPlaces: [
        'package.json',
        '.percyrc',
        '.percy.json',
        '.percy.yaml',
        '.percy.yml',
        '.percy.js',
        'percy.config.js',
    ],
});
function removeUndefined(obj) {
    if (isArray(obj)) {
        return obj;
    }
    return keys(obj).reduce((o, key) => {
        const val = typeof obj[key] === 'object'
            ? removeUndefined(obj[key])
            : obj[key];
        return val !== undefined
            ? assign(o || {}, { [key]: val })
            : o;
    }, undefined);
}
function transform(flags, args) {
    return removeUndefined({
        'agent': {
            'port': flags.port,
            'asset-discovery': {
                'allowed-hostnames': flags['allowed-hostname'],
                'network-idle-timeout': flags['network-idle-timeout'],
            },
        },
        'static-snapshots': {
            'path': args.snapshotDirectory,
            'base-url': flags['base-url'],
            'snapshot-files': flags['snapshot-files'],
            'ignore-files': flags['ignore-files'],
        },
        'image-snapshots': {
            path: args.uploadDirectory,
            files: flags.files,
            ignore: flags.ignore,
        },
    });
}
function config(_a, args = {}) {
    var { config } = _a, flags = tslib_1.__rest(_a, ["config"]);
    let loaded;
    try {
        const result = config
            ? exports.explorer.loadSync(config)
            : exports.explorer.searchSync();
        if (result && result.config) {
            logger_1.default.debug(`Current config file path: ${result.filepath}`);
            loaded = result.config;
        }
        else {
            logger_1.default.debug('Config file not found');
        }
    }
    catch (error) {
        logger_1.default.debug(`Failed to load or parse config file: ${error}`);
    }
    const provided = transform(flags, args);
    const overrides = loaded && provided ? merge(loaded, provided) : (loaded || provided);
    if (overrides) {
        logger_1.default.debug(`Using config: ${util_1.inspect(overrides, { depth: null })}`);
    }
    return merge.all([configuration_1.DEFAULT_CONFIGURATION, overrides].filter(Boolean), 
    // overwrite default arrays, do not merge
    { arrayMerge: (_, arr) => arr });
}
exports.default = config;
