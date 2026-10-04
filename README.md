# CALCULO

A Windows desktop scientific calculator application with a secure architecture. This project uses Electron, React, TypeScript, and Vite.

## Prerequisites
- Node.js (v24.13.0 or higher)
- npm (v11.6.2 or higher)

## Installation
```bash
npm install
```

## Development
To start the application in development mode (starts Vite dev server and Electron app simultaneously):
```bash
npm run dev
```

## Production Build
To compile the TypeScript code and bundle the React application:
```bash
npm run build
```

## Project Structure
- `src/main/` - Electron main process and preload script.
- `src/renderer/` - React frontend application.
- `src/shared/` - Shared types used by both main and renderer processes.

## Security Decisions (Phase 1)
- **contextIsolation:** Enabled, ensuring scripts running in the renderer process do not share a global context with the preload script.
- **nodeIntegration:** Disabled, completely blocking the React frontend from accessing Node.js APIs directly.
- **sandbox:** Enabled for the renderer process.
- **Preload Bridge:** A very narrowly scoped IPC bridge is exposed via `contextBridge`, strictly typed and validated (currently only `getAppInfo`).

## Known Limitations and Next Milestone
- The calculator interface currently displays placeholder values and components. Mathematical logic is not yet implemented.
- **Next Milestone:** Implement and test the calculator expression engine.
