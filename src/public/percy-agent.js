define("percy", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var Percy = /** @class */ (function () {
        function Percy(clientUserAgent) {
            this.clientUserAgent = clientUserAgent || null;
        }
        Percy.prototype.snapshot = function (name, options) {
            console.log("taking snapshot " + name + ". js: " + options.enable_javascript + ". widths: " + options.widths);
        };
        return Percy;
    }());
    exports["default"] = Percy;
});
