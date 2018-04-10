"use strict";
var RequestManifest = /** @class */ (function () {
    function RequestManifest() {
    }
    /**
     * Capture a list of URLs for resources requested by this page.
     */
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
        var requestManifest = new RequestManifest();
        console.log('TAKING SNAPSHOT\n' +
            ("name: " + name + "\n") +
            ("enableJavascript: " + options.enableJavascript + ".\n") +
            ("widths: " + options.widths + ".\n") +
            ("clientUserAgent: " + this.clientUserAgent + ".\n") +
            ("requestManifest: " + requestManifest.capture() + "\n") +
            ("domSnapshot: " + this.domSnapshot()));
    };
    Percy.prototype.domSnapshot = function () {
        var doctype = this.getDoctype();
        var dom = document.documentElement.outerHTML;
        return doctype + dom;
    };
    Percy.prototype.getDoctype = function () {
        return document.doctype.name ? this.doctypeToString(document.doctype) : this.defaultDoctype;
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
// Run this on test page:
// var beforeSnapshot = function() { console.log('beforeSnapshot'); };
// var percy = new Percy('dave agent');
// percy.snapshot('my snapshot', { enable_javascript: false, widths: [300, 500] });
