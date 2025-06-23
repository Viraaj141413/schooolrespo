import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Loader2, Send, Code, FileText, Zap, AlertCircle, CheckCircle, Info, X, Save, MessageSquare } from 'lucide-react';
import TypingAnimation from '@/components/ui/typing-animation';
import LoadingAnimation from '@/components/ui/loading-animation';
import CodeStream from '@/components/ui/code-stream';
import { Project } from '@/lib/file-system';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { Eye } from 'lucide-react';

// Enhanced Types and Interfaces
interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  type?: 'analysis' | 'code' | 'normal' | 'error' | 'system';
  metadata?: {
    filesGenerated?: string[];
    language?: string;
    stage?: string;
    complexity?: 'basic' | 'intermediate' | 'advanced' | 'enterprise';
    patterns?: string[];
    technologies?: string[];
    estimatedLines?: number;
  };
}

interface ChatInterfaceProps {
  project: Project;
  onConsoleLog: (message: string, type?: 'success' | 'error' | 'info') => void;
  onAppUpdate?: (htmlContent: string) => void;
  onFileGenerated?: (fileName: string, content: string, language: string) => void;
}

interface GenerationStage {
  id: string;
  name: string;
  description: string;
  progress: number;
  estimatedTime: number;
}

interface LiveCodingState {
  fileName: string;
  content: string;
  isActive: boolean;
  language: string;
  progress: number;
  complexity: string;
  patterns: string[];
}

interface APIResponse {
  response: string;
  success: boolean;
  error?: string;
  metadata?: {
    complexity?: string;
    patterns?: string[];
    technologies?: string[];
    estimatedLines?: number;
    architecture?: string;
  };
}

interface CancelToken {
  cancelled: boolean;
  cancel: () => void;
}

// Enhanced Constants with Advanced Code Generation Prompts
const ADVANCED_CODE_GENERATION_PROMPT = `
Generate production-ready, enterprise-level code with the following requirements:

ARCHITECTURE & PATTERNS:
- Clean Architecture with separation of concerns
- SOLID principles implementation
- Design patterns (Factory, Observer, Strategy, etc.)
- Dependency injection where applicable
- Error handling and logging
- Input validation and sanitization
- Security best practices
- Performance optimization
- Responsive design for web applications
- Accessibility compliance (WCAG 2.1)

TECHNOLOGY STACK:
- Modern JavaScript/TypeScript with ES6+ features
- React with hooks and modern patterns
- Node.js with Express for backend
- CSS3 with Flexbox/Grid
- HTML5 semantic markup
- Database integration (SQL/NoSQL)
- API design (RESTful/GraphQL)
- Authentication and authorization
- Testing frameworks (Jest, Cypress)
- Build tools and bundlers

CODE QUALITY:
- Comprehensive documentation
- Type safety and interfaces
- Unit and integration tests
- Code linting and formatting
- Performance monitoring
- Error boundaries and fallbacks
- Loading states and skeletons
- Progressive enhancement
- Cross-browser compatibility
- Mobile-first approach

Generate complete, working applications with multiple files, proper structure, and professional-grade implementation.
`;

const GENERATION_STAGES: GenerationStage[] = [
  { id: 'analyzing', name: 'Analyzing Requirements', description: 'Understanding your request and planning the build', progress: 5, estimatedTime: 3 },
  { id: 'planning', name: 'Planning Architecture', description: 'Designing the application structure and tech stack', progress: 12, estimatedTime: 4 },
  { id: 'scaffolding', name: 'Creating Project Structure', description: 'Setting up folders and configuration files', progress: 25, estimatedTime: 2 },
  { id: 'dependencies', name: 'Installing Dependencies', description: 'Adding required packages and libraries', progress: 35, estimatedTime: 3 },
  { id: 'core', name: 'Building Core Components', description: 'Creating main application logic and components', progress: 50, estimatedTime: 8 },
  { id: 'styling', name: 'Designing Interface', description: 'Implementing UI design and responsive layouts', progress: 65, estimatedTime: 5 },
  { id: 'features', name: 'Adding Features', description: 'Implementing specific functionality and interactions', progress: 78, estimatedTime: 6 },
  { id: 'testing', name: 'Testing & Validation', description: 'Ensuring everything works correctly', progress: 88, estimatedTime: 3 },
  { id: 'polishing', name: 'Final Polish', description: 'Adding finishing touches and optimizations', progress: 95, estimatedTime: 2 },
  { id: 'complete', name: 'Build Complete', description: 'Your application is ready!', progress: 100, estimatedTime: 0 }
];

