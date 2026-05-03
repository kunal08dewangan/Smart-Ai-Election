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
exports.EditJclFileSystemProvider = exports.JCL_LANG_ID = exports.JCL_EXT = void 0;
const vscode = require("vscode");
const EditJCL_1 = require("./EditJCL");
exports.JCL_EXT = ".jcl";
exports.JCL_LANG_ID = "jcl";
class EditJclFileSystemProvider {
    constructor() {
        this.files = new Map();
        this.pendingSaves = new Map(); // Track pending save operations
        this.isSaving = new Set(); // Track URIs being saved to prevent recursion
        this.saveDebounceMs = 500; // Debounce period for saves
        this._onDidChangeFile = new vscode.EventEmitter();
        this.onDidChangeFile = this._onDidChangeFile.event;
        this.registerDocumentChangeListener(); // Initialize auto-save listener
    }
    // Write file (create or update)
    writeFile(uri, content, options) {
        const path = uri.toString(false);
        const existing = this.files.get(path);
        if (!existing && !options.create) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }
        if (existing && !options.overwrite) {
            throw vscode.FileSystemError.FileExists(uri);
        }
        const now = Date.now();
        this.files.set(path, {
            content,
            ctime: existing ? existing.ctime : now,
            mtime: now
        });
        // Notify file change
        this._onDidChangeFile.fire([{ uri, type: existing ? vscode.FileChangeType.Changed : vscode.FileChangeType.Created }]);
    }
    // Read file content
    readFile(uri) {
        const file = this.files.get(uri.toString(false));
        if (!file) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }
        return file.content;
    }
    // Check file existence and metadata
    stat(uri) {
        const file = this.files.get(uri.toString(false));
        if (!file) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }
        return {
            type: vscode.FileType.File,
            ctime: file.ctime,
            mtime: file.mtime,
            size: file.content.length
        };
    }
    // Register document change listener for auto-save
    registerDocumentChangeListener() {
        vscode.workspace.onDidChangeTextDocument(event => {
            const document = event.document;
            if (!(document.uri.scheme === EditJCL_1.editJclScheme && this.isJcl(document))) {
                return; // Ignore documents not matching our scheme or not JCL
            }
            if (!document.isDirty || this.isSaving.has(document.uri.toString())) {
                return; // Skip if document isn't dirty or is being saved
            }
            const uriString = document.uri.toString();
            // Clear any existing pending save for this document
            const existingTimeout = this.pendingSaves.get(uriString);
            if (existingTimeout) {
                clearTimeout(existingTimeout); // Safe: existingTimeout is a NodeJS.Timeout
            }
            // Schedule a debounced save
            this.pendingSaves.set(uriString, setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    this.isSaving.add(uriString); // Mark as saving
                    // Verify document still exists and is open
                    const openDocument = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === uriString);
                    if (openDocument && openDocument.isDirty) {
                        yield openDocument.save();
                    }
                }
                catch (error) {
                    console.error(`Failed to save document ${uriString}:`, error);
                }
                finally {
                    this.isSaving.delete(uriString); // Clear saving flag
                    this.pendingSaves.delete(uriString); // Clear pending save
                }
            }), this.saveDebounceMs));
        });
    }
    isJcl(document) {
        return document.uri.path.endsWith(exports.JCL_EXT) || document.languageId === "jcl";
    }
    // Minimal stubs for required FileSystemProvider methods
    watch(_uri) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return new vscode.Disposable(() => { }); // No-op watcher
    }
    readDirectory(_uri) {
        throw vscode.FileSystemError.FileNotFound(_uri); // Not supported
    }
    createDirectory(_uri) {
        throw vscode.FileSystemError.NoPermissions('Directory creation not supported');
    }
    delete(_uri, _options) {
        throw vscode.FileSystemError.NoPermissions('Deletion not supported');
    }
    rename(_oldUri, _newUri, _options) {
        throw vscode.FileSystemError.NoPermissions('Renaming not supported');
    }
}
exports.EditJclFileSystemProvider = EditJclFileSystemProvider;
//# sourceMappingURL=EditJclFileSystemProvider.js.map