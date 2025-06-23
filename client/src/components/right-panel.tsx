import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Terminal, MessageSquare, RefreshCw, Trash, Play, Square } from 'lucide-react';
import { Project } from '@/lib/file-system';
import ChatInterface from './chat-interface-new';

interface RightPanelProps {
  project: Project;
  activeFile: string | null;
}

type TabType = 'preview' | 'console' | 'chat';

interface ConsoleEntry {
  timestamp: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'command';
}

export default function RightPanel({ project, activeFile }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('preview');
  const [consoleOutput, setConsoleOutput] = useState<ConsoleEntry[]>([
    { timestamp: new Date().toLocaleTimeString(), message: 'Terminal ready. Type commands to interact with your project.', type: 'info' }
  ]);
  const [commandInput, setCommandInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isServerRunning, setIsServerRunning] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const [projectId] = useState(() => `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const tabs = [
    { id: 'preview' as TabType, label: 'Preview', icon: Eye },
    { id: 'console' as TabType, label: 'Terminal', icon: Terminal },
    { id: 'chat' as TabType, label: 'Chat', icon: MessageSquare }
  ];

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleOutput]);

  const addToConsole = (message: string, type: ConsoleEntry['type'] = 'info') => {
    setConsoleOutput(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  };

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;
    
    setIsExecuting(true);
    addToConsole(`$ ${command}`, 'command');
    
    try {
      const response = await fetch(`/api/projects/${projectId}/terminal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });

      const result = await response.json();
      
      if (result.success) {
        if (result.stdout) {
          addToConsole(result.stdout, 'success');
        }
        if (result.stderr) {
          addToConsole(result.stderr, 'error');
        }
      } else {
        addToConsole(result.error || 'Command failed', 'error');
      }
    } catch (error) {
      addToConsole(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  const startPreviewServer = async () => {
    if (Object.keys(project.files).length === 0) {
      addToConsole('No files to preview. Generate some code first!', 'error');
      return;
    }

    try {
      setIsServerRunning(true);
      addToConsole('Starting preview server...', 'info');

      const response = await fetch(`/api/projects/${projectId}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: project.files }),
      });

      const result = await response.json();
      
      if (result.success) {
        setPreviewUrl(result.previewUrl);
        addToConsole(`Preview server started at ${result.previewUrl}`, 'success');
        addToConsole('Dependencies are being installed automatically...', 'info');
      } else {
        addToConsole(`Failed to start server: ${result.error}`, 'error');
        setIsServerRunning(false);
      }
    } catch (error) {
      addToConsole(`Error starting server: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      setIsServerRunning(false);
    }
  };

  const stopPreviewServer = async () => {
    try {
      await fetch(`/api/projects/${projectId}/preview`, { method: 'DELETE' });
      setPreviewUrl(null);
      setIsServerRunning(false);
      addToConsole('Preview server stopped', 'info');
    } catch (error) {
      addToConsole(`Error stopping server: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commandInput.trim() && !isExecuting) {
      executeCommand(commandInput.trim());
      setCommandInput('');
    }
  };

  const handleClearConsole = () => {
    setConsoleOutput([
      { timestamp: new Date().toLocaleTimeString(), message: 'Terminal cleared', type: 'info' }
    ]);
  };

  const renderPreviewContent = () => {
    if (previewUrl) {
      return (
        <div className="flex-1 bg-white m-4 rounded-lg overflow-hidden">
          <iframe
            id="preview-iframe"
            src={previewUrl}
            className="w-full h-full border-none"
            title="Live Preview"
          />
        </div>
      );
    }
    
    if (Object.keys(project.files).length > 0) {
      return (
        <div className="flex-1 flex items-center justify-center text-[var(--replit-text-dim)]">
          <div className="text-center">
            <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click "Start Server" to run your project</p>
            <p className="text-sm">Your files will be served on localhost:5000</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--replit-text-dim)]">
        <div className="text-center">
          <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No files to preview</p>
          <p className="text-sm">Generate some code to see a live preview</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-[var(--replit-border)]">
        {tabs.map(tab => (
          <Button
            key={tab.id}
            variant="ghost"
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-none border-b-2 border-transparent transition-colors ${
              activeTab === tab.id
                ? 'tab-button active bg-[var(--replit-hover)] border-[var(--replit-accent)]'
                : 'hover:bg-[var(--replit-hover)]'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="mr-2 h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'preview' && (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-[var(--replit-border)]">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Live Preview</h3>
                <div className="flex items-center gap-2">
                  {isServerRunning ? (
                    <Button variant="destructive" size="sm" onClick={stopPreviewServer}>
                      <Square className="h-3 w-3 mr-1" />
                      Stop
                    </Button>
                  ) : (
                    <Button variant="default" size="sm" onClick={startPreviewServer}>
                      <Play className="h-3 w-3 mr-1" />
                      Start Server
                    </Button>
                  )}
                  {previewUrl && (
                    <Button variant="ghost" size="icon" onClick={() => window.open(previewUrl, '_blank')}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {renderPreviewContent()}
          </div>
        )}

        {activeTab === 'console' && (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-[var(--replit-border)]">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Terminal</h3>
                <Button variant="ghost" size="icon" onClick={handleClearConsole}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-1 bg-gray-900 text-green-400">
                {consoleOutput.map((entry, index) => (
                  <div
                    key={index}
                    className={`${
                      entry.type === 'command' ? 'text-blue-400 font-bold' :
                      entry.type === 'success' ? 'text-green-400' :
                      entry.type === 'error' ? 'text-red-400' :
                      'text-gray-300'
                    }`}
                  >
                    <span className="text-gray-500">[{entry.timestamp}]</span> {entry.message}
                  </div>
                ))}
                <div ref={consoleEndRef} />
              </div>
              <form onSubmit={handleCommandSubmit} className="p-4 border-t border-[var(--replit-border)] bg-gray-900">
                <div className="flex items-center gap-2">
                  <span className="text-green-400 font-mono">$</span>
                  <Input
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    placeholder="Enter command (e.g., npm install, ls, cat package.json)"
                    className="flex-1 bg-transparent border-none text-green-400 font-mono focus:outline-none"
                    disabled={isExecuting}
                  />
                  {isExecuting && (
                    <div className="text-yellow-400 text-sm">Running...</div>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <ChatInterface 
            project={project}
            onConsoleLog={addToConsole}
          />
        )}
      </div>
    </div>
  );
}
