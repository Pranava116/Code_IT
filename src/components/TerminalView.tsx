"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export default function TerminalView({ projectId }: { projectId: string }) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const terminal = new Terminal({
      cursorBlink: true,
      theme: {
        background: "#1e1e1e",
      },
      fontFamily: 'monospace',
    });
    xtermRef.current = terminal;

    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    terminal.loadAddon(fitAddon);

    terminal.open(terminalRef.current);
    
    // Slight delay to ensure dimensions are ready before fitting
    setTimeout(() => {
        fitAddon.fit();
    }, 50);

    // Initialize WebSocket
    const ws = new WebSocket(`ws://127.0.0.1:1235?projectId=${projectId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      // Send initial size
      ws.send(
        JSON.stringify({
          type: "resize",
          cols: terminal.cols,
          rows: terminal.rows,
        })
      );
    };

    ws.onmessage = (event) => {
      // Data from backend to frontend
      terminal.write(event.data);
    };

    // Data from frontend to backend
    terminal.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", data }));
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        fitAddonRef.current.fit();
        wsRef.current.send(
          JSON.stringify({
            type: "resize",
            cols: terminal.cols,
            rows: terminal.rows,
          })
        );
      }
    });

    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
      ws.close();
    };
  }, []);

  return (
    <div 
      ref={terminalRef} 
      style={{ 
        width: "100%", 
        height: "100%", 
        minHeight: "200px",
        overflow: "hidden", 
        backgroundColor: "#1e1e1e", 
        padding: "8px" 
      }} 
    />
  );
}
