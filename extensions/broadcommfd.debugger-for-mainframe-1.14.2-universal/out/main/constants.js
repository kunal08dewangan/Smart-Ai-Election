"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JOB_ID_REGEX = exports.STATEMENT_TRACE_DISABLED = exports.STATEMENT_TRACE_ENABLED = exports.STATEMENT_TRACE = exports.EXECUTION_COUNTS_DISABLED = exports.EXECUTION_COUNTS_ENABLED = exports.EXECUTION_COUNTS = exports.UNABLE_TO_ALTER_REQUESTED_MEMORY = exports.SET_VARIABLE_FAILED = exports.UNABLE_TO_READ_REQUESTED_MEMORY = exports.CONNECTION_FAILED = exports.PERMISSION_DENIED = exports.VARIABLE_CHECK_FROM_EDITOR_REGEX = exports.JAVA_NOT_INSTALLED = exports.CHARSET_MISMATCH = exports.TELEMETRY_EVENT_BATCH_QUEUE_JOBS = exports.TELEMETRY_EVENT_UI_LAUNCH = exports.TELEMETRY_EVENT_UI_ATTACH = exports.TELEMETRY_EVENT_DEBUG_SET_VARIABLE = exports.TELEMETRY_EVENT_DAP_ERROR = exports.TELEMETRY_EVENT_DAP_RESPONSE = exports.TELEMETRY_EVENT_DAP_REQUEST = exports.TELEMETRY_EVENT_FETCH_EXTENDED_SOURCE = exports.TELEMETRY_EVENT_ERROR_STATEMENT_LOCATE = exports.TELEMETRY_EVENT_CONVERT_JCL = exports.TELEMETRY_EVENT_SCHEDULE_TABLE_ADD = exports.TELEMETRY_EVENT_SCHEDULE_TABLE_FETCH = exports.TELEMETRY_EVENT_SCHEDULE_TABLE_DELETE = exports.TELEMETRY_EVENT_SCHEDULE_TABLE = exports.TELEMETRY_EVENT_ACTIVATE = exports.SPACE = exports.IMS = exports.DB2 = exports.JAR_SCHEDULING_SERVICE = exports.ATTACHING_SUSPENDED_SESSION = exports.ATTACH_DEBUGGING_DIALOG = exports.ATTACH_ABORTED = exports.NO = exports.YES = exports.LIST_COMPOSITE_SERVICE = exports.CONVERT_JCL_SERVICE = exports.FETCH_EXTENDED_SOURCE_SERVICE = exports.JAR_BATCH_LINK_QUEUE_SERVICE = exports.EXT_ID = exports.DEBUGGER_TYPE_NAME = exports.DEBUGGER_TYPE_NAME_BATCH = exports.DEBUGGER_TYPE_NAME_CICS = exports.ALLOWED_REQUEST_TYPES = exports.LAUNCH_REQUEST_TYPE = exports.ATTACH_REQUEST_TYPE = void 0;
exports.BLSPORT_IN_USE_ERROR = exports.BLS_PORT_IN_USE = exports.JAVA_NOT_FOUND_MF = exports.QUICK_PICK_PLACEHOLDER = exports.THERE_IS_NO_SSH_KEYS_FOR_AUTH = exports.SSH_KEYS = exports.USER_HOME = exports.WEBSOCKET_CONNECTION_CLOSED = exports.WEBSOCKET_CONNECTION_ERROR = exports.SSH_CONNECTION_EXITED = exports.SSH_EXECUTION_ERROR = exports.SSH_CONNECTION_CLOSED = exports.SSH_CONNECTION_ERROR = exports.SSH_WRONG_CREDENTIALS = exports.SSH_WRONG_HOST_PORT = exports.HELP_COMMAND = exports.TOKEN_TYPE_APIML = exports.CONSOLE_COMMAND_UNKNOWN = exports.CICS_DEFINED = exports.INLINE_OFF = exports.INLINE_ON = exports.DELIMITER = exports.PARENT_KEY_WORD = exports.VARIABLE_NOT_FOUND_BY_FILTER = exports.SYMBOLIC_SELECT = exports.SYMBOLIC_NOT_MATCHED = exports.CONTINUE_OR_NOT = void 0;
const os = require("os");
const path = require("path");
exports.ATTACH_REQUEST_TYPE = "attach";
exports.LAUNCH_REQUEST_TYPE = "launch";
exports.ALLOWED_REQUEST_TYPES = [exports.ATTACH_REQUEST_TYPE, exports.LAUNCH_REQUEST_TYPE];
exports.DEBUGGER_TYPE_NAME_CICS = "intertest-cics";
exports.DEBUGGER_TYPE_NAME_BATCH = "intertest-batch";
exports.DEBUGGER_TYPE_NAME = "intertest-cics";
exports.EXT_ID = "BroadcomMFD.debugger-for-mainframe";
exports.JAR_BATCH_LINK_QUEUE_SERVICE = "com.broadcom.idas.batchlink.BatchLinkQueueService";
exports.FETCH_EXTENDED_SOURCE_SERVICE = "com.broadcom.idas.FetchExtendedSource";
exports.CONVERT_JCL_SERVICE = "com.broadcom.idas.ConvertJCL";
exports.LIST_COMPOSITE_SERVICE = "com.broadcom.idas.ListComposite";
exports.YES = "Continue";
exports.NO = "Abort";
exports.ATTACH_ABORTED = "Attach debugging request aborted";
exports.ATTACH_DEBUGGING_DIALOG = "Attaching a debugging session without providing PROTSYM and/or program in the debugging configuration. Are you sure?";
exports.ATTACHING_SUSPENDED_SESSION = "Resuming suspended session. The session configuration might differ from the attach configuration specified in launch.json";
exports.JAR_SCHEDULING_SERVICE = "com.broadcom.idas.scheduling.SchedulingSPService";
exports.DB2 = "DB2";
exports.IMS = "IMS";
exports.SPACE = " ";
exports.TELEMETRY_EVENT_ACTIVATE = "activate";
exports.TELEMETRY_EVENT_SCHEDULE_TABLE = "cmd.sch.fetch";
exports.TELEMETRY_EVENT_SCHEDULE_TABLE_DELETE = "ui.sch.remove";
exports.TELEMETRY_EVENT_SCHEDULE_TABLE_FETCH = "api.sch.fetch";
exports.TELEMETRY_EVENT_SCHEDULE_TABLE_ADD = "ui.sch.add";
exports.TELEMETRY_EVENT_CONVERT_JCL = "cmd.convertJCL";
exports.TELEMETRY_EVENT_ERROR_STATEMENT_LOCATE = "cmd.statement-trace-locate.err";
exports.TELEMETRY_EVENT_FETCH_EXTENDED_SOURCE = "cmd.dap.fetchExtendedSource";
exports.TELEMETRY_EVENT_DAP_REQUEST = "dap.request.";
exports.TELEMETRY_EVENT_DAP_RESPONSE = "dap.response.";
exports.TELEMETRY_EVENT_DAP_ERROR = "dap.err.";
exports.TELEMETRY_EVENT_DEBUG_SET_VARIABLE = "ui.setVariable";
exports.TELEMETRY_EVENT_UI_ATTACH = "ui.attach";
exports.TELEMETRY_EVENT_UI_LAUNCH = "ui.launch";
exports.TELEMETRY_EVENT_BATCH_QUEUE_JOBS = "api.batch.fetchJobsQueue";
exports.CHARSET_MISMATCH = "in launch.json does not match with the server.";
exports.JAVA_NOT_INSTALLED = "Java not installed";
exports.VARIABLE_CHECK_FROM_EDITOR_REGEX = /[^,()-+.*/=><!'& ][@#$-_A-Za-z0-9][^,()-+.*/=><!='& ]{0,63}/g;
exports.PERMISSION_DENIED = "Permission denied";
exports.CONNECTION_FAILED = "Connection Failed";
exports.UNABLE_TO_READ_REQUESTED_MEMORY = "UNABLE TO READ REQUESTED MEMORY";
exports.SET_VARIABLE_FAILED = "Set variable failed.";
exports.UNABLE_TO_ALTER_REQUESTED_MEMORY = "UNABLE TO ALTER REQUESTED MEMORY";
exports.EXECUTION_COUNTS = "Execution counts";
exports.EXECUTION_COUNTS_ENABLED = "Execution counts enabled";
exports.EXECUTION_COUNTS_DISABLED = "Execution counts disabled";
exports.STATEMENT_TRACE = "Statement trace";
exports.STATEMENT_TRACE_ENABLED = "Statement trace enabled";
exports.STATEMENT_TRACE_DISABLED = "Statement trace disabled";
exports.JOB_ID_REGEX = /JOB\d{5}/;
exports.CONTINUE_OR_NOT = "Click Continue to select a listing from a PROTSYM or Abort to end the debugging session.";
exports.SYMBOLIC_NOT_MATCHED = "No symbolic listing specified in the configuration file matches the load module.";
exports.SYMBOLIC_SELECT = "More than one listing was found for the configuration specified in launch.json.";
exports.VARIABLE_NOT_FOUND_BY_FILTER = "Variable(s) not found by filter";
exports.PARENT_KEY_WORD = "OF";
exports.DELIMITER = "|";
exports.INLINE_ON = "/INLINE ON";
exports.INLINE_OFF = "/INLINE OFF";
exports.CICS_DEFINED = "CICSDEFINED";
exports.CONSOLE_COMMAND_UNKNOWN = "Unknown command";
exports.TOKEN_TYPE_APIML = "apimlAuthenticationToken";
exports.HELP_COMMAND = "Help Command to show usage of all available console commands in Debugger for Mainframe Extension.\r\n/trace on, /trace off\r\nEnables and disables statement trace.\r\n\r\n/calltrace on, /calltrace off\r\nEnables and disables call trace.\r\n\r\n/inline on, /inline off\r\nEnables and disables inline variables view.\r\n\r\n/at label, /label off\r\nEnables and disables Paragraph Breakpoints\r\n\r\n/counts on,/counts off\r\nEnables and disables Execution Counts";
exports.SSH_WRONG_HOST_PORT = "Connection refused: Could be a wrong host or port.";
exports.SSH_WRONG_CREDENTIALS = "Authentication failed: Check your username/password.";
exports.SSH_CONNECTION_ERROR = "SSH connection error: ";
exports.SSH_CONNECTION_CLOSED = "SSH connection closed.";
exports.SSH_EXECUTION_ERROR = "SSH execution error.";
exports.SSH_CONNECTION_EXITED = "SSH connection is over.";
exports.WEBSOCKET_CONNECTION_ERROR = "Websocket connection error. ";
exports.WEBSOCKET_CONNECTION_CLOSED = "Websocket connection closed.";
exports.USER_HOME = os.homedir();
exports.SSH_KEYS = [
    path.join(exports.USER_HOME, '.ssh', 'id_rsa'),
    path.join(exports.USER_HOME, '.ssh', 'id_ecdsa'),
    path.join(exports.USER_HOME, '.ssh', 'id_ed25519'),
    path.join(exports.USER_HOME, '.ssh', 'id_ed25519_sk'),
    path.join(exports.USER_HOME, '.ssh', 'id_dsa'),
    path.join(exports.USER_HOME, '.ssh', 'id_ecdsa_sk'),
    path.join(exports.USER_HOME, '.ssh', 'id_xmss')
];
exports.THERE_IS_NO_SSH_KEYS_FOR_AUTH = "Connection was not established using the SSH keys. Please retry using password authentication.";
exports.QUICK_PICK_PLACEHOLDER = "Select a job from the batch link queue to debug on ";
exports.JAVA_NOT_FOUND_MF = "java: FSUM7351 not found";
exports.BLS_PORT_IN_USE = "EDC8115I Address already in use. (Bind failed)";
exports.BLSPORT_IN_USE_ERROR = "BLS port in use. Please use different port.";
//# sourceMappingURL=constants.js.map