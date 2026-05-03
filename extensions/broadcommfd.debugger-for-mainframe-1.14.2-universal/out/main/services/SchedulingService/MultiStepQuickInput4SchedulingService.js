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
exports.handleSchedulingActivity = handleSchedulingActivity;
const vscode = require("vscode");
const constants_1 = require("../../constants");
const SchedulingService_1 = require("./SchedulingService");
const SPACE = " ";
const TEXT_SEPARATOR = SPACE + "|" + SPACE;
let schedulingService;
let currentLaunchConfig;
let schedulingRows;
class SchedulingButton {
    constructor(iconPath, tooltip) {
        this.iconPath = iconPath;
        this.tooltip = tooltip;
    }
}
const insertButton = new SchedulingButton(new vscode.ThemeIcon("terminal-new"), "Insert");
const deleteButton = new SchedulingButton(new vscode.ThemeIcon("terminal-kill"), "Delete");
const title = "Scheduling Table";
function handleSchedulingActivity(launchConfigurationService, commandRunner) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        schedulingService = new SchedulingService_1.SchedulingService(commandRunner);
        try {
            currentLaunchConfig = yield launchConfigurationService.pickLaunchConfig(undefined, undefined, undefined, "Please select a launch configuration to fetch Scheduling Table");
            if (!currentLaunchConfig) {
                return;
            }
            if (!currentLaunchConfig.interTestPassword && !((_a = currentLaunchConfig.ssh) === null || _a === void 0 ? void 0 : _a.enabled)) {
                yield launchConfigurationService.populateLaunchConfiguration(currentLaunchConfig);
            }
            Object.freeze(currentLaunchConfig);
            schedulingRows = yield schedulingService.fetchAllEntries(currentLaunchConfig);
            if (schedulingRows) {
                yield MultiStepInput.run((input) => pickEntryorAddNew(input));
            }
        }
        catch (error) {
            if (error.message) {
                vscode.window.showErrorMessage(error.message);
            }
            else {
                vscode.window.showErrorMessage(error);
            }
        }
    });
}
function pickEntryorAddNew(input) {
    return __awaiter(this, void 0, void 0, function* () {
        const quickItems = [
            {
                label: "Add a new schedule entry",
                buttons: [insertButton],
            },
            {
                label: "",
                kind: vscode.QuickPickItemKind.Separator,
            },
        ];
        schedulingRows.forEach((row) => {
            quickItems.push({
                label: createLabel(row),
                buttons: [deleteButton],
                schedulingRow: row,
                alwaysShow: true,
            });
        });
        yield input.showQuickPick({
            title,
            step: 1,
            totalSteps: 1,
            placeholder: "Press 'Escape' to exit",
            items: quickItems,
            shouldResume: () => {
                return new Promise((resolve, reject) => {
                    // noop
                });
            },
        });
    });
}
function multiStepInput() {
    return __awaiter(this, void 0, void 0, function* () {
        let additionalSteps = 0;
        function collectInputs() {
            return __awaiter(this, void 0, void 0, function* () {
                const state = {};
                yield MultiStepInput.run((input) => selectDatabase(input, state));
                return state;
            });
        }
        function validateMaxLength(name) {
            return __awaiter(this, void 0, void 0, function* () {
                let message;
                const nameLength = name.length;
                message =
                    nameLength > 8
                        ? "This field can contain a maximum of eight characters."
                        : undefined;
                message =
                    name.trim().length != nameLength
                        ? "Empty spaces can not be used in the field."
                        : message;
                return message;
            });
        }
        function validateMaxLengthOrBlank(name) {
            return __awaiter(this, void 0, void 0, function* () {
                let message;
                if (name === undefined || name.trim().length === 0) {
                    message =
                        "This field can not be left blank or filled with empty spaces.";
                }
                else if (name.length > 8) {
                    message = "This field can contain a maximum of eight characters.";
                }
                else {
                    message = undefined;
                }
                return message;
            });
        }
        function selectDatabase(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                const databaseQuickPickItems = [
                    { label: constants_1.DB2 },
                    { label: constants_1.IMS },
                ];
                // TODO: Remember current value when navigating back.
                const pick = yield input.showQuickPick({
                    title,
                    step: 2,
                    totalSteps: 5,
                    placeholder: "Choose a database",
                    items: databaseQuickPickItems,
                    shouldResume: shouldResume,
                });
                if (pick.label === "IMS") {
                    additionalSteps = 2;
                    state.database = "IMS";
                }
                else if (pick.label === "DB2") {
                    additionalSteps = 0;
                    state.database = "DB2";
                }
                return (input) => inputJobName(input, state);
            });
        }
        function inputJobName(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                state.jobName = yield input.showInputBox({
                    title,
                    step: 3,
                    totalSteps: 5 + additionalSteps,
                    prompt: "Specifies an IMS region name or z/OS job name that is commonly associated with the program name to be monitored.",
                    placeholder: "Job Name",
                    value: state.jobName || "",
                    validate: validateMaxLength,
                    shouldResume: shouldResume,
                });
                return (input) => inputProgram(input, state);
            });
        }
        function inputProgram(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                state.program = yield input.showInputBox({
                    title,
                    step: 4,
                    totalSteps: 5 + additionalSteps,
                    prompt: "Requires a valid program name (DB2 SP name or IMS/DC name) you want to monitor during your debugging session.",
                    placeholder: "Program",
                    value: state.program || "",
                    validate: validateMaxLengthOrBlank,
                    shouldResume: shouldResume,
                });
                if (state.database === "IMS") {
                    return (input) => inputImsTransaction(input, state);
                }
                return (input) => pickOneTime(input, state);
            });
        }
        function inputImsTransaction(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                state.imsTransaction = yield input.showInputBox({
                    title,
                    step: 5,
                    totalSteps: 7,
                    prompt: "IMS Transaction - This field can make use of the * character to indicate a partial name.",
                    placeholder: "IMS Transaction",
                    value: state.imsTransaction || "*",
                    validate: validateMaxLength,
                    shouldResume: shouldResume,
                });
                state.imsTransaction =
                    state.imsTransaction.length === 0 ? "*" : state.imsTransaction;
                return (input) => inputUserID(input, state);
            });
        }
        function inputUserID(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                state.imsUserID = yield input.showInputBox({
                    title,
                    step: 6,
                    totalSteps: 7,
                    prompt: "User ID - This field can make use of the * character to indicate a partial name.",
                    placeholder: "User ID",
                    value: state.imsUserID || "*",
                    validate: validateMaxLength,
                    shouldResume: shouldResume,
                });
                state.imsUserID = state.imsUserID.length === 0 ? "*" : state.imsUserID;
                return (input) => pickOneTime(input, state);
            });
        }
        function pickOneTime(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                const oneTimeQuickPickItems = [
                    { label: "$(circle-small) One-time entry" },
                    { label: "$(issue-reopened) Recurring entry" },
                ];
                const pick = yield input.showQuickPick({
                    title,
                    step: 5 + additionalSteps,
                    totalSteps: 5 + additionalSteps,
                    placeholder: "Is this a one-time or recurring entry?",
                    items: oneTimeQuickPickItems,
                    shouldResume: shouldResume,
                });
                if (pick.label === "$(circle-small) One-time entry") {
                    state.onetime = true;
                }
                else {
                    state.onetime = false;
                }
            });
        }
        function shouldResume() {
            // Could show a notification with the option to resume.
            return new Promise((resolve, reject) => {
                // noop
            });
        }
        const response = yield collectInputs();
        const res = {
            database: response.database,
            editFlag: 0,
            imsTransaction: response.imsTransaction,
            imsUserId: response.imsUserID,
            jobName: response.jobName,
            program: response.program,
            seqNo: "",
            onetime: response.onetime,
        };
        return res;
    });
}
var InputFlowAction;
(function (InputFlowAction) {
    InputFlowAction[InputFlowAction["BACK"] = 0] = "BACK";
    InputFlowAction[InputFlowAction["CANCEL"] = 1] = "CANCEL";
    InputFlowAction[InputFlowAction["RESUME"] = 2] = "RESUME";
})(InputFlowAction || (InputFlowAction = {}));
class MultiStepInput {
    constructor() {
        this.steps = [];
    }
    static run(start) {
        return __awaiter(this, void 0, void 0, function* () {
            const input = new MultiStepInput();
            return input.stepThrough(start);
        });
    }
    stepThrough(start) {
        return __awaiter(this, void 0, void 0, function* () {
            let step = start;
            while (step) {
                this.steps.push(step);
                if (this.current) {
                    this.current.enabled = false;
                    this.current.busy = true;
                }
                try {
                    step = yield step(this);
                }
                catch (err) {
                    if (err === InputFlowAction.BACK) {
                        this.steps.pop();
                        step = this.steps.pop();
                    }
                    else if (err === InputFlowAction.RESUME) {
                        step = this.steps.pop();
                    }
                    else if (err === InputFlowAction.CANCEL) {
                        step = undefined;
                    }
                    else {
                        throw err;
                    }
                }
            }
            if (this.current) {
                this.current.dispose();
            }
        });
    }
    showQuickPick(_a) {
        return __awaiter(this, arguments, void 0, function* ({ title, step, totalSteps, items, activeItem, placeholder, buttons, shouldResume, }) {
            const disposables = [];
            try {
                return yield new Promise((resolve, reject) => {
                    const input = vscode.window.createQuickPick();
                    input.title = title;
                    input.step = step;
                    input.totalSteps = totalSteps;
                    input.placeholder = placeholder;
                    input.items = items;
                    input.ignoreFocusOut = true;
                    if (activeItem) {
                        input.activeItems = [activeItem];
                    }
                    input.buttons = [
                        ...(this.steps.length > 1
                            ? [vscode.QuickInputButtons.Back]
                            : []),
                        ...(buttons || []),
                    ];
                    disposables.push(input.onDidTriggerItemButton((item) => __awaiter(this, void 0, void 0, function* () {
                        const msg = "Delete " +
                            item.item.label
                                .replace("$(issue-reopened)", "")
                                .replace("$(circle-small)", "") +
                            "?";
                        if (item.button instanceof SchedulingButton &&
                            item.button.tooltip === "Delete") {
                            vscode.window
                                .showWarningMessage(msg, { modal: true }, ...["Delete"])
                                .then((answer) => __awaiter(this, void 0, void 0, function* () {
                                if (answer === "Delete") {
                                    const objToDelete = schedulingRows.find((elem) => elem === item.item.schedulingRow);
                                    if (!currentLaunchConfig ||
                                        !objToDelete) {
                                        return;
                                    }
                                    const res = yield schedulingService.deleteEntry(currentLaunchConfig, objToDelete);
                                    if (res) {
                                        const index = items.findIndex((object) => {
                                            return object === item.item;
                                        });
                                        if (index !== -1) {
                                            items.splice(index, 1);
                                            input.items = items;
                                        }
                                    }
                                }
                            }));
                        }
                        else if (item.button instanceof SchedulingButton &&
                            item.button.tooltip === "Insert") {
                            const objToInsert = yield multiStepInput();
                            if (!currentLaunchConfig || !objToInsert) {
                                return;
                            }
                            const result = yield schedulingService.insertEntry(currentLaunchConfig, objToInsert);
                            if (result) {
                                schedulingRows = result;
                                yield MultiStepInput.run((input) => pickEntryorAddNew(input));
                            }
                        }
                    })), input.onDidTriggerButton((item) => {
                        if (item === vscode.QuickInputButtons.Back) {
                            reject(InputFlowAction.BACK);
                        }
                        else {
                            resolve(item);
                        }
                    }), input.onDidChangeSelection((selection) => __awaiter(this, void 0, void 0, function* () {
                        var _a, _b;
                        if ((_b = (_a = selection[0]) === null || _a === void 0 ? void 0 : _a.buttons) === null || _b === void 0 ? void 0 : _b.includes(insertButton)) {
                            const objToInsert = yield multiStepInput();
                            if (!currentLaunchConfig || !objToInsert) {
                                return;
                            }
                            const result = yield schedulingService.insertEntry(currentLaunchConfig, objToInsert);
                            if (result) {
                                schedulingRows = result;
                                yield MultiStepInput.run((input) => pickEntryorAddNew(input));
                            }
                        }
                        else if (!selection[0].label.includes("Job")) {
                            resolve(selection[0]);
                        }
                    })), input.onDidHide(() => {
                        (() => __awaiter(this, void 0, void 0, function* () {
                            reject(shouldResume && (yield shouldResume())
                                ? InputFlowAction.RESUME
                                : InputFlowAction.CANCEL);
                        }))().catch(reject);
                    }));
                    if (this.current) {
                        this.current.dispose();
                    }
                    this.current = input;
                    this.current.show();
                });
            }
            finally {
                disposables.forEach((d) => d.dispose());
            }
        });
    }
    showInputBox(_a) {
        return __awaiter(this, arguments, void 0, function* ({ title, step, totalSteps, value, prompt, placeholder, validate, buttons, shouldResume, }) {
            const disposables = [];
            try {
                return yield new Promise((resolve, reject) => {
                    const input = vscode.window.createInputBox();
                    input.title = title;
                    input.step = step;
                    input.totalSteps = totalSteps;
                    input.value = value || "";
                    input.prompt = prompt;
                    input.placeholder = placeholder;
                    input.ignoreFocusOut = true;
                    input.buttons = [
                        ...(this.steps.length > 1
                            ? [vscode.QuickInputButtons.Back]
                            : []),
                        ...(buttons || []),
                    ];
                    let validating = validate("");
                    disposables.push(input.onDidTriggerButton((item) => {
                        if (item === vscode.QuickInputButtons.Back) {
                            reject(InputFlowAction.BACK);
                        }
                        else {
                            resolve(item);
                        }
                    }), input.onDidAccept(() => __awaiter(this, void 0, void 0, function* () {
                        const value = input.value;
                        input.enabled = false;
                        input.busy = true;
                        const validationMessage = validate(value);
                        if (!(yield validationMessage)) {
                            resolve(value);
                        }
                        else {
                            input.validationMessage = yield validationMessage;
                        }
                        input.enabled = true;
                        input.busy = false;
                    })), input.onDidChangeValue((text) => __awaiter(this, void 0, void 0, function* () {
                        const current = validate(text);
                        validating = current;
                        const validationMessage = yield current;
                        if (current === validating) {
                            input.validationMessage = validationMessage;
                        }
                    })), input.onDidHide(() => {
                        (() => __awaiter(this, void 0, void 0, function* () {
                            reject(shouldResume && (yield shouldResume())
                                ? InputFlowAction.RESUME
                                : InputFlowAction.CANCEL);
                        }))().catch(reject);
                    }));
                    if (this.current) {
                        this.current.dispose();
                    }
                    this.current = input;
                    this.current.show();
                });
            }
            finally {
                disposables.forEach((d) => d.dispose());
            }
        });
    }
}
function createLabel(row) {
    let result = "";
    if (!row.onetime) {
        result += "$(issue-reopened)";
    }
    else {
        result += "$(circle-small)";
    }
    result +=
        SPACE +
            "[" +
            row.database +
            "]" +
            SPACE +
            "Job:" +
            SPACE +
            row.jobName +
            TEXT_SEPARATOR +
            "Pgm:" +
            SPACE +
            row.program;
    if (row.database === "IMS") {
        result +=
            TEXT_SEPARATOR +
                "Transaction:" +
                SPACE +
                row.imsTransaction +
                TEXT_SEPARATOR +
                "User:" +
                SPACE +
                row.imsUserId;
    }
    return result;
}
//# sourceMappingURL=MultiStepQuickInput4SchedulingService.js.map