// Custom Hooks
const useProgress = (stages: GenerationStage[], currentStage: string) => {
  return useMemo(() => {
    const stage = stages.find(s => s.id === currentStage);
    return stage ? stage.progress : 0;
  }, [stages, currentStage]);
};

const useRetry = (maxRetries: number = 3) => {
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(async (fn: () => Promise<any>) => {
    for (let i = 0; i <= maxRetries; i++) {
      try {
        setRetryCount(i);
        return await fn();
      } catch (error) {
        if (i === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
  }, [maxRetries]);

  return { retry, retryCount };
};

const useTypingEffect = (text: string, speed: number = 50) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!text) return;

    setIsTyping(true);
    setDisplayText('');

    let currentIndex = 0;
    const timer = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayText(prev => prev + text[currentIndex]);
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayText, isTyping };
};

// Memoized Components
const MessageBubble = memo(({ message, onDismiss }: { message: ChatMessage; onDismiss?: () => void }) => {
  const { displayText, isTyping } = useTypingEffect(
    message.sender === 'ai' ? message.content : '', 
    message.type === 'code' ? 10 : 30
  );

  return (
    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
      <div className={`max-w-[85%] relative ${
        message.sender === 'user'
          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
          : 'bg-gray-800/90 backdrop-blur-sm text-white border border-gray-700/50 shadow-xl'
      } rounded-xl p-4`}>

        {/* Avatar */}
        <div className={`absolute -top-2 ${message.sender === 'user' ? '-right-2' : '-left-2'} w-6 h-6 rounded-full border-2 border-gray-800 flex items-center justify-center text-xs font-semibold ${
          message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
        }`}>
          {message.sender === 'user' ? 'U' : 'AI'}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {message.sender === 'ai' && getMessageIcon(message.type)}
            <span className="text-xs text-gray-400">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {message.type && (
              <Badge variant="outline" className="text-xs bg-gray-700/50 text-gray-300 border-gray-600">
                {message.type}
              </Badge>
            )}
          </div>
          {message.type === 'error' && onDismiss && (
            <Button variant="ghost" size="icon" onClick={onDismiss} className="h-4 w-4 hover:bg-gray-700">
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="whitespace-pre-wrap leading-relaxed">
          {message.sender === 'ai' ? (displayText || message.content) : message.content}
          {isTyping && <span className="animate-pulse">|</span>}
        </div>

        {/* Metadata */}
        {message.metadata && (
          <div className="mt-3 pt-3 border-t border-gray-700/50">
            <div className="flex flex-wrap gap-2 text-xs">
              {message.metadata.complexity && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                  {message.metadata.complexity}
                </Badge>
              )}
              {message.metadata.technologies?.map(tech => (
                <Badge key={tech} variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                  {tech}
                </Badge>
              ))}
              {message.metadata.estimatedLines && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                  ~{message.metadata.estimatedLines} lines
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

const ProgressIndicator = memo(({ stage, progress, isVisible }: { stage: string; progress: number; isVisible: boolean }) => {
  if (!isVisible) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">{stage}</span>
        <span className="text-xs text-gray-400">{progress}%</span>
      </div>
      <Progress value={progress} className="h-2 bg-gray-700">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </Progress>
    </div>
  );
});

const getMessageIcon = (type?: string) => {
  switch (type) {
    case 'analysis': return <Zap className="w-4 h-4 text-blue-500" />;
    case 'code': return <Code className="w-4 h-4 text-green-500" />;
    case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'system': return <Info className="w-4 h-4 text-purple-500" />;
    default: return <MessageSquare className="w-4 h-4 text-gray-400" />;
  }
};

// Helper functions - moved to top to avoid hoisting issues
const getLanguageFromFileName = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js': return 'javascript';
    case 'ts': return 'typescript';
    case 'tsx': return 'tsx';
    case 'jsx': return 'jsx';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'py': return 'python';
    case 'json': return 'json';
    default: return 'text';
  }
};

const getFileDescription = (fileName: string): string => {
  if (fileName.includes('package.json')) return 'Project configuration and dependencies';
  if (fileName.includes('index.html')) return 'Main HTML entry point';
  if (fileName.includes('App.')) return 'Main application component';
  if (fileName.includes('style') || fileName.includes('.css')) return 'Styling and layout definitions';
  if (fileName.includes('component') || fileName.includes('Component')) return 'UI component implementation';
  if (fileName.includes('util') || fileName.includes('helper')) return 'Utility functions and helpers';
  if (fileName.includes('config')) return 'Application configuration';
  if (fileName.includes('README')) return 'Project documentation';
  if (fileName.includes('tsconfig')) return 'TypeScript configuration';
  if (fileName.includes('vite.config')) return 'Build tool configuration';
  return 'Application logic and functionality';
};

const generateFileName = (codeBlock: string, index: number): string => {
    // Try to extract filename from comment in code
    const lines = codeBlock.split('\n');
    for (const line of lines.slice(0, 5)) {
      const fileMatch = line.match(/(?:\/\/|\/\*|\#|<!--)\s*(?:filename:|file:)?\s*([a-zA-Z0-9._-]+\.[a-zA-Z0-9]+)/i);
      if (fileMatch) {
        return fileMatch[1];
      }
    }

    // Detect file type from code content
    if (codeBlock.includes('<!DOCTYPE html') || codeBlock.includes('<html')) return `index.html`;
    if (codeBlock.includes('package.json') || codeBlock.includes('"name"') && codeBlock.includes('"version"')) return 'package.json';
    if (codeBlock.includes('body {') || codeBlock.includes('@media') || codeBlock.includes('font-family:')) return 'style.css';
    if (codeBlock.includes('const express') || codeBlock.includes('app.listen')) return 'server.js';
    if (codeBlock.includes('class ') && codeBlock.includes('constructor')) return 'app.js';
    if (codeBlock.includes('function ') || codeBlock.includes('const ') || codeBlock.includes('let ')) return `script${index + 1}.js`;

    return `file${index + 1}.txt`;
  };

export default function ChatInterface({ project, onConsoleLog, onAppUpdate, onFileGenerated }: ChatInterfaceProps) {
  const { createProject } = useProjects();
  const { user } = useAuth();
  const { retry, retryCount } = useRetry(3);

  // State Management
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      content: 'Hey! 👋 I\'m your AI coding assistant.\n\nI can build complete applications from scratch - websites, games, tools, calculators, dashboards, and more! Just describe what you want and I\'ll:\n\n🔨 **Analyze** your requirements\n🏗️ **Design** the architecture  \n📁 **Create** all necessary files\n✨ **Build** a fully working app\n\nI take my time to craft quality code with proper structure, styling, and functionality. What would you like me to build for you?',
      timestamp: new Date(),
      type: 'system'
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [liveCoding, setLiveCoding] = useState<LiveCodingState>({
    fileName: '',
    content: '',
    isActive: false,
    language: '',
    progress: 0,
    complexity: '',
    patterns: []
  });
  const [isGenerationMode, setIsGenerationMode] = useState(true);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [errorAlerts, setErrorAlerts] = useState<string[]>([]);
  const [cancelToken, setCancelToken] = useState<CancelToken | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Effects
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleAutoStart = (event: CustomEvent) => {
      if (event.detail?.prompt) {
        handleSubmit(event.detail.prompt);
      }
    };

    // Check for auto-start message from landing page
    const autoStartMessage = localStorage.getItem('autoStartMessage');
    if (autoStartMessage) {
      localStorage.removeItem('autoStartMessage'); // Clear it so it doesn't auto-send again
      setTimeout(() => {
        handleSubmit(autoStartMessage);
      }, 500); // Small delay to let component fully load
    }

    window.addEventListener('autoStartGeneration' as any, handleAutoStart);
    return () => {
      window.removeEventListener('autoStartGeneration' as any, handleAutoStart);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Progress calculation
  const currentProgress = useProgress(GENERATION_STAGES, currentStage);

  // Character count for input
  const characterCount = inputValue.length;
  const maxCharacters = 2000;

  // Handlers
  const createCancelToken = useCallback((): CancelToken => {
    const token = { cancelled: false, cancel: () => {} };
    token.cancel = () => { token.cancelled = true; };
    return token;
  }, []);

  const isCodeGenerationRequest = useCallback((input: string): boolean => {
    const lowerInput = input.toLowerCase().trim();

    // Direct creation keywords
    const creationWords = ['make', 'create', 'build', 'generate', 'develop', 'design', 'write'];
    const hasCreationWord = creationWords.some(word => lowerInput.includes(word));

    // Any descriptive content that could become an app
    const appIndicators = [
      'app', 'website', 'page', 'tool', 'calculator', 'converter', 'tracker',
      'timer', 'clock', 'weather', 'todo', 'list', 'form', 'login', 'signup',
      'dashboard', 'gallery', 'portfolio', 'blog', 'shop', 'game', 'quiz',
      'chart', 'graph', 'button', 'menu', 'navbar', 'sidebar', 'modal'
    ];

    // Function/utility requests
    const functionalWords = [
      'function', 'script', 'code', 'program', 'algorithm', 'component'
    ];

    // Check if it's a descriptive request about something that could be built
    const hasAppIndicator = appIndicators.some(indicator => lowerInput.includes(indicator));
    const hasFunctionalWord = functionalWords.some(word => lowerInput.includes(indicator));

    // Skip pure questions
    const questionStarters = ['what is', 'how does', 'why does', 'when does', 'where is', 'who is'];
    const isQuestion = questionStarters.some(starter => lowerInput.startsWith(starter));

    if (isQuestion) return false;

    // Generate code if it has creation words OR describes something buildable
    return hasCreationWord || hasAppIndicator || hasFunctionalWord;
  }, []);

  const handleUnifiedResponse = useCallback(async (userInput: string, token: CancelToken) => {
    // Start with analysis stage like Replit Agent
    setCurrentStage('Analyzing Requirements');
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (token.cancelled) return;

    setCurrentStage('Designing Architecture');
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (token.cancelled) return;

    setCurrentStage('Setting Up Structure');
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (token.cancelled) return;

    // Make the API request
    const response = await fetch('/api/claude-proxy', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8'
      },
      body: JSON.stringify({ prompt: userInput })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    setCurrentStage('Building Frontend');
    await new Promise(resolve => setTimeout(resolve, 500));

    let cleanResponse = '';
    const filesCreated: string[] = [];

    if (data.files && Array.isArray(data.files)) {
      // Handle structured file response from code generation API with proper staging
      for (let i = 0; i < data.files.length; i++) {
        const file = data.files[i];
        if (token.cancelled) break;

        // Show file being created
        setLiveCoding(prev => ({
          ...prev,
          fileName: file.filename,
          language: file.language || 'javascript',
          isActive: true,
          content: '',
          progress: 0
        }));

        // Simulate typing the file content
        await simulateTyping(file.content, file.filename, file.language || 'javascript');

        if (onFileGenerated && file.filename && file.content) {
          onFileGenerated(file.filename, file.content, file.language || 'javascript');
          filesCreated.push(file.filename);
          onConsoleLog(`✅ Created ${file.filename}`, 'success');
        }

        // Small delay between files
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      setLiveCoding(prev => ({ ...prev, isActive: false }));

      // Create clean conversational response for code generation
      if (filesCreated.length > 0) {
        cleanResponse = `I've created your ${userInput.toLowerCase().includes('calculator') ? 'calculator' : 'application'} with ${filesCreated.length} files. The project structure includes:\n\n${filesCreated.map(f => `• ${f}`).join('\n')}\n\nYour application is ready to use!`;
      } else {
        cleanResponse = "I've generated the code for your project. The files should now be available.";
      }
    } else {
      // Handle chat response with code extraction
      const aiResponse = data.response || "I received your message but couldn't generate a response. Please try again.";

      // Enhanced text cleaning for chat responses
      cleanResponse = aiResponse;
      if (typeof cleanResponse === 'string') {
        cleanResponse = cleanResponse
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
          .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '') // Keep only printable ASCII and Unicode
          .replace(/(.)\1{3,}/g, '$1') // Fix repeated characters (more than 3 times)
          .replace(/([a-zA-Z])\1{2,}/g, '$1') // Remove character repetitions
          .replace(/\b(\w)\1+\b/g, '$1') // Fix stuttered words
          .replace(/\s+/g, ' ') // Normalize multiple spaces
          .replace(/([a-z])([A-Z])/g, '$1 $2') // Fix missing spaces between words
          .replace(/undefined/g, '') // Remove undefined text
          .trim();
      }

      // Extract code blocks and create files with staging
      const codeBlocks = cleanResponse.match(/```(\w+)?\n([\s\S]*?)```/g) || [];

      if (codeBlocks.length > 0) {
        setCurrentStage('Generating Code Files');

        for (let i = 0; i < codeBlocks.length; i++) {
          if (token.cancelled) break;

          const block = codeBlocks[i];
          const languageMatch = block.match(/```(\w+)/);
          const language = languageMatch ? languageMatch[1] : 'javascript';
          const code = block.replace(/```\w*\n/, '').replace(/```$/, '');

          // Generate appropriate filename based on content and language
          let fileName = generateFileName(code, i);

          // Override with better names for common patterns
          if (language === 'html' || code.includes('<html>') || code.includes('<!DOCTYPE')) {
            fileName = 'index.html';
          } else if (language === 'css' || code.includes('@media') || code.includes('body {')) {
            fileName = 'styles.css';
          } else if (language === 'javascript' || language === 'js' || language === 'jsx') {
            if (code.includes('Calculator') && code.includes('function')) {
              fileName = 'calculator.js';
            } else if (code.includes('React') || code.includes('useState')) {
              fileName = 'App.jsx';
            } else {
              fileName = 'script.js';
            }
          }

          // Show file being created with progress
          setLiveCoding(prev => ({
            ...prev,
            fileName: fileName,
            language: language,
            isActive: true,
            content: '',
            progress: 0
          }));

          // Simulate typing the file content
          await simulateTyping(code, fileName, language);

          if (onFileGenerated) {
            onFileGenerated(fileName, code, language);
            onConsoleLog(`✅ Created ${fileName}`, 'success');
          }

          filesCreated.push(fileName);

          // Small delay between files
          await new Promise(resolve => setTimeout(resolve, 600));
        }

        setLiveCoding(prev => ({ ...prev, isActive: false }));

        // Remove code blocks from the response to clean it up like Replit Agent
        cleanResponse = cleanResponse.replace(/```[\s\S]*?```/g, '').trim();

        // If response is mostly just code blocks, provide a clean conversational response
        if (cleanResponse.length < 50 && filesCreated.length > 0) {
          cleanResponse = `I've created your ${userInput.toLowerCase().includes('calculator') ? 'calculator' : 'application'} with ${filesCreated.length} files:\n\n${filesCreated.map(f => `• ${f}`).join('\n')}\n\nYour project is ready to use!`;
        } else if (filesCreated.length > 0) {
          // Just clean up the response without adding file list
          cleanResponse = cleanResponse.replace(/\n\s*\n/g, '\n').trim();
        }
      }
    }

    // Final optimization stage
    if (filesCreated.length > 0) {
      setCurrentStage('Final Optimization');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCurrentStage('Generation Complete');
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const aiMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'ai',
      content: cleanResponse,
      timestamp: new Date(),
      type: filesCreated.length > 0 ? 'code' : 'normal',
      metadata: filesCreated.length > 0 ? {
        filesGenerated: filesCreated,
        technologies: ['HTML', 'CSS', 'JavaScript'],
        estimatedLines: filesCreated.length * 50, // Rough estimate
        complexity: filesCreated.length > 3 ? 'advanced' : 'intermediate'
      } : undefined
    };

    setMessages(prev => [...prev, aiMessage]);

    if (filesCreated.length > 0) {
      setGenerationComplete(true);
      setIsGenerationMode(false);
      onConsoleLog(`🎉 Generated ${filesCreated.length} files successfully!`, 'success');
    }
  }, [onFileGenerated, simulateTyping, generateFileName, onConsoleLog]);

  const handleAIResponse = useCallback(async (userInput: string) => {
    setIsLoading(true);
    setErrorAlerts([]);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    const token = createCancelToken();
    setCancelToken(token);

    try {
      // Show realistic build process
      await simulateRealistictBuildProcess(userInput, token);

      await retry(async () => {
        if (token.cancelled) throw new Error('Request cancelled');

        // Single unified response handler - no separate modes
        await handleUnifiedResponse(userInput, token);
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorId = Date.now().toString();

      setErrorAlerts(prev => [...prev, errorId]);

      const aiErrorMessage: ChatMessage = {
        id: errorId,
        sender: 'ai',
        content: `Error: ${errorMessage}\n\nPlease check your API connection and try again.`,
        timestamp: new Date(),
        type: 'error'
      };

      setMessages(prev => [...prev, aiErrorMessage]);
    } finally {
      setIsLoading(false);
      setCurrentStage('');
      setLiveCoding(prev => ({ ...prev, isActive: false }));
      setCancelToken(null);
      abortControllerRef.current = null;
    }
  }, [retry, createCancelToken, onFileGenerated, generateFileName, handleUnifiedResponse]);

  const handleSubmit = useCallback(async (message: string = inputValue) => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: message.trim(),
      timestamp: new Date(),
      type: 'normal'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    await handleAIResponse(message.trim());
  }, [inputValue, isLoading, handleAIResponse]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleFileGeneration = useCallback(async (userInput: string, token: CancelToken) => {
    setCurrentStage('Generating code...');

    const response = await fetch('/api/claude-proxy', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8'
      },
      body: JSON.stringify({ prompt: userInput })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    const aiResponse = data.response || "I'd be happy to help! Could you provide more specific details?";

    // Ensure response is properly encoded
    const cleanResponse = aiResponse.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();

    // Process code blocks and create files
    const codeBlocks = cleanResponse.match(/```(\w+)?\n([\s\S]*?)```/g) || [];
    const filesCreated: string[] = [];

    if (codeBlocks.length > 0) {
      for (let i = 0; i < codeBlocks.length; i++) {
        if (token.cancelled) break;

        const block = codeBlocks[i];
        const languageMatch = block.match(/```(\w+)/);
        const language = languageMatch ? languageMatch[1] : 'text';
        const code = block.replace(/```\w*\n/, '').replace(/```$/, '');

        const fileName = generateFileName(code, i);

        if (onFileGenerated) {
          onFileGenerated(fileName, code, language);
        }

        filesCreated.push(fileName);
      }
    }

    // Show the response
    const aiMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'ai',
      content: cleanResponse,
      timestamp: new Date(),
      type: codeBlocks.length > 0 ? 'code' : 'normal',
      metadata: filesCreated.length > 0 ? {
          filesGenerated: filesCreated,
          technologies: ['HTML',CSS, 'JavaScript'],
          estimatedLines: filesCreated.length * 50,
          complexity: filesCreated.length > 3 ? 'advanced' : 'intermediate'
      } : undefined
    };

    setMessages(prev => [...prev, aiMessage]);
  }, [onFileGenerated, generateFileName]);

  const simulateTyping = useCallback(async (content: string, fileName: string, language: string, speed: number = 20) => {
    return new Promise<void>(resolve => {
      let currentIndex = 0;
      const timer = setInterval(() => {
        if (currentIndex < content.length) {
          setLiveCoding(prev => ({
            ...prev,
            content: prev.content + content[currentIndex],
            progress: Math.min(100, Math.round(((currentIndex + 1) / content.length) * 100))
          }));
          currentIndex++;
        } else {
          clearInterval(timer);
          resolve();
        }
      }, speed);
    });
  }, []);

  const simulateRealistictBuildProcess = useCallback(async (userInput: string, token: CancelToken) => {
    for (const stage of GENERATION_STAGES) {
      if (token.cancelled) break;
      setCurrentStage(stage.id);
      await new Promise(resolve => setTimeout(resolve, stage.estimatedTime * 500));
    }
  }, []);

  const dismissErrorAlert = useCallback((id: string) => {
    setErrorAlerts(prev => prev.filter(alertId => alertId !== id));
  }, []);

  const handlePreview = useCallback(() => {
    setShowPreview(true);

    // Simulate building the app and creating a preview URL
    setTimeout(() => {
      setPreviewUrl('https://example.com/preview');
    }, 2000);
  }, []);

  const handleSave = useCallback(async () => {
    if (!project) {
      console.error('No project to save');
      return;
    }
    
    try {
      // Save project logic here
      await saveProject(project);
    } catch (error) {
      console.error('Error saving project:', error);
    } to.');
      return;
    }

    try {
      // Mock saving to backend (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1500));
      onConsoleLog(`✅ Project saved successfully!`, 'success');
    } catch (error) {
      console.error('Error saving project:', error);
      onConsoleLog(`🚨 Failed to save project. Please try again.`, 'error');
    }
  }, [project, onConsoleLog]);

  // Example usage in your frontend:
  const testHttpHandler = async () => {
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://jsonplaceholder.typicode.com/posts/1',
          method: 'GET',
          timeout: 5000,
          retries: 2,
          cacheTime: 300000
        })
      });

      const result = await response.json();
      console.log('HTTP Handler Result:', result);

      if (result.success) {
        console.log('Data:', result.data);
        console.log('Cached:', result.cached);
        console.log('Status:', result.status);
      } else {
        console.error('Error:', result.error);
      }
    } catch (error) {
      console.error('Request failed:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b border-gray-800/50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-white">AI Coding Assistant</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Save Button */}
          <Button variant="secondary" size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>

          {/* Preview Button */}
          <Button variant="secondary" size="sm" onClick={handlePreview}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      {/* Progress Indicator */}
      {isLoading && (
        <div className="p-4 border-b border-gray-800/50">
          <ProgressIndicator stage={currentStage} progress={currentProgress} isVisible={isLoading} />
        </div>
      )}

      {/* Live Coding Display */}
      {liveCoding.isActive && (
        <div className="p-4 border-b border-gray-800/50">
          <CodeStream
            fileName={liveCoding.fileName}
            content={liveCoding.content}
            language={liveCoding.language}
            progress={liveCoding.progress}
          />
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-grow overflow-y-auto p-4">
        {messages.map((message, index) => (
          <MessageBubble
            key={`${message.timestamp || Date.now()}-${index}-${message.sender === 'user' ? 'user' : 'ai'}`}
            message={message}
            onDismiss={() => dismissErrorAlert(message.id)}
          />
        ))}
        <div ref={messagesEndRef} /> {/* Scroll anchor */}
      </div>

      {/* Error Alerts */}
      {errorAlerts.length > 0 && (
        <div className="p-4 space-y-2">
          {errorAlerts.map(id => {
            const message = messages.find(m => m.id === id);
            return message ? (
              <Alert key={id} variant="destructive" onClose={() => dismissErrorAlert(id)}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {message.content}
                </AlertDescription>
              </Alert>
            ) : null;
          })}
        </div>
      )}

      {/* Chat Input */}
      <div className="p-4 border-t border-gray-800/50">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Describe your idea... (Ctrl/Cmd + Enter to send)"
            className="bg-gray-800/90 backdrop-blur-sm text-white border border-gray-700/50 shadow-xl rounded-md pr-12"
            disabled={isLoading}
          />
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="absolute right-1 top-1 rounded-md"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1 text-right">
          {characterCount}/{maxCharacters}
        </p>
      </div>
    </div>
  );
}