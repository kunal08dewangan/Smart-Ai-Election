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
exports.showQuickPick = showQuickPick;
exports.symbolicSelection = symbolicSelection;
exports.formatTimeStamp = formatTimeStamp;
const vscode = require("vscode");
const constants_1 = require("../constants");
const SYMBOLIC_REQUEST = "/symbolic opted";
function showQuickPick(symbolicOptions, session) {
    return __awaiter(this, void 0, void 0, function* () {
        const buttonOptions = [
            { title: constants_1.YES },
            { title: constants_1.NO, isCloseAffordance: true },
        ];
        const response = yield vscode.window.showWarningMessage(constants_1.SYMBOLIC_NOT_MATCHED + ". " + constants_1.CONTINUE_OR_NOT, ...buttonOptions);
        if (!response || response.title === constants_1.NO) {
            yield cancelSymbolicSelection(session);
            return;
        }
        const protsyms = symbolicOptions.protsyms;
        const symbolicList = protsyms.map((protsym) => ({
            label: formatTimeStamp(parseInt(protsym.date), parseInt(protsym.time)) +
                "  " +
                protsym.DSN,
        }));
        const optionSelected = yield vscode.window.showQuickPick(symbolicList, {
            placeHolder: symbolicOptions.program +
                " " +
                "timestamp is" +
                " " +
                formatTimeStamp(parseInt(symbolicOptions.date), parseInt(symbolicOptions.date)),
            ignoreFocusOut: true,
        });
        const index = symbolicList.findIndex((item) => item.label === (optionSelected === null || optionSelected === void 0 ? void 0 : optionSelected.label));
        if (index < 0) {
            yield cancelSymbolicSelection(session);
            return;
        }
        yield symbolicSelection(session, protsyms[index]);
    });
}
function symbolicSelection(session, protsym) {
    return __awaiter(this, void 0, void 0, function* () {
        yield session.customRequest("evaluate", {
            context: "repl",
            expression: SYMBOLIC_REQUEST + (protsym != null ? JSON.stringify(protsym) : ""),
        });
    });
}
function cancelSymbolicSelection(session) {
    return __awaiter(this, void 0, void 0, function* () {
        yield symbolicSelection(session, undefined);
    });
}
function formatTimeStamp(date, time) {
    if (date === 0) {
        return "Unknown date";
    }
    else {
        let calendar = new Date();
        calendar.setUTCFullYear(date / 1000);
        const thisYear = calendar.getUTCFullYear() - 2000;
        let year = date / 1000;
        year += year > thisYear && year > 60 ? 1900 : 2000;
        const day = date % 1000;
        const hour = Math.floor(time / 10000);
        const minute = Math.floor((time % 10000) / 100);
        const sec = time % 100;
        calendar = new Date(Date.UTC(year, 0));
        calendar.setUTCDate(day); // Set the day of the year
        calendar.setUTCHours(hour);
        calendar.setUTCMinutes(minute);
        calendar.setUTCSeconds(sec);
        const df = new Intl.DateTimeFormat("en", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone: "GMT",
        });
        return df.format(calendar);
    }
}
//# sourceMappingURL=SymbolicSelector.js.map