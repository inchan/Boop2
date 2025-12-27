/**
 * WorkerTypes.ts
 * Defines the communication protocol between the Main Thread (UI) and the Web Worker (Script Engine).
 */

// Data required to reconstruct the execution context inside the Worker
export interface ExecutionContextData {
  fullText: string;
  selection: string;
  selectionOffset: number; // Start index of selection
  isSelection: boolean;
}

// Request sent from Main -> Worker
export type WorkerRequest = {
  type: 'EXECUTE';
  script: string; // The raw JavaScript code to run
  context: ExecutionContextData; // The state of the editor
};

// Response sent from Worker -> Main
export type WorkerResponse =
  | { type: 'SUCCESS'; payload: ExecutionContextData } // Script finished, here is the new state
  | { type: 'ERROR'; error: string } // Script threw an exception
  | { type: 'INFO'; message: string }; // Script called postInfo()
