"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const agent_service_constants_1 = require("../services/agent-service-constants");
exports.DEFAULT_CONFIGURATION = {
    'version': 1.0,
    'snapshot': {
        'percy-css': '',
        'widths': [1280, 375],
        'min-height': 1024,
    },
    'agent': {
        'port': agent_service_constants_1.DEFAULT_PORT,
        'asset-discovery': {
            'request-headers': {},
            'allowed-hostnames': [],
            'network-idle-timeout': 50,
            'page-pool-size-min': 1,
            'page-pool-size-max': 5,
        },
    },
    'static-snapshots': {
        'path': '.',
        'base-url': '/',
        'snapshot-files': '**/*.html,**/*.htm',
        'ignore-files': '',
        'port': agent_service_constants_1.DEFAULT_PORT + 1,
    },
    'image-snapshots': {
        path: '.',
        files: '**/*.png,**/*.jpg,**/*.jpeg',
        ignore: '',
    },
};
