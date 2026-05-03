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
exports.SchedulingService = void 0;
const vscode = require("vscode");
const constants_1 = require("../../constants");
const TelemetryReporterService_1 = require("../TelemetryReporterService");
const Utils_1 = require("../Utils");
class SchedulingService {
    constructor(commandRunner) {
        this.commandRunner = commandRunner;
    }
    schedulingRequest(config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return Utils_1.Utils.validateCommandResponse(yield this.commandRunner.run(constants_1.JAR_SCHEDULING_SERVICE, config));
            }
            catch (error) {
                if (error.message) {
                    vscode.window.showErrorMessage(error.message);
                }
                else {
                    vscode.window.showErrorMessage(error);
                }
                return null;
            }
        });
    }
    fetchSPByType(config, database) {
        return __awaiter(this, void 0, void 0, function* () {
            TelemetryReporterService_1.TelemetryReporterService.Instance.sendTelemetryEvent(constants_1.TELEMETRY_EVENT_SCHEDULE_TABLE_FETCH + "_" + database);
            const clone = Object.assign({}, config);
            clone.ListSchedulingTable = true; //param to understand when is a listing request
            clone.DatabaseSP = database;
            const result = yield this.schedulingRequest(clone);
            let returnObject = [];
            if (result === null)
                return returnObject;
            else if (result && result.scheduleList) {
                returnObject = result.scheduleList;
            }
            else if (returnObject.length === 0) {
                vscode.window.showInformationMessage("There are no  " +
                    database +
                    "  entries in the database to display.");
            }
            return returnObject;
        });
    }
    fetchAllEntries(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const db2Entries = yield this.fetchSPByType(config, constants_1.DB2);
            const imsEntries = yield this.fetchSPByType(config, constants_1.IMS);
            return [...db2Entries, ...imsEntries];
        });
    }
    insertEntry(config, entryObject) {
        return __awaiter(this, void 0, void 0, function* () {
            TelemetryReporterService_1.TelemetryReporterService.Instance.sendTelemetryEvent(constants_1.TELEMETRY_EVENT_SCHEDULE_TABLE_ADD + "_" + entryObject.database);
            const insertClone = Object.assign({}, config);
            insertClone.EntryObject = entryObject;
            const result = yield this.schedulingRequest(insertClone);
            if (result && result.scheduleList) {
                const returnObject = result.scheduleList;
                return [
                    ...returnObject,
                    ...yield this.fetchSPByType(config, entryObject.database === constants_1.DB2 ? constants_1.IMS : constants_1.DB2),
                ];
            }
            return;
        });
    }
    deleteEntry(config, deleteObject) {
        return __awaiter(this, void 0, void 0, function* () {
            TelemetryReporterService_1.TelemetryReporterService.Instance.sendTelemetryEvent(constants_1.TELEMETRY_EVENT_SCHEDULE_TABLE_DELETE + "_" + deleteObject.database);
            const clone = Object.assign({}, config);
            clone.DeleteObject = deleteObject;
            const result = yield this.schedulingRequest(clone);
            if (result && result.status) {
                if (result.status[0] &&
                    result.status[0] === "SELECTED ITEMS DELETED") {
                    return true;
                }
            }
            return false;
        });
    }
}
exports.SchedulingService = SchedulingService;
//# sourceMappingURL=SchedulingService.js.map