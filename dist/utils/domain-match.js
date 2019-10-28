"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
function domainCheck(domain, host, isWild) {
    if (domain === host) {
        return true;
    }
    if (isWild && host) {
        const last = host.lastIndexOf(domain);
        return (last >= 0 && ((last + domain.length) === host.length));
    }
    return false;
}
function pathCheck(pathprefix, pathname) {
    return pathname.indexOf(pathprefix) === 0;
}
function domainMatch(pattern, siteUrl) {
    if (pattern === '*') {
        return true;
    }
    else if (!pattern) {
        return false;
    }
    const isWild = ((pattern.indexOf('*.') === 0) || (pattern.indexOf('*/') === 0));
    // tslint:disable-next-line
    let slashed = pattern.split('/'); // tslint wants this to be `const` even though it's mutated
    let domain = slashed.shift();
    const pathprefix = `/${slashed.join('/')}`;
    const parsedUrl = new url_1.URL(siteUrl);
    if (isWild) {
        domain = domain.substr(2);
    }
    return (domainCheck(domain, parsedUrl.hostname, isWild) && pathCheck(pathprefix, parsedUrl.pathname));
}
exports.default = domainMatch;
