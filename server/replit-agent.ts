// Enhanced Replit Agent-style code generation engine
export function generateReplitResponse(prompt: string) {
  const promptLower = prompt.toLowerCase();
  
  // Determine project type and complexity
  const isWebApp = promptLower.includes('website') || promptLower.includes('web') || promptLower.includes('app');
  const isGame = promptLower.includes('game');
  const isAPI = promptLower.includes('api') || promptLower.includes('backend');
  const isReact = promptLower.includes('react') || promptLower.includes('component');
  const isPython = promptLower.includes('python') || promptLower.includes('ml') || promptLower.includes('ai');
  const isChat = promptLower.includes('chat') || promptLower.includes('messaging');
  const isDashboard = promptLower.includes('dashboard') || promptLower.includes('admin');
  const isEcommerce = promptLower.includes('ecommerce') || promptLower.includes('shop') || promptLower.includes('store');
  const isTodo = promptLower.includes('todo') || promptLower.includes('task') || promptLower.includes('reminder');
  
  // Generate comprehensive file structure based on project type
  let files = [
    'package.json',
    'tsconfig.json', 
    'vite.config.ts',
    'tailwind.config.js',
    'index.html',
    'src/main.tsx',
    'src/App.tsx',
    'src/components/Layout.tsx',
    'src/hooks/useApi.ts',
    'src/utils/helpers.ts',
    'src/styles/globals.css',
    'src/types/index.ts',
    '.gitignore',
    'README.md'
  ];

  // Add specific files based on project type
  if (isChat) {
    files.push(
      'src/components/ChatInterface.tsx',
      'src/components/MessageList.tsx',
      'src/components/MessageInput.tsx',
      'src/hooks/useWebSocket.ts',
      'src/context/ChatContext.tsx'
    );
  }

  if (isDashboard) {
    files.push(
      'src/components/Dashboard.tsx',
      'src/components/Sidebar.tsx',
      'src/components/Stats.tsx',
      'src/components/Charts.tsx',
      'src/hooks/useStats.ts'
    );
  }

  if (isEcommerce) {
    files.push(
      'src/components/ProductGrid.tsx',
      'src/components/Cart.tsx',
      'src/components/Checkout.tsx',
      'src/hooks/useCart.ts',
      'src/context/CartContext.tsx'
    );
  }

  if (isTodo) {
    files.push(
      'src/components/TodoList.tsx',
      'src/components/TodoItem.tsx',
      'src/components/AddTodo.tsx',
      'src/hooks/useTodos.ts'
    );
  }

  if (isGame) {
    files.push(
      'src/game/Engine.ts',
      'src/game/Physics.ts',
      'src/game/Player.ts',
      'src/game/GameState.ts'
    );
  }

  if (isAPI || files.length > 15) {
    files.push(
      'server/index.ts',
      'server/routes.ts',
      'server/database.ts',
      'server/middleware.ts'
    );
  }

  // Generate project-specific response
  let projectDescription = '';
  let techStack = [];
  let features = [];

  if (isChat) {
    projectDescription = 'real-time chat application';
    techStack.push('WebSocket integration', 'Real-time messaging');
    features.push('Live messaging', 'User presence', 'Message history');
  } else if (isDashboard) {
    projectDescription = 'comprehensive admin dashboard';
    techStack.push('Data visualization', 'Chart.js integration');
    features.push('Analytics', 'Real-time stats', 'User management');
  } else if (isEcommerce) {
    projectDescription = 'full-featured e-commerce platform';
    techStack.push('Payment integration', 'Shopping cart');
    features.push('Product catalog', 'Shopping cart', 'Checkout system');
  } else if (isTodo) {
    projectDescription = 'advanced todo application';
    techStack.push('Local storage', 'State management');
    features.push('Task management', 'Categories', 'Due dates');
  } else if (isGame) {
    projectDescription = 'interactive game';
    techStack.push('Canvas API', 'Game engine');
    features.push('Game mechanics', 'Physics', 'Score system');
  } else {
    projectDescription = 'modern web application';
    techStack.push('Modern React patterns');
    features.push('Responsive design', 'Interactive UI');
  }

  const response = `🚀 I'll create a ${projectDescription} from scratch!

## Building Your ${projectDescription.charAt(0).toUpperCase() + projectDescription.slice(1)}

Starting with zero files - generating everything from scratch...

### Project Structure (${files.length} files)
${files.map(file => `📄 \`${file}\``).join('\n')}

### Tech Stack
- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS + Custom Components
- State Management: React Hooks + Context
- Build: Modern ES modules with HMR
${techStack.map(tech => `- ${tech}`).join('\n')}

### Features
${features.map(feature => `✨ ${feature}`).join('\n')}
✨ Responsive design
✨ Modern UI/UX
✨ Type-safe development

## Generated Code

\`\`\`json
{
  "name": "${prompt.toLowerCase().replace(/[^a-z0-9]/g, '-')}-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "vitest": "^0.34.0"
  }
}
\`\`\`

\`\`\`json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "tests"],
  "exclude": ["node_modules"]
}
\`\`\`

\`\`\`typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts']
  }
})
\`\`\`

\`\`\`javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        }
      }
    }
  },
  plugins: [],
}
\`\`\`

\`\`\`html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${prompt.charAt(0).toUpperCase() + prompt.slice(1)}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
\`\`\`

## Quick Start
\`\`\`bash
npm install
npm run dev
\`\`\`

Your application will be available at http://localhost:3000

## Features
- Modern React 18 with TypeScript
- Tailwind CSS for styling
- Vite for fast development
- Vitest for testing
- Production-ready build configuration`;

  return { response, files };
}

