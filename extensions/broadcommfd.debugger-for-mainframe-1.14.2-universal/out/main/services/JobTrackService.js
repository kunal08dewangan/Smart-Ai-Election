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
exports.JobTrackService = exports.CLOSE = exports.INSTALL = exports.ZOWE_EXP_EXT_ID = void 0;
const vscode = require("vscode");
exports.ZOWE_EXP_EXT_ID = "Zowe.vscode-extension-for-zowe";
exports.INSTALL = "Install";
exports.CLOSE = "Close";
class JobTrackService {
    showJobInfoMessage(jobId, zoweProfileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const zoweExt = vscode.extensions.getExtension(exports.ZOWE_EXP_EXT_ID);
            if (zoweExt) {
                yield (zoweExt === null || zoweExt === void 0 ? void 0 : zoweExt.activate());
                if (!zoweProfileName) {
                    zoweProfileName = yield vscode.window.showInputBox({
                        ignoreFocusOut: false,
                        placeHolder: "Enter Zowe Profile Name",
                    });
                }
                vscode.commands.executeCommand("zowe.jobs.setJobSpool", zoweProfileName, jobId);
            }
            else {
                const choice = yield vscode.window.showInformationMessage("Install Zowe Explorer to track the status of submitted jobs.", exports.INSTALL, exports.CLOSE);
                if (choice === exports.INSTALL) {
                    yield vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, (p) => __awaiter(this, void 0, void 0, function* () {
                        p.report({
                            message: "Installing Zowe Explorer ...",
                        });
                        yield vscode.commands.executeCommand("workbench.extensions.installExtension", exports.ZOWE_EXP_EXT_ID);
                    }));
                    yield vscode.commands.executeCommand("extension.open", exports.ZOWE_EXP_EXT_ID);
                }
            }
        });
    }
}
exports.JobTrackService = JobTrackService;
//# sourceMappingURL=JobTrackService.js.map