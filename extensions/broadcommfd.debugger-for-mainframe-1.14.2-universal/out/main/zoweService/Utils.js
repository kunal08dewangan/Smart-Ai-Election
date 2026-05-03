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
exports.Utils = void 0;
exports.extractApi = extractApi;
exports.asAPI = asAPI;
exports.getExtensionApi = getExtensionApi;
exports.getZowe = getZowe;
exports.getTokenFromZoweProfile = getTokenFromZoweProfile;
const vscode = require("vscode");
const JobTrackService_1 = require("../services/JobTrackService");
const constants_1 = require("../constants");
const ProfileUtils_1 = require("./ProfileUtils");
function safeActivate(ext) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield ext.activate();
        }
        catch (_) {
            // ignored
        }
    });
}
function extractApi(ext, validate) {
    return __awaiter(this, void 0, void 0, function* () {
        const api = ext.isActive ? ext.exports : yield safeActivate(ext);
        if (!validate(api))
            return undefined;
        return api;
    });
}
function asAPI(api) {
    if (api)
        return { api };
    return undefined;
}
function getExtensionApi(extName, validate) {
    return __awaiter(this, void 0, void 0, function* () {
        const ext = vscode.extensions.getExtension(JobTrackService_1.ZOWE_EXP_EXT_ID);
        if (ext) {
            return asAPI(yield extractApi(ext, validate));
        }
        return {
            futureApi: new Promise((res, _) => {
                const extAdded = vscode.extensions.onDidChange(() => {
                    if (!ext)
                        return;
                    extAdded.dispose();
                    void extractApi(ext, validate).then((api) => res(asAPI(api)));
                });
            }),
        };
    });
}
/**
 * This class collects utility methods for general purpose activities
 */
class Utils {
    static getZoweExplorerAPI() {
        return __awaiter(this, void 0, void 0, function* () {
            return getExtensionApi("Zowe.vscode-extension-for-zowe", (api) => !!api);
        });
    }
}
exports.Utils = Utils;
function getZowe(zoweProfileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const maybeZowe = yield Utils.getZoweExplorerAPI();
        if (maybeZowe && "api" in maybeZowe) {
            const api = maybeZowe.api;
            const profiles = ProfileUtils_1.ProfileUtils.getAvailableProfiles(maybeZowe.api);
            if (!profiles.includes(zoweProfileName)) {
                return;
            }
            const exploererExtendedApi = api.getExplorerExtenderApi();
            return exploererExtendedApi.getProfilesCache().loadNamedProfile(zoweProfileName).profile;
        }
    });
}
function getTokenFromZoweProfile(zoweProfile) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokenType = zoweProfile.tokenType;
        const tokenValue = zoweProfile.tokenValue;
        if (tokenType && tokenType === constants_1.TOKEN_TYPE_APIML) {
            return tokenValue;
        }
        return;
    });
}
//# sourceMappingURL=Utils.js.map