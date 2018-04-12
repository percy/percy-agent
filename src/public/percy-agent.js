"use strict";
var RequestManifest = /** @class */ (function () {
    function RequestManifest() {
    }
    RequestManifest.prototype.capture = function () {
        var requests = performance.getEntriesByType('resource');
        return requests.map(function (request) { return request.name; });
    };
    return RequestManifest;
}());
var Percy = /** @class */ (function () {
    function Percy(clientUserAgent, beforeSnapshot) {
        this.defaultDoctype = '<!DOCTYPE html>';
        this.clientUserAgent = clientUserAgent || null;
        this.beforeSnapshot = beforeSnapshot || null;
    }
    Percy.prototype.snapshot = function (name, options) {
        if (this.beforeSnapshot) {
            this.beforeSnapshot();
        }
        this.stabalizePage();
        var requestManifest = new RequestManifest().capture();
        var domSnapshot = this.domSnapshot();
        var percyAgent = new PercyAgent();
        percyAgent.post('http://localhost:5338/percy/snapshot', {
            name: name,
            enableJavascript: options.enableJavascript,
            widths: options.widths,
            clientUserAgent: this.clientUserAgent,
            requestManifest: requestManifest,
            domSnapshot: domSnapshot
        });
    };
    Percy.prototype.domSnapshot = function () {
        var doctype = this.getDoctype();
        var dom = document.documentElement.outerHTML;
        return doctype + dom;
    };
    Percy.prototype.getDoctype = function () {
        return document.doctype ? this.doctypeToString(document.doctype) : this.defaultDoctype;
    };
    Percy.prototype.doctypeToString = function (doctype) {
        var publicDeclaration = doctype.publicId ? " PUBLIC \"" + doctype.publicId + "\" " : '';
        var systemDeclaration = doctype.systemId ? " SYSTEM \"" + doctype.systemId + "\" " : '';
        return "<!DOCTYPE " + doctype.name + publicDeclaration + systemDeclaration + '>';
    };
    Percy.prototype.stabalizePage = function () {
        // Apply various hacks to the pages
        // freeze jQuery etc.
    };
    return Percy;
}());
var PercyAgent = /** @class */ (function () {
    function PercyAgent() {
    }
    PercyAgent.prototype.post = function (url, data) {
        var xhr = new XMLHttpRequest();
        xhr.open('post', url, false); // synchronous request
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(data));
    };
    return PercyAgent;
}());
