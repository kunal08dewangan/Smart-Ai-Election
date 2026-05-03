"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariableOrderService = void 0;
const vscode = require("vscode");
class VariableOrderService {
    constructor(sessionSettingsMap) {
        this.sessionSettingsMap = sessionSettingsMap;
    }
    configVarSortOrder(variableOrder) {
        const isAlphabetic = variableOrder ? true : false;
        vscode.commands.executeCommand('setContext', 'isAlphabetic', isAlphabetic);
    }
    sendSortRequest(varOrder) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = vscode.debug.activeDebugSession;
            if (session) {
                this.configVarSortOrder(varOrder);
                const sessionSettings = this.sessionSettingsMap.get(session.id);
                if (sessionSettings) {
                    sessionSettings.setIsAlphabetic(varOrder);
                    this.sessionSettingsMap.set(session.id, sessionSettings);
                }
                session.customRequest('evaluate', {
                    expression: '/VARIABLE ORDER TOGGLE',
                    context: 'repl'
                });
            }
        });
    }
}
exports.VariableOrderService = VariableOrderService;
//# sourceMappingURL=VariableOrderService.js.map