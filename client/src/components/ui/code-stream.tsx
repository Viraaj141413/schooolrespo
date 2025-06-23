import { useState, useEffect } from 'react';
import { Code, FileText, Folder } from 'lucide-react';

interface CodeStreamProps {
  isActive: boolean;
  files?: string[];
}

export default function CodeStream({ isActive, files = [] }: CodeStreamProps) {
  const [streamingFiles, setStreamingFiles] = useState<string[]>([]);
  const [currentFile, setCurrentFile] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      if (files.length > 0 && currentFile < files.length) {
        setStreamingFiles(prev => [...prev, files[currentFile]]);
        setCurrentFile(prev => prev + 1);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isActive, files, currentFile]);

  if (!isActive) return null;

  return (
    <div className="bg-gray-900 text-green-400 rounded-lg p-4 my-3 max-h-40 overflow-y-auto">
      <div className="flex items-center space-x-2 mb-2">
        <Code className="w-4 h-4" />
        <span className="text-xs font-mono">Generating files...</span>
      </div>
      
      <div className="space-y-1">
        {streamingFiles.map((file, index) => (
          <div key={index} className="flex items-center space-x-2 animate-fadeIn">
            <FileText className="w-3 h-3 text-blue-400" />
            <span className="text-xs font-mono">{file}</span>
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-green-400 rounded-full animate-ping" />
              <div className="w-1 h-1 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
              <div className="w-1 h-1 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        ))}
        
        {isActive && (
          <div className="flex items-center space-x-2 text-yellow-400">
            <Folder className="w-3 h-3" />
            <span className="text-xs font-mono animate-pulse">Creating project structure...</span>
          </div>
        )}
      </div>
    </div>
  );
}