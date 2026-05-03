"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESSAGE_CONTEXT = exports.MESSAGE_TYPE = exports.Events = exports.Commands = void 0;
var Commands;
(function (Commands) {
    Commands["EVALUATE"] = "evaluate";
    Commands["SETVARIABLE"] = "setVariable";
    Commands["SETBREAKPOINTS"] = "setBreakpoints";
    Commands["SCOPES"] = "scopes";
    Commands["TERMINATE"] = "terminate";
    Commands["THREADS"] = "threads";
    Commands["DISCONNECT"] = "disconnect";
    Commands["STACKTRACE"] = "stackTrace";
    Commands["CONTINUE"] = "continue";
    Commands["STEPIN"] = "stepIn";
    Commands["STEPOUT"] = "stepOut";
    Commands["NEXT"] = "next";
    Commands["CONFIG"] = "configurationDone";
})(Commands || (exports.Commands = Commands = {}));
var Events;
(function (Events) {
    Events["BREAKPOINT"] = "breakpoint";
    Events["STOPPED"] = "stopped";
    Events["OUTPUT"] = "output";
    Events["PROGRESSUPDATE"] = "progressUpdate";
    Events["TERMINATED"] = "terminated";
})(Events || (exports.Events = Events = {}));
var MESSAGE_TYPE;
(function (MESSAGE_TYPE) {
    MESSAGE_TYPE["RESPONSE"] = "response";
    MESSAGE_TYPE["EVENT"] = "event";
    MESSAGE_TYPE["REQUEST"] = "request";
    MESSAGE_TYPE["REPLY"] = "repl";
})(MESSAGE_TYPE || (exports.MESSAGE_TYPE = MESSAGE_TYPE = {}));
var MESSAGE_CONTEXT;
(function (MESSAGE_CONTEXT) {
    MESSAGE_CONTEXT["WATCH"] = "watch";
})(MESSAGE_CONTEXT || (exports.MESSAGE_CONTEXT = MESSAGE_CONTEXT = {}));
//# sourceMappingURL=Enums.js.map