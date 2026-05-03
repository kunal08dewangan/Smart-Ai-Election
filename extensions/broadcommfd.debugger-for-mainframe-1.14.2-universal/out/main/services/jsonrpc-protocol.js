"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProtocolMessage = isProtocolMessage;
exports.isEventMessage = isEventMessage;
exports.isSourceEventMessage = isSourceEventMessage;
exports.isResponseMessage = isResponseMessage;
exports.isCommandResponseMessage = isCommandResponseMessage;
exports.isRequestMessage = isRequestMessage;
function isProtocolMessage(msg) {
    //validation of 'jsonrpc' field should be here. however messages from VS Code DAP client do not have it. Skipping this validation for now.
    return (typeof msg === 'object' && msg !== null);
}
function isEventMessage(msg) {
    if (!isProtocolMessage(msg)) {
        return false;
    }
    const hasEvent = 'event' in msg;
    if (!hasEvent || typeof msg.event !== 'string') {
        return false;
    }
    const hasType = 'type' in msg;
    return hasType && msg.type === "event";
}
function isSourceEventMessage(msg) {
    if (isEventMessage(msg)) {
        const hasBody = 'body' in msg;
        return (hasBody &&
            msg.body !== null &&
            typeof msg.body === 'object' &&
            'category' in msg.body &&
            msg.body.category === 'source' &&
            'data' in msg.body &&
            typeof msg.body.data === 'object' &&
            msg.body.data !== null &&
            'filePath' in msg.body.data &&
            typeof msg.body.data.filePath === 'string' &&
            'content' in msg.body.data &&
            typeof msg.body.data.content === 'object');
    }
    else {
        return false;
    }
}
function isResponseMessage(msg) {
    if (!isProtocolMessage(msg)) {
        return false;
    }
    const hasCommand = 'command' in msg;
    if (!hasCommand || typeof msg.command !== 'string') {
        return false;
    }
    const hasType = 'type' in msg;
    return hasType && msg.type === "response";
}
function isCommandResponseMessage(msg) {
    if (!isResponseMessage(msg) || msg.command !== 'command') {
        return false;
    }
    const hasBody = 'body' in msg;
    return (hasBody &&
        msg.body !== null &&
        typeof msg.body === 'string');
}
function isRequestMessage(msg) {
    if (!isProtocolMessage(msg)) {
        return false;
    }
    const hasType = 'type' in msg;
    return hasType && msg.type === "request";
}
//# sourceMappingURL=jsonrpc-protocol.js.map