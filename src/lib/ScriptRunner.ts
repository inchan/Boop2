import { ExecutionContextData } from './WorkerTypes';
import { workerPool } from './WorkerPool';

export interface ScriptModel {
  name?: string;
  description?: string;
  full_text: string;
  path: string;
}

/**
 * Runs a Boop script in a background Web Worker.
 * Uses WorkerPool for efficient worker reuse.
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
  return workerPool.execute(script.full_text, context, onInfo);
}
