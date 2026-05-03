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
exports.PasswordStorage = void 0;
exports.passInputBox = passInputBox;
exports.passCicsInputBox = passCicsInputBox;
const vscode = require("vscode");
class PasswordStorage {
    constructor() {
        this.passwords = {};
        this.cicsPasswords = {};
    }
    put(host, port, username, password) {
        this.passwords[this.makeKey(host, port, username)] = password;
    }
    putCics(host, port, username, password) {
        this.cicsPasswords[this.makeKey(host, port, username)] = password;
    }
    get(host, port, username) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.passwords[this.makeKey(host, port, username)]) {
                return this.passwords[this.makeKey(host, port, username)];
            }
            const newPassword = yield passInputBox();
            if (newPassword) {
                this.put(host, port, username, newPassword);
            }
            return newPassword;
        });
    }
    getCics(host, port, username) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.cicsPasswords[this.makeKey(host, port, username)]) {
                return this.cicsPasswords[this.makeKey(host, port, username)];
            }
            const newPassword = yield passCicsInputBox();
            if (newPassword) {
                this.putCics(host, port, username, newPassword);
            }
            return newPassword;
        });
    }
    reset(host, port, username) {
        delete this.passwords[this.makeKey(host, port, username)];
    }
    resetCics(host, port, username) {
        delete this.cicsPasswords[this.makeKey(host, port, username)];
    }
    resetAll() {
        this.passwords = {};
        this.cicsPasswords = {};
    }
    makeKey(host, port, username) {
        return `${username === null || username === void 0 ? void 0 : username.toLocaleUpperCase()}@${host}:${port}`;
    }
}
exports.PasswordStorage = PasswordStorage;
function passInputBox() {
    return vscode.window.showInputBox({
        password: true,
        placeHolder: "Please enter mainframe password",
        value: "",
        ignoreFocusOut: true
    });
}
function passCicsInputBox() {
    return vscode.window.showInputBox({
        password: true,
        placeHolder: "Please enter cics password",
        value: "",
    });
}
//# sourceMappingURL=PasswordStorage.js.map