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
exports.SSHConnector = void 0;
const constants_1 = require("../constants");
const ssh2 = require("ssh2");
const fs_1 = require("fs");
const crypto_1 = require("crypto");
const vscode = require("vscode");
const path = require("path");
const assert_1 = require("assert");
class SSHConnector {
    constructor(configuration, extensionPath, passwordStorage, outputChannel) {
        var _a;
        this.configuration = configuration;
        this.extensionPath = extensionPath;
        this.passwordStorage = passwordStorage;
        this.outputChannel = outputChannel;
        this.COMMAND = "-Xms128m -Xmx256m -Dfile.encoding=COMPAT";
        this.SSH_MAIN_CLASS = "com.broadcom.idas.Main";
        this.RUNNING_OPTION = "-cp";
        this.javaOpts = ""; // "-agentlib:jdwp=transport=dt_socket,server=y,suspend=y,address=4748,quiet=y";
        this.idasRunning = false;
        this.HLQ_KEY = "HLQ";
        this.PROFILE_DATASET_KEY = "PROFILE_DATASET";
        this.BLSPORT_KEY = "BLSPORT";
        this.BLSPORT_RANGE_KEY = "BLSPORT_RANGE";
        this.CCI_FAMILY_ID_KEY = "CCI_FAMILY_ID";
        this.PROGRAM_PARAMS = "";
        this.INTERTEST_TCP_ENABLED_KEY = "INTERTEST_TCP_ENABLED";
        this.INTERTEST_CCI_ENABLED_KEY = "INTERTEST_CCI_ENABLED";
        this.tcpEnabled = true;
        this.cciEnabled = false;
        this.stream = null;
        this.closeConnection = false;
        this.connected = false;
        this.JAR_NAME = "idas.jar";
        // Note: The index parameter is no longer required in the function signature.
        this.tryConnect = (keys, configuration) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // 1. ITERATE THROUGH KEYS
            for (const keyPath of ((_a = configuration.ssh) === null || _a === void 0 ? void 0 : _a.privateKeyPath) ? [path.resolve((_b = configuration.ssh) === null || _b === void 0 ? void 0 : _b.privateKeyPath.toString()), ...keys] : keys) {
                try {
                    // Attempt to read the private key file
                    const privateKey = (0, fs_1.readFileSync)(keyPath);
                    this.connectionConfig.privateKey = privateKey;
                    return yield this.getConnection(configuration);
                }
                catch (error) {
                    continue;
                }
            }
            vscode.window.showInformationMessage(constants_1.THERE_IS_NO_SSH_KEYS_FOR_AUTH);
            let password = configuration.interTestPassword;
            if (!password && this.connectionConfig.host && this.connectionConfig.port && this.connectionConfig.username) {
                // Attempt to retrieve password from storage
                password = yield this.passwordStorage.get(this.connectionConfig.host, this.connectionConfig.port, this.connectionConfig.username);
            }
            if (!password) {
                // If still no password, we must give up.
                throw Error("No password provided and all SSH keys failed.");
            }
            // Set configuration for password authentication
            this.connectionConfig.password = password;
            this.connectionConfig.privateKey = undefined; // Crucial: Clear private key config
            // 3. FINAL CONNECTION ATTEMPT (using password)
            return yield this.getConnection(configuration);
        });
        this.pathToJar = path.join(this.extensionPath, "bin", this.JAR_NAME);
        this.idasJarPathOnMF = "";
        this.workingDirectory = "";
        this.idasJarVersionPathOnMF = "";
        let sshPort = 22;
        if ((_a = configuration.ssh) === null || _a === void 0 ? void 0 : _a.sshPort) {
            sshPort = configuration.ssh.sshPort;
        }
        this.connectionConfig = {
            host: configuration.host,
            port: sshPort,
            username: configuration.interTestUserName,
            keepaliveInterval: 30000,
            keepaliveCountMax: 10,
        };
    }
    getConnection(configuration) {
        return new Promise((resolve, reject) => {
            const conn = new ssh2.Client();
            conn.connect(this.connectionConfig);
            conn.on("ready", () => __awaiter(this, void 0, void 0, function* () {
                this.connection = conn;
                this.setConnected(true);
                try {
                    this.sftp = yield this.getSftp(conn);
                    yield this.setupRunningJarEnvironment(configuration);
                    resolve(conn);
                }
                catch (err) {
                    reject(err);
                }
            }));
            conn.on("error", (err) => __awaiter(this, void 0, void 0, function* () {
                const error = this.generateErrorMessage(err);
                reject(error);
            }));
            conn.on("end", () => __awaiter(this, void 0, void 0, function* () {
                this.displayCloseMessage(constants_1.SSH_CONNECTION_CLOSED);
                if (!this.isConnected() && !this.closeConnection) {
                    reject("connection not established");
                }
                this.sftp.end();
                this.setConnected(false);
                this.setIdasRunning(false);
            }));
        });
    }
    getSftp(conn) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                conn.sftp((err, sftp) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        console.log('SFTP ready');
                        resolve(sftp);
                    }
                });
            });
        });
    }
    getStream(configuration) {
        return __awaiter(this, void 0, void 0, function* () {
            this.initialize(configuration);
            try {
                // We try to connect here. If it fails (rejects), code jumps to 'catch'.
                const connection = yield this.tryConnect(constants_1.SSH_KEYS, configuration);
                return yield this.uploadJarAndRunJava(connection);
            }
            catch (error) {
                // THIS CATCH BLOCK HANDLES THE REJECTION
                console.error("❌ SSH Connection Failed:", error);
                // Optionally show a message to the user in VS Code
                throw error;
            }
        });
    }
    uploadJarAndRunJava(conn) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Checking IDAS jar file",
                }, (progress, token) => __awaiter(this, void 0, void 0, function* () {
                    yield this.copyJarFile(progress);
                }));
                return yield this.runJava(conn);
            }
            catch (error) {
                conn === null || conn === void 0 ? void 0 : conn.end();
                throw error;
            }
        });
    }
    setupRunningJarEnvironment(configuration) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if ((_a = configuration.ssh) === null || _a === void 0 ? void 0 : _a.ussWorkingDirectory) {
                this.workingDirectory = configuration.ssh.ussWorkingDirectory.replace(/\\/g, '/');
            }
            const exists = this.workingDirectory.trim().length > 0 && (yield this.existOnMF(this.workingDirectory));
            const currentWorkingDirectory = yield this.cwd();
            if (!exists) {
                const intertestFolder = path.posix.join(currentWorkingDirectory, ".intertest");
                const existsIntertestFolder = yield this.existOnMF(intertestFolder);
                const message = `Working directory does not exist. Creating ".intertest" folder in home directory.`;
                if (!existsIntertestFolder) {
                    (_b = this.outputChannel) === null || _b === void 0 ? void 0 : _b.appendLine(message);
                    vscode.window.showInformationMessage(message);
                    yield this.createWorkingDirectory(intertestFolder);
                }
                this.workingDirectory = intertestFolder;
            }
            this.idasJarPathOnMF = path.posix.join(this.workingDirectory, this.JAR_NAME);
            this.idasJarVersionPathOnMF = path.posix.join(this.workingDirectory, "idas_version");
        });
    }
    cwd() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.sftp.realpath(".", (err, abs) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(abs);
                    }
                });
            });
        });
    }
    initialize(configuration) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if ((_a = configuration.ssh) === null || _a === void 0 ? void 0 : _a.ITHLQ)
            this.hlq = configuration.ssh.ITHLQ;
        let profileDataset;
        if ((_b = configuration.ssh) === null || _b === void 0 ? void 0 : _b.ITProfileDS)
            profileDataset = configuration.ssh.ITProfileDS;
        let cciFamilyId;
        if ((_c = configuration.ssh) === null || _c === void 0 ? void 0 : _c.cciFamilyId)
            cciFamilyId = configuration.ssh.cciFamilyId;
        let blsPortRange;
        if ((_d = configuration.ssh) === null || _d === void 0 ? void 0 : _d.blsPortRange)
            blsPortRange = configuration.ssh.blsPortRange;
        let blsPort;
        if ((_e = configuration.ssh) === null || _e === void 0 ? void 0 : _e.blsPort)
            blsPort = configuration.ssh.blsPort;
        if ((_f = configuration.ssh) === null || _f === void 0 ? void 0 : _f.ussJavaHomeDirectory) {
            this.javaPath = path.posix.join(configuration.ssh.ussJavaHomeDirectory, "bin", "java");
        }
        else if ((_g = configuration.ssh) === null || _g === void 0 ? void 0 : _g.ussJavaPath) {
            this.javaPath = configuration.ssh.ussJavaPath;
        }
        else {
            vscode.window.showInformationMessage("Java path is not set. Using default 'java' command.");
        }
        if (configuration.javaOpts)
            this.javaOpts = configuration.javaOpts;
        let itSteplib;
        if ((_h = configuration.ssh) === null || _h === void 0 ? void 0 : _h.ITStepLib)
            itSteplib = configuration.ssh.ITStepLib;
        let integrationMode;
        if ((_j = configuration.ssh) === null || _j === void 0 ? void 0 : _j.integrationMode)
            integrationMode = configuration.ssh.integrationMode;
        if (integrationMode && integrationMode === "CCI") {
            this.tcpEnabled = false;
            this.cciEnabled = true;
        }
        const appendParam = (key, value) => {
            if (value === undefined || value === null || value === "")
                return;
            const strValue = String(value).trim();
            const safeValue = `"${strValue.replace(/"/g, '\\"')}"`;
            this.PROGRAM_PARAMS += ` ${key} ${safeValue}`;
        };
        appendParam(this.HLQ_KEY, this.hlq);
        appendParam(this.PROFILE_DATASET_KEY, profileDataset);
        appendParam(this.CCI_FAMILY_ID_KEY, cciFamilyId);
        if (blsPort) {
            appendParam(this.BLSPORT_KEY, blsPort);
        }
        else {
            console.log("BLS port is not set. It will be assigned on MF.");
        }
        if (itSteplib) {
            const steplibStr = itSteplib.toString();
            this.ITSTEPLIB = steplibStr.includes("ITHLQ")
                ? steplibStr.replace("ITHLQ", this.hlq)
                : steplibStr;
        }
        if (blsPortRange && blsPortRange.start && blsPortRange.end) {
            if (this.isValidBlsPortRange(blsPortRange)) {
                appendParam(this.BLSPORT_RANGE_KEY, `${blsPortRange.start},${blsPortRange.end}`);
            }
        }
        this.PROGRAM_PARAMS = this.PROGRAM_PARAMS.trim();
    }
    isValidBlsPortRange(blsPortRange) {
        if (!Number.isInteger(blsPortRange.start) || !Number.isInteger(blsPortRange.end)) {
            vscode.window.showWarningMessage("Bls port range values must be integer");
            return false;
        }
        if (blsPortRange.start <= 0) {
            vscode.window.showWarningMessage("The START port has to greater than 0");
            return false;
        }
        if (blsPortRange.start >= blsPortRange.end) {
            vscode.window.showWarningMessage("The END port has to greater than START");
            return false;
        }
        return true;
    }
    runJava(conn) {
        return __awaiter(this, void 0, void 0, function* () {
            const jarDir = path.posix.dirname(this.idasJarPathOnMF);
            const safeJarDir = jarDir.replace(/"/g, '\\"');
            const java = this.javaPath ? `"${this.javaPath.replace(/"/g, '\\"')}"` : 'java';
            let steplibPart = "";
            let hlqPart = "";
            if (this.hlq && this.hlq.trim() !== "") {
                const escapedHlq = this.hlq.replace(/"/g, '\\"');
                hlqPart = `HLQ="${escapedHlq}"`;
            }
            if (this.ITSTEPLIB && this.ITSTEPLIB.trim() !== "") {
                steplibPart = `STEPLIB="${this.ITSTEPLIB}\${STEPLIB:+:\${STEPLIB}}"`;
            }
            else {
                steplibPart = `STEPLIB="\${ITSTEPLIB:-\${HLQ}.CAVHLOAD}\${ITSTEPLIB:+\${STEPLIB:+:\${STEPLIB}}}"`;
            }
            // 2. Command Construction
            const javaCmd = `cd "${safeJarDir}" && ${this.INTERTEST_TCP_ENABLED_KEY}=${this.tcpEnabled} ${this.INTERTEST_CCI_ENABLED_KEY}=${this.cciEnabled} ${hlqPart} ${steplibPart} INTERTEST_USE_OS_USER_CONTEXT=true CATALINA_BASE="${safeJarDir}" ${java} -Djava.io.tmpdir="${safeJarDir}" ${this.javaOpts} ${this.COMMAND} ${this.RUNNING_OPTION} ${this.idasJarPathOnMF} ${this.SSH_MAIN_CLASS} ${this.PROGRAM_PARAMS}`;
            // 3. Escape Single Quotes
            const escapedJavaCmd = javaCmd.replace(/'/g, "'\\''");
            return new Promise((resolve, reject) => {
                conn.exec(`$SHELL -L -c '${escapedJavaCmd}'`, {
                    pty: false,
                }, (err, javaStream) => {
                    if (err) {
                        console.error("Failed to start Java:", err);
                        reject(err);
                    }
                    else {
                        resolve(javaStream);
                    }
                });
            });
        });
    }
    copyJarFile(progresss) {
        return __awaiter(this, void 0, void 0, function* () {
            const localHash = yield this.computeLocalHash();
            const remoteHash = yield this.getRemoteHash();
            const exists = yield this.existOnMF(this.idasJarPathOnMF);
            let finalStatusMessage;
            if (!exists || localHash !== remoteHash) {
                const message = "Uploading files...";
                progresss.report({ message, increment: 50 });
                yield this.uploadFiles(localHash);
            }
            else {
                finalStatusMessage = "Files are identical, no need to copy.";
            }
            progresss.report({ message: finalStatusMessage, increment: 100 });
        });
    }
    generateErrorMessage(err) {
        const msg = (err === null || err === void 0 ? void 0 : err.message) || '';
        if (msg.includes("ECONNREFUSED")) {
            return constants_1.SSH_WRONG_HOST_PORT;
        }
        else if (msg.includes("Authentication failed")) {
            return constants_1.SSH_WRONG_CREDENTIALS;
        }
        else {
            return constants_1.SSH_CONNECTION_ERROR + msg;
        }
    }
    computeLocalHash() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const hash = (0, crypto_1.createHash)("sha256");
                const stream = (0, fs_1.createReadStream)(this.pathToJar);
                stream.on("data", (data) => hash.update(data));
                stream.on("end", () => resolve(hash.digest("hex")));
                stream.on("error", reject);
            });
        });
    }
    getRemoteHash() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.idasJarVersionPathOnMF) {
                return "";
            }
            try {
                const remoteData = yield this.readFileFromMF(this.idasJarVersionPathOnMF);
                return remoteData === null || remoteData === void 0 ? void 0 : remoteData.toString("utf8").trim();
            }
            catch (error) {
                if (error.message.includes("No such file")) {
                    return "";
                }
                throw error;
            }
        });
    }
    readFileFromMF(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.sftp.readFile(path, (err, handle) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(handle);
                    }
                });
            });
        });
    }
    uploadFiles(jarHash) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.idasJarPathOnMF) {
                throw Error("Path to java program is undefined");
            }
            if (!this.idasJarVersionPathOnMF) {
                throw Error("idasJarVersion file is undefined");
            }
            try {
                yield this.fastPut(this.pathToJar, this.idasJarPathOnMF);
                yield this.writeFileToMF(this.idasJarVersionPathOnMF, jarHash);
            }
            catch (error) {
                if (error.code === 3) { // SFTP specific 'Permission Denied'
                    throw new Error("You don't have permission to write to the target folder. Please check the permissions or contact your administrator.");
                }
                vscode.window.showErrorMessage("Error copying file to mainframe: " + error.message);
                throw new Error(`Error copying file: ${error.message}`);
            }
        });
    }
    writeFileToMF(remotePath, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.sftp.writeFile(remotePath, data, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
    fastPut(localPath, remotePath) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.sftp.fastPut(localPath, remotePath, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
    existOnMF(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return !!path && !!(yield this.exists(path));
        });
    }
    exists(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                this.sftp.exists(path, (exists) => {
                    resolve(exists);
                });
            });
        });
    }
    stat(folder) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.sftp.stat(folder, (err, stats) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(stats);
                    }
                });
            });
        });
    }
    kill() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            this.closeConnection = true;
            (_a = this.connection) === null || _a === void 0 ? void 0 : _a.end();
            this.setIdasRunning(false);
            this.closeConnection = false;
        });
    }
    createWorkingDirectory(intertestFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.mkdir(intertestFolder);
            }
            catch (error) {
                (0, assert_1.rejects)(error);
            }
        });
    }
    mkdir(folder) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const attributes = { mode: 0o700 };
                this.sftp.mkdir(folder, attributes, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
    setIdasRunning(idasRunning) {
        this.idasRunning = idasRunning;
    }
    isIdasRunning() {
        return this.idasRunning;
    }
    isConnected() {
        return this.connected;
    }
    setConnected(connected) {
        this.connected = connected;
    }
    displayCloseMessage(message) {
        var _a;
        (_a = this.outputChannel) === null || _a === void 0 ? void 0 : _a.appendLine(message);
    }
}
exports.SSHConnector = SSHConnector;
//# sourceMappingURL=SSHConnector.js.map