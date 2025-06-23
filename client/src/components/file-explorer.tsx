
import { useState } from 'react';
import { getFileIcon } from '@/lib/file-system';
import { FileContent } from '@/lib/file-system';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Trash2, 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown,
  FileCode,
  FileImage,
  FileJson,
  Html5,
  FileType
} from 'lucide-react';

interface FileExplorerProps {
  files: Record<string, FileContent>;
  activeFile: string | null;
  onFileSelect: (fileName: string) => void;
  onFileDelete: (fileName: string) => void;
}

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
  isOpen?: boolean;
}

export default function FileExplorer({ files, activeFile, onFileSelect, onFileDelete }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src', 'components', 'pages']));

  const getFileTypeIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'tsx':
      case 'ts':
        return <FileCode className="h-4 w-4 text-blue-500" />;
      case 'jsx':
      case 'js':
        return <FileCode className="h-4 w-4 text-yellow-500" />;
      case 'html':
        return <Html5 className="h-4 w-4 text-orange-500" />;
      case 'css':
      case 'scss':
        return <FileType className="h-4 w-4 text-purple-500" />;
      case 'json':
        return <FileJson className="h-4 w-4 text-green-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <FileImage className="h-4 w-4 text-pink-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const buildFileTree = (): FileTreeNode[] => {
    const tree: FileTreeNode[] = [];
    const folders: Record<string, FileTreeNode> = {};

    Object.keys(files).forEach(filePath => {
      const parts = filePath.split('/');
      let currentPath = '';
      
      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (isFile) {
          const fileNode: FileTreeNode = {
            name: part,
            path: currentPath,
            type: 'file'
          };

          if (parentPath && folders[parentPath]) {
            if (!folders[parentPath].children) {
              folders[parentPath].children = [];
            }
            folders[parentPath].children.push(fileNode);
          } else {
            tree.push(fileNode);
          }
        } else {
          if (!folders[currentPath]) {
            const folderNode: FileTreeNode = {
              name: part,
              path: currentPath,
              type: 'folder',
              children: [],
              isOpen: expandedFolders.has(currentPath)
            };

            folders[currentPath] = folderNode;

            if (parentPath && folders[parentPath]) {
              if (!folders[parentPath].children) {
                folders[parentPath].children = [];
              }
              folders[parentPath].children.push(folderNode);
            } else {
              tree.push(folderNode);
            }
          }
        }
      });
    });

    return tree;
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  const handleDeleteFile = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${fileName}?`)) {
      onFileDelete(fileName);
    }
  };

  const renderTreeNode = (node: FileTreeNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.path);
    const paddingLeft = depth * 16 + 8;

    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          <div
            className="flex items-center space-x-1 p-1 hover:bg-[var(--replit-hover)] cursor-pointer text-sm transition-colors group"
            style={{ paddingLeft: `${paddingLeft}px` }}
            onClick={() => toggleFolder(node.path)}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-[var(--replit-text-dim)]" />
            ) : (
              <ChevronRight className="h-3 w-3 text-[var(--replit-text-dim)]" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500" />
            )}
            <span className="text-[var(--replit-text)] font-medium">{node.name}</span>
          </div>
          {isExpanded && node.children && (
            <div>
              {node.children.map(child => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        className={`flex items-center justify-between space-x-2 p-1 cursor-pointer text-sm transition-colors group ${
          node.path === activeFile
            ? 'bg-[var(--replit-accent)] text-white'
            : 'hover:bg-[var(--replit-hover)] text-[var(--replit-text)]'
        }`}
        style={{ paddingLeft: `${paddingLeft + 16}px` }}
        onClick={() => onFileSelect(node.path)}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {getFileTypeIcon(node.name)}
          <span className="truncate">{node.name}</span>
        </div>
        {Object.keys(files).length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20"
            onClick={(e) => handleDeleteFile(node.path, e)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  };

  const fileTree = buildFileTree();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2">
        {fileTree.map(node => renderTreeNode(node))}
      </div>
    </div>
  );
}
