"use strict";
/*
 * Copyright (c) 2025 Broadcom.
 * The term "Broadcom" refers to Broadcom Inc. and/or its subsidiaries.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Broadcom, Inc. - initial API and implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileUtils = void 0;
class ProfileUtils {
    static getAvailableProfiles(zoweExplorerApi) {
        let availableProfiles = [];
        if (!zoweExplorerApi)
            return availableProfiles;
        zoweExplorerApi.registeredApiTypes().forEach((profileType) => {
            var _a;
            availableProfiles = availableProfiles.concat((_a = zoweExplorerApi
                .getExplorerExtenderApi()
                .getProfilesCache()
                .getProfiles(profileType)) === null || _a === void 0 ? void 0 : _a.map((ele) => ele.name));
        });
        return availableProfiles;
    }
}
exports.ProfileUtils = ProfileUtils;
//# sourceMappingURL=ProfileUtils.js.map