export function generateFileContent(fileName: string, projectType: string): { content: string; language: string } {
  let content = '';
  let language = 'text';

  if (fileName.endsWith('.tsx')) {
    language = 'tsx';
    const componentName = fileName.split('/').pop()?.replace('.tsx', '') || 'Component';
    
    if (fileName.includes('App.tsx')) {
      const projectLower = projectType.toLowerCase();
      
      if (projectLower.includes('chat')) {
        content = `import React from 'react'
import ChatInterface from './components/ChatInterface'
import Layout from './components/Layout'

function App() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-900">
        <ChatInterface />
      </div>
    </Layout>
  )
}

export default App`;
      } else if (projectLower.includes('todo')) {
        content = `import React from 'react'
import TodoList from './components/TodoList'
import Layout from './components/Layout'

function App() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
            Smart Todo App
          </h1>
          <TodoList />
        </div>
      </div>
    </Layout>
  )
}

export default App`;
      } else if (projectLower.includes('dashboard')) {
        content = `import React from 'react'
import Dashboard from './components/Dashboard'
import Layout from './components/Layout'

function App() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <Dashboard />
      </div>
    </Layout>
  )
}

export default App`;
      } else {
        content = `import React from 'react'
import Layout from './components/Layout'

function App() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Your ${projectType}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Built with React, TypeScript, and Tailwind CSS
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default App`;
      }
    }
    } else if (fileName.includes('Layout.tsx')) {
      content = `import React from 'react'
import Header from './Header'
import Footer from './Footer'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}`;
    } else if (fileName.includes('Header.tsx')) {
      content = `import React from 'react'

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            ${projectType}
          </h1>
          <nav>
            <ul className="flex space-x-6">
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Home</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">About</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Contact</a></li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}`;
    } else if (fileName.includes('ChatInterface.tsx')) {
      content = `import React, { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\\'m your AI assistant. How can I help you today?',
      sender: 'ai',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Thanks for your message! I\\'m a demo AI assistant.',
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={\`flex \${message.sender === 'user' ? 'justify-end' : 'justify-start'}\`}
          >
            <div
              className={\`max-w-xs lg:max-w-md px-4 py-2 rounded-lg \${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900'
              }\`}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}`;
    } else if (fileName.includes('TodoList.tsx')) {
      content = `import React, { useState } from 'react'

interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: Date
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')

  const addTodo = () => {
    if (!input.trim()) return

    const newTodo: Todo = {
      id: Date.now().toString(),
      text: input,
      completed: false,
      createdAt: new Date()
    }

    setTodos(prev => [...prev, newTodo])
    setInput('')
  }

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id))
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a new task..."
          className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={addTodo}
          className="bg-blue-600 text-white px-6 py-2 rounded-r-lg hover:bg-blue-700"
        >
          Add
        </button>
      </div>

      <div className="space-y-2">
        {todos.map(todo => (
          <div
            key={todo.id}
            className={\`flex items-center p-3 border rounded-lg \${
              todo.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
            }\`}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span
              className={\`flex-1 \${
                todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
              }\`}
            >
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="text-red-500 hover:text-red-700 ml-2"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {todos.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No tasks yet. Add one above!
        </div>
      )}
    </div>
  )
}`;
    } else {
      content = `import React from 'react'

interface ${componentName}Props {
  // Add your props here
}

export default function ${componentName}({}: ${componentName}Props) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">${componentName}</h2>
      <p className="text-gray-600">Your ${componentName} component is ready!</p>
    </div>
  )
}`;
    }
  } else if (fileName.endsWith('.ts')) {
    language = 'typescript';
    if (fileName.includes('main.tsx')) {
      content = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;
    } else if (fileName.includes('types')) {
      content = `export interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}`;
    } else {
      content = `// ${fileName}
export const config = {
  apiUrl: process.env.VITE_API_URL || 'http://localhost:3000',
  isDevelopment: process.env.NODE_ENV === 'development'
}

export default config`;
    }
  } else if (fileName.endsWith('.css')) {
    language = 'css';
    content = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'Inter', system-ui, sans-serif;
  }
}

@layer components {
  .btn-primary {
    @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors;
  }
}`;
  } else if (fileName.endsWith('.json')) {
    language = 'json';
    content = `{
  "name": "${projectType.toLowerCase()}-app",
  "version": "1.0.0",
  "description": "Generated ${projectType} application"
}`;
  } else if (fileName.endsWith('.md')) {
    language = 'markdown';
    content = `# ${projectType}

A modern ${projectType} built with React, TypeScript, and Tailwind CSS.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features

- React 18 with TypeScript
- Tailwind CSS styling
- Vite build system
- Testing with Vitest

## Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run test\` - Run tests`;
  } else {
    content = `# ${fileName}

Generated file for ${projectType}`;
  }

  return { content, language };
}