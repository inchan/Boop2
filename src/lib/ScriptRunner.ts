import { ExecutionContextData, WorkerResponse } from './WorkerTypes';

// Vite worker import syntax
import ScriptWorker from './worker?worker';

export interface ScriptModel {
    name?: string;
    description?: string;
    full_text: string;
    path: string;
}

/**
 * Runs a Boop script in a background Web Worker.
 * 
 * @param script The script model containing source code.
 * @param context The current state of the editor (text, selection).
 * @param onInfo Optional callback for 'postInfo' messages.
 * @returns Promise resolving to the modified editor state.
 */
export function runScriptAsync(
    script: ScriptModel, 
    context: ExecutionContextData,
    onInfo?: (msg: string) => void
): Promise<ExecutionContextData> {
    return new Promise((resolve, reject) => {
        const worker = new ScriptWorker();

        // Safety timeout: 5 seconds (prevent infinite loops from hanging backend resources)
        const timeout = setTimeout(() => {
            worker.terminate();
            reject(new Error("Script execution timed out (5s limit)."));
        }, 5000);

        worker.onmessage = (e) => {
            const resp = e.data as WorkerResponse;
            
            if (resp.type === 'SUCCESS') {
                clearTimeout(timeout);
                resolve(resp.payload);
                worker.terminate();
            } 
            else if (resp.type === 'ERROR') {
                clearTimeout(timeout);
                reject(new Error(resp.error));
                worker.terminate();
            } 
            else if (resp.type === 'INFO') {
                if (onInfo) onInfo(resp.message);
            }
        };

        worker.onerror = (err) => {
            clearTimeout(timeout);
            reject(err);
            worker.terminate();
        };

        // Send payload
        worker.postMessage({
            type: 'EXECUTE',
            script: script.full_text,
            context: context
        });
    });
}