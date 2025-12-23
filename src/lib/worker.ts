/// <reference lib="webworker" />

/**
 * worker.ts
 * The entry point for the Web Worker.
 * Executes user scripts in an isolated environment.
 */

import { WorkerRequest, WorkerResponse, ExecutionContextData } from './WorkerTypes';
import { requireShim } from './RequireShim';

/**
 * Mocks the 'ScriptExecution' object available to Boop scripts.
 * Instead of manipulating the UI directly, it updates an internal state (`data`).
 */
class WorkerScriptExecution {
    public data: ExecutionContextData;

    constructor(data: ExecutionContextData) {
        this.data = { ...data };
    }

    get fullText(): string {
        return this.data.fullText;
    }
    set fullText(val: string) {
        this.data.fullText = val;
    }

    get selection(): string {
        return this.data.selection;
    }
    set selection(val: string) {
        this.data.selection = val;
    }

    // Smart 'text' property
    get text(): string {
        return this.data.isSelection ? this.data.selection : this.data.fullText;
    }
    set text(val: string) {
        if (this.data.isSelection) {
            this.data.selection = val;
        } else {
            this.data.fullText = val;
        }
    }

    insert(text: string) {
        // Simple insertion logic. 
        // In real CodeMirror, this is complex. Here we just simulate it for the script's view.
        // *Critique*: This basic string manipulation might desync with complex cursor positions,
        // but for now it satisfies the "input.insert()" API contract.
        
        if (this.data.isSelection) {
            this.data.selection = text;
        } else {
            this.data.fullText += text; // Append to end if no selection? Or insert at cursor?
            // Swift impl: "If no selection, replace full text" or "insert at index".
            // Let's match Swift's "insert" behavior logic carefully later.
            // For now: Append.
        }
    }

    postError(msg: string) {
        const response: WorkerResponse = { type: 'ERROR', error: msg };
        self.postMessage(response);
    }

    postInfo(msg: string) {
        const response: WorkerResponse = { type: 'INFO', message: msg };
        self.postMessage(response);
    }
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
    const { type, script, context } = e.data;

    if (type !== 'EXECUTE') return;

    try {
        const execution = new WorkerScriptExecution(context);

        // Create the Function
        // We use "self.requireShim" logic or pass it directly
        const runner = new Function('input', 'require', `
            "use strict";
            ${script}
            if (typeof main === 'function') {
                main(input);
            }
        `);

        // Execute
        runner(execution, requireShim);

        // Send back the modified state
        const response: WorkerResponse = { 
            type: 'SUCCESS', 
            payload: execution.data 
        };
        self.postMessage(response);

    } catch (error) {
        const response: WorkerResponse = { 
            type: 'ERROR', 
            error: String(error) 
        };
        self.postMessage(response);
    }
};
