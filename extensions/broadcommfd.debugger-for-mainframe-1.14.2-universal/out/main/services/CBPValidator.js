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
exports.CBPValidator = void 0;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const vscode = require("vscode");
const path = require("path");
const Hlasm_1 = require("./EvaluatableExpressionService/languages/Hlasm");
const Cobol_1 = require("./EvaluatableExpressionService/languages/Cobol");
const KEYWORDS = [
    "R0", "R1", "R2", "R3", "R4",
    "R5", "R6", "R7", "R8", "R9",
    "R10", "R11", "R12", "R13",
    "R14", "R15", "CMAR", "CSA",
    "CURR", "CWA", "CWK", "DSA",
    "ITBE", "LCL", "MXR", "MXS",
    "OPFL", "PREV", "TAL", "TGT",
    "TIOA", "TWA"
];
const COBOL_CONSTANT = [
    "LOW-VALUES", "LOW-VALUE", "HIGH-VALUES",
    "HIGH-VALUE", "ZEROES", "ZEROS", "ZERO",
    "SPACES", "SPACE"
];
const literalRegEx = new Map([
    ["X'", "[0-9A-F]*"],
    ["P'", "([-]?[0-9]+)"],
    ["H'", "([-]?[0-9]{0,4})"],
    ["F'", "([-]?[0-9]{0,8})"],
]);
class CBPValidator {
    constructor() {
        this.idSourceBreakPointMapping = new Map();
    }
    processBreakpointChange(session) {
        return __awaiter(this, void 0, void 0, function* () {
            if (session.changed.length == 1) {
                if (!this.isEligibleForValidation(session.changed[0])) {
                    return;
                }
                if (session.changed[0].condition != null && session.changed[0].condition.trim() != "") {
                    const isASM = session.changed[0].location.uri.path.endsWith('.listing');
                    this.validateCondition(session.changed[0].condition, session.changed[0].id, isASM);
                }
                if (session.changed[0].hitCondition != null) {
                    this.validateHitCondition(session.changed[0].hitCondition, session.changed[0].id);
                }
                yield this.ifUpdateBpRequired(session.changed[0]);
            }
            else if (session.added.length == 1) {
                if (!this.isEligibleForValidation(session.added[0])) {
                    return;
                }
                if (session.added[0].condition != null) {
                    const isASM = session.added[0].location.uri.path.endsWith('.listing');
                    this.validateCondition(session.added[0].condition, session.added[0].id, isASM);
                }
                if (session.added[0].hitCondition != null) {
                    this.validateHitCondition(session.added[0].hitCondition, session.added[0].id);
                }
                const sb = session.added[0];
                const conditionHitCount = [sb.condition, sb.hitCondition, sb.logMessage];
                this.idSourceBreakPointMapping.set(session.added[0].id, conditionHitCount);
            }
            else {
                if (!this.isEligibleForValidation(session.removed[0])) {
                    return;
                }
                this.idSourceBreakPointMapping.delete(session.removed[0].id);
            }
        });
    }
    validateCondition(condition, id, isASM) {
        const operator = this.generateLiteralOperator(condition);
        const regex = isASM ? new Hlasm_1.Hlasm().regex : new Cobol_1.Cobol().regex;
        if (!this.isEmpty(condition) && !this.validateParts(condition.toUpperCase(), operator, regex)) {
            vscode.window.showInformationMessage("Syntax error in conditional breakpoint. Do you want to remove the breakpoint?", ...['Yes', 'No']).then(selection => {
                if (selection == "Yes") {
                    this.removeBreakPoint(id);
                }
            });
        }
    }
    validateParts(condtion, operator, regex) {
        if (operator == null)
            return false;
        const parts = condtion.split(operator);
        if (parts.length > 2) {
            return false;
        }
        const leftPart = parts[0];
        const rightPart = parts[1];
        if (regex === undefined)
            return true;
        return regex.test(leftPart.trim()) && this.validateRightPart(rightPart.trim(), regex);
    }
    validateRightPart(rightPart, regex) {
        return (regex.test(rightPart.trim()) && !rightPart.includes("'")) ||
            KEYWORDS.includes(rightPart) ||
            this.isLiteral(rightPart) ||
            COBOL_CONSTANT.includes(rightPart);
    }
    isLiteral(part) {
        if (part.endsWith("'")) {
            if (part.startsWith("C'") && part.endsWith("'")) {
                return true;
            }
            for (const key of literalRegEx.keys()) {
                if (part.startsWith(key)) {
                    const reg = literalRegEx.get(key);
                    return reg !== undefined && (part.substring(2, part.length - 1).match(reg));
                }
            }
        }
        return false;
    }
    generateLiteralOperator(condition) {
        const operators = ["!=", ",NE,", "<=", ",LE,", ">=", ",GE,", "<", ",LT,", ">", ",GT,", "=", ",EQ,"];
        for (const operator of operators) {
            if (condition.includes(operator))
                return operator;
        }
        return null;
    }
    validateHitCondition(condition, id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isEmpty(condition) && Number(condition) > 9999) {
                vscode.window.showErrorMessage("Hit count cannot be bigger than 9999");
                this.removeBreakPoint(id);
            }
        });
    }
    isEmpty(condition) {
        return (!condition || condition.trim().length === 0);
    }
    removeBreakPoint(id) {
        const removebpts = [];
        for (const b of vscode.debug.breakpoints) {
            if (b.id == id) {
                removebpts.push(b);
                vscode.debug.removeBreakpoints(removebpts);
            }
        }
    }
    isEligibleForValidation(breakpoint) {
        if (breakpoint instanceof vscode.SourceBreakpoint && this.workspaceFolder) {
            const sb = breakpoint;
            const fsPath = path.resolve(path.dirname(sb.location.uri.fsPath));
            const mainFolder = path.resolve(path.dirname(this.workspaceFolder));
            const relative = path.relative(mainFolder, fsPath);
            return mainFolder === fsPath || (relative && !relative.startsWith('..') && !path.isAbsolute(relative));
        }
        if (breakpoint instanceof vscode.FunctionBreakpoint)
            return false;
        return true;
    }
    /* Update of break points using custom request is required only if there are more than 2 conditions
    for the same line which is supported by vscode , but intertest doesnt so we need to make it invalid
    breakpoint*/
    ifUpdateBpRequired(sb) {
        return __awaiter(this, void 0, void 0, function* () {
            const condition = sb.condition;
            const hitCount = sb.hitCondition;
            const logMessage = sb.logMessage;
            const isValid = (s) => s !== undefined && s.trim() !== '';
            const count = [condition, hitCount, logMessage].filter(isValid).length;
            if (count >= 2) {
                const selection = yield vscode.window.showInformationMessage("Multi conditional breakpoint not allowed on one line. Do you want to remove the breakpoint?", 'Yes', 'No');
                if (selection === 'Yes') {
                    this.removeBreakPoint(sb.id);
                }
            }
        });
    }
}
exports.CBPValidator = CBPValidator;
//# sourceMappingURL=CBPValidator.js.map