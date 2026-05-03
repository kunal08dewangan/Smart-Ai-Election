"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryReporterService = void 0;
const extension_telemetry_1 = require("@vscode/extension-telemetry");
const vscode = require("vscode");
let _context;
const insightsKey = "0d44439e-9bcc-47b9-b5ac-370870330e0f";
class TelemetryReporterService extends extension_telemetry_1.default {
    constructor(context, replacementOptions) {
        super(insightsKey, replacementOptions);
        _context = context;
    }
    sendTelemetryEvent(eventName, properties, measurements) {
        if (this.isLocalDebugServer())
            return;
        else {
            super.sendTelemetryEvent(eventName, properties, measurements);
        }
    }
    sendTelemetryErrorEvent(eventName, properties, measurements) {
        if (this.isLocalDebugServer())
            return;
        else {
            super.sendTelemetryErrorEvent(eventName, properties, measurements);
        }
    }
    isLocalDebugServer() {
        var _a;
        if ((_a = vscode.debug.activeDebugSession) === null || _a === void 0 ? void 0 : _a.configuration.debugServer) {
            return true;
        }
        if (_context && _context.extensionMode === vscode.ExtensionMode.Production) {
            return false;
        }
        return true;
    }
    static get Instance() {
        return this._instance || (this._instance = new this(_context));
    }
}
exports.TelemetryReporterService = TelemetryReporterService;
//# sourceMappingURL=TelemetryReporterService.js.map