"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacyCommandConnector = void 0;
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const constants_1 = require("../constants");
const vscode = require("vscode");
const CertStore_1 = require("./CertStore");
class LegacyCommandConnector {
    constructor(pathTojar, className) {
        this.pathTojar = pathTojar;
        this.className = className;
    }
    run(configuration) {
        this.verifyJavaInstallation();
        if (!(0, fs_1.existsSync)(this.pathTojar)) {
            throw new Error(`${this.pathTojar} is missing.`);
        }
        //const process = spawnSync("java", ["-agentlib:jdwp=transport=dt_socket,server=y,suspend=y,address=*:5005,quiet=y", "-Dfile.encoding=UTF-8", "-cp", this.pathTojar, this.className, Buffer.from(JSON.stringify(configuration)).toString("base64")]);
        const process = (0, child_process_1.spawnSync)("java", (0, CertStore_1.getCertVmArgs)().concat(["-Dfile.encoding=UTF-8", "-cp", this.pathTojar, this.className, Buffer.from(JSON.stringify(configuration)).toString("base64")]));
        if (process.error) {
            throw new Error(process.error.message);
        }
        if (process.signal) {
            throw new Error(`Process terminated with signal: ${process.signal}`);
        }
        if (process.status) {
            throw new Error(`Process terminated rc: ${process.status}\n${process.stderr}`);
        }
        let output;
        try {
            output = JSON.parse(process.stdout.toString());
        }
        catch (error) {
            output = {};
        }
        if (output.error) {
            let throwMe;
            try {
                const errorOutput = JSON.parse(output.error);
                console.error(`${errorOutput.error}\n${errorOutput.errorDesc}`);
                throwMe = errorOutput.error;
            }
            catch (error) {
                throwMe = output.error;
            }
            throw new Error(throwMe);
        }
        if (typeof output.result === 'string') {
            return output.result;
        }
        console.error("Unexpected response", JSON.stringify(output));
        throw new Error(`Unexpected response: ${output}`);
    }
    verifyJavaInstallation() {
        const result = (0, child_process_1.spawnSync)("java", [
            "-version",
        ], { encoding: "utf8" });
        if (result.status !== 0 && result.stderr !== 'testError') {
            const options = { modal: true };
            vscode.window.showErrorMessage(constants_1.JAVA_NOT_INSTALLED, options);
            throw new Error(constants_1.JAVA_NOT_INSTALLED);
        }
    }
}
exports.LegacyCommandConnector = LegacyCommandConnector;
//# sourceMappingURL=LegacyCommandConnector.js.map