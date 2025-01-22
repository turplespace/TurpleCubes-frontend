import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, Terminal as TerminalIcon, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

const Terminal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Function to establish WebSocket connection and handle messages
    const connectWebSocket = () => {
      const ws = new WebSocket(`ws://localhost:8080/api/logs/stream`);
      ws.onmessage = (event) => {
        const newLog = event.data;
        console.log(newLog)
        setLogs((prevLogs) => [...prevLogs, newLog]);
      };
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };
      wsRef.current = ws;
    };

    if (isOpen) {
      connectWebSocket();
    } else {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <>
      {/* Terminal Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <TerminalIcon className="h-4 w-4 mr-2" />
        {isOpen ? 'Hide' : 'Show'} Logs
      </Button>

      {/* Terminal Window */}
      {isOpen && (
        <div
          className={`fixed left-0 right-0 bg-black/90 text-white-400 font-mono text-sm transition-all duration-200 ease-in-out z-40 ${
            isMaximized ? 'top-0 h-full' : 'bottom-0 h-64'
          }`}
        >
          {/* Terminal Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-black/95 border-b border-gray-700">
            <span className="text-white">Logs</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearLogs}
                className="h-8 w-8 p-0 hover:bg-gray-800"
              >
                <Trash2 className="h-4 w-4 text-gray-400" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMaximize}
                className="h-8 w-8 p-0 hover:bg-gray-800"
              >
                {isMaximized ? (
                  <Minimize2 className="h-4 w-4 text-gray-400" />
                ) : (
                  <Maximize2 className="h-4 w-4 text-gray-400" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 hover:bg-gray-800"
              >
                <X className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </div>

          {/* Terminal Content */}
          <div
            ref={terminalRef}
            className="h-full overflow-y-auto p-4 font-mono text-sm"
          >
            {logs.map((log, index) => (
              <div key={index} className="mb-1 text-white">
                {log}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-500">No logs available...</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Terminal;