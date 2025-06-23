import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileContent } from '@/lib/file-system';
import { FileText, X } from 'lucide-react';

interface CodeEditorProps {
  files: Record<string, FileContent>;
  activeFile: string | null;
  openFiles: string[];
  onFileChange: (fileName: string, content: string) => void;
  onFileSelect: (fileName: string) => void;
  onFileClose: (fileName: string) => void;
}

export default function CodeEditor({
  files,
  activeFile,
  openFiles,
  onFileChange,
  onFileSelect,
  onFileClose
}: CodeEditorProps) {
  const [editorContent, setEditorContent] = useState('');

  useEffect(() => {
    if (activeFile && files[activeFile]) {
      setEditorContent(files[activeFile].content);
    } else {
      setEditorContent('');
    }
  }, [activeFile, files]);

  const handleContentChange = (content: string) => {
    setEditorContent(content);
    if (activeFile) {
      onFileChange(activeFile, content);
    }
  };

  const handleTabClose = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onFileClose(fileName);
  };

  return (
    <>
      {/* Editor Tabs */}
      <div className="replit-panel border-b border-[var(--replit-border)] flex items-center">
        {openFiles.map(fileName => (
          <div
            key={fileName}
            className={`flex items-center space-x-2 px-3 py-2 text-sm cursor-pointer border-r border-[var(--replit-border)] transition-colors min-w-0 max-w-48 ${
              fileName === activeFile 
                ? 'bg-[var(--replit-bg)] border-b-2 border-b-[var(--replit-accent)]' 
                : 'bg-[var(--replit-panel)] hover:bg-[var(--replit-hover)]'
            }`}
            onClick={() => onFileSelect(fileName)}
          >
            <FileText className="h-4 w-4 text-[var(--replit-text-dim)] flex-shrink-0" />
            <span className="truncate text-xs">{fileName.split('/').pop()}</span>
            {openFiles.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-[var(--replit-border)] flex-shrink-0 ml-1"
                onClick={(e) => handleTabClose(fileName, e)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Editor Content */}
      <div className="flex-1 relative">
        <Textarea
          value={editorContent}
          onChange={(e) => handleContentChange(e.target.value)}
          className="code-editor w-full h-full border-0 bg-[var(--replit-bg)] text-[var(--replit-text)] resize-none focus:ring-0 focus:outline-none"
          placeholder={activeFile ? `// Edit ${activeFile}...` : '// Select a file to start coding...'}
        />
      </div>
    </>
  );
}
