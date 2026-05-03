"use strict";
/*
 * Copyright (c) 2026 Broadcom.
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
exports.getCertVmArgs = getCertVmArgs;
const vscode = require("vscode");
function isStoreCertificatePresent(nativeCertificateStoreForWindows, nativeCertificateStoreForOSX) {
    const CERTIFICATE_STORE_NOT_INTERNAL = "Java internal certificate";
    return ((nativeCertificateStoreForWindows && nativeCertificateStoreForWindows !== CERTIFICATE_STORE_NOT_INTERNAL) ||
        (nativeCertificateStoreForOSX && nativeCertificateStoreForOSX.trustStoreType && nativeCertificateStoreForOSX.trustStore &&
            nativeCertificateStoreForOSX.trustStoreType !== CERTIFICATE_STORE_NOT_INTERNAL && nativeCertificateStoreForOSX.trustStore !== CERTIFICATE_STORE_NOT_INTERNAL));
}
;
function getCertVmArgs() {
    var _a;
    const nativeCertificateStoreForWindows = vscode.workspace.getConfiguration('debuggerForMainframe').get('nativeCertificateStoreForWindows');
    const nativeCertificateStoreForMacOS = vscode.workspace.getConfiguration('debuggerForMainframe').get('nativeCertificateStoreForMacOS');
    if (!isStoreCertificatePresent(nativeCertificateStoreForWindows, nativeCertificateStoreForMacOS)) {
        return [];
    }
    const osSpecificArgs = {
        // For macOS
        darwin: [
            "-Djavax.net.ssl.trustStoreType=" + nativeCertificateStoreForMacOS.trustStoreType,
            "-Djavax.net.ssl.trustStore=" + nativeCertificateStoreForMacOS.trustStore
        ],
        // For Windows
        win32: [
            "-Djavax.net.ssl.trustStoreType=" + nativeCertificateStoreForWindows
        ]
    };
    return (_a = osSpecificArgs[process.platform]) !== null && _a !== void 0 ? _a : [];
}
//# sourceMappingURL=CertStore.js.map