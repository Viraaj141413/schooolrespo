
import express from 'express';
import path from 'path';
import fs from 'fs';
import { spawn, exec } from 'child_process';

let fileServer: any = null;
let currentPort = 5000;
let devProcess: any = null;

interface ProjectFile {
  content: string;
  language?: string;
}

interface Project {
  id: string;
  files: Record<string, ProjectFile>;
}

// Enhanced project type detection
function detectProjectType(files: Record<string, ProjectFile>): string {
  const fileNames = Object.keys(files);
  const hasHTML = fileNames.some(f => f.endsWith('.html'));
  const hasCSS = fileNames.some(f => f.endsWith('.css'));
  const hasJS = fileNames.some(f => f.endsWith('.js'));
  const hasJSX = fileNames.some(f => f.endsWith('.jsx') || f.endsWith('.tsx'));
  
  // Check for React components
  if (hasJSX) {
    return 'react';
  }
  
  // Check for complete web applications (HTML + CSS + JS)
  if (hasHTML && (hasCSS || hasJS)) {
    return 'webapp';
  }
  
  // Single HTML files with inline styles/scripts
  if (hasHTML) {
    return 'static';
  }
  
  // Pure JavaScript applications
  if (hasJS) {
    return 'vanilla-js';
  }
  
  return 'static';
}

// Create package.json for React/JS projects
function createPackageJson(projectType: string): string {
  const basePackage = {
    name: "ai-generated-project",
    version: "1.0.0",
    private: true,
    scripts: {}
  };

  if (projectType === 'react') {
    return JSON.stringify({
      ...basePackage,
      dependencies: {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-scripts": "5.0.1"
      },
      scripts: {
        "start": "react-scripts start",
        "build": "react-scripts build",
        "test": "react-scripts test",
        "eject": "react-scripts eject"
      },
      browserslist: {
        "production": [
          ">0.2%",
          "not dead",
          "not op_mini all"
        ],
        "development": [
          "last 1 chrome version",
          "last 1 firefox version",
          "last 1 safari version"
        ]
      }
    }, null, 2);
  }

  return JSON.stringify({
    ...basePackage,
    dependencies: {
      "express": "^4.18.2",
      "cors": "^2.8.5"
    },
    scripts: {
      "start": "node index.js",
      "dev": "node index.js"
    }
  }, null, 2);
}

// Create index.html wrapper for React components
function createReactWrapper(componentFiles: string[]): string {
  const componentName = componentFiles[0]?.replace('.jsx', '').replace('.tsx', '') || 'App';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Generated App</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>`;
}

// Create React index.js entry point
function createReactIndex(componentFiles: string[]): string {
  const componentName = componentFiles[0]?.replace('.jsx', '').replace('.tsx', '') || 'App';
  const componentFile = componentFiles[0] || 'App.jsx';
  
  return `import React from 'react';
import ReactDOM from 'react-dom/client';
import ${componentName} from './${componentFile.replace('.jsx', '').replace('.tsx', '')}';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <${componentName} />
  </React.StrictMode>
);`;
}

export function startFileServer(project: Project): Promise<number> {
  return new Promise((resolve, reject) => {
    // Stop existing processes
    if (fileServer) {
      fileServer.close();
    }
    if (devProcess) {
      devProcess.kill();
    }

    const projectType = detectProjectType(project.files);
    const tempDir = path.join(process.cwd(), 'temp-projects', project.id);
    
    // Clean and recreate directory
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      fs.mkdirSync(tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to setup temp directory:', error);
      return reject(error);
    }

    // Write project files to disk
    for (const [fileName, fileData] of Object.entries(project.files)) {
      try {
        const filePath = path.join(tempDir, fileName);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, fileData.content);
      } catch (error) {
        console.error(`Failed to write file ${fileName}:`, error);
        return reject(error);
      }
    }

    // Setup based on project type
    switch (projectType) {
      case 'webapp':
      case 'static':
        setupWebAppProject(project, tempDir, resolve, reject);
        break;
      case 'react':
        setupReactProject(project, tempDir, resolve, reject);
        break;
      case 'vanilla-js':
        setupVanillaJSProject(project, tempDir, resolve, reject);
        break;
      default:
        setupStaticProject(project, tempDir, resolve, reject);
    }
  });
}

function setupWebAppProject(project: Project, tempDir: string, resolve: Function, reject: Function) {
  // For web applications with HTML/CSS/JS, serve them directly
  const app = express();
  
  // Serve static files from temp directory
  app.use(express.static(tempDir));
  
  // Default route to index.html or first HTML file
  app.get('*', (req, res) => {
    const indexPath = path.join(tempDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // Find first HTML file
      const htmlFiles = Object.keys(project.files).filter(f => f.endsWith('.html'));
      if (htmlFiles.length > 0) {
        res.sendFile(path.join(tempDir, htmlFiles[0]));
      } else {
        res.status(404).send('No HTML file found');
      }
    }
  });

  currentPort = findAvailablePort();
  fileServer = app.listen(currentPort, '0.0.0.0', () => {
    console.log(`Web app server started on port ${currentPort}`);
    resolve(currentPort);
  });

  fileServer.on('error', (error: any) => {
    console.error('Web app server error:', error);
    reject(error);
  });
}

function setupVanillaJSProject(project: Project, tempDir: string, resolve: Function, reject: Function) {
  // Create a basic HTML wrapper for vanilla JS
  const jsFiles = Object.keys(project.files).filter(f => f.endsWith('.js'));
  const cssFiles = Object.keys(project.files).filter(f => f.endsWith('.css'));
  
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Generated App</title>
    ${cssFiles.map(css => `<link rel="stylesheet" href="${css}">`).join('\n    ')}
</head>
<body>
    <div id="app"></div>
    ${jsFiles.map(js => `<script src="${js}"></script>`).join('\n    ')}
</body>
</html>`;

  fs.writeFileSync(path.join(tempDir, 'index.html'), htmlContent);
  setupWebAppProject(project, tempDir, resolve, reject);
}

function findAvailablePort(): number {
  // Simple port finder starting from 5000
  return 5000 + Math.floor(Math.random() * 1000);
}

function setupReactProject(project: Project, tempDir: string, resolve: Function, reject: Function) {
  // Create React project structure
  const srcDir = path.join(tempDir, 'src');
  const publicDir = path.join(tempDir, 'public');
  
  fs.mkdirSync(srcDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });

  // Find React component files
  const componentFiles = Object.keys(project.files).filter(f => f.endsWith('.jsx') || f.endsWith('.tsx'));
  
  // Write component files to src directory
  Object.entries(project.files).forEach(([fileName, fileData]) => {
    if (fileName.endsWith('.jsx') || fileName.endsWith('.tsx') || fileName.endsWith('.js') || fileName.endsWith('.ts')) {
      fs.writeFileSync(path.join(srcDir, fileName), fileData.content);
    } else if (fileName.endsWith('.html')) {
      fs.writeFileSync(path.join(publicDir, fileName), fileData.content);
    } else {
      fs.writeFileSync(path.join(tempDir, fileName), fileData.content);
    }
  });

  // Create package.json
  fs.writeFileSync(path.join(tempDir, 'package.json'), createPackageJson('react'));
  
  // Create public/index.html if not exists
  if (!fs.existsSync(path.join(publicDir, 'index.html'))) {
    fs.writeFileSync(path.join(publicDir, 'index.html'), createReactWrapper(componentFiles));
  }
  
  // Create src/index.js if not exists
  if (!fs.existsSync(path.join(srcDir, 'index.js')) && !fs.existsSync(path.join(srcDir, 'index.jsx'))) {
    fs.writeFileSync(path.join(srcDir, 'index.js'), createReactIndex(componentFiles));
  }

  // Install dependencies and start dev server
  console.log('Installing React dependencies...');
  const installProcess = spawn('npm', ['install', '--silent'], { 
    cwd: tempDir, 
    stdio: ['ignore', 'pipe', 'pipe'] 
  });

  installProcess.on('close', (code) => {
    if (code === 0) {
      console.log('Starting React dev server...');
      
      // Start React dev server
      devProcess = spawn('npm', ['start'], { 
        cwd: tempDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, PORT: '5000', BROWSER: 'none' }
      });

      let serverStarted = false;
      devProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        if (output.includes('webpack compiled') || output.includes('Local:') || output.includes('localhost:5000')) {
          if (!serverStarted) {
            serverStarted = true;
            currentPort = 5000;
            resolve(5000);
          }
        }
      });

      devProcess.stderr.on('data', (data: Buffer) => {
        console.log('React dev server error:', data.toString());
      });

      // Fallback timeout
      setTimeout(() => {
        if (!serverStarted) {
          currentPort = 5000;
          resolve(5000);
        }
      }, 10000);

    } else {
      console.log('Failed to install dependencies, falling back to static server');
      setupStaticProject(project, tempDir, resolve, reject);
    }
  });
}

function setupStaticProject(project: Project, tempDir: string, resolve: Function, reject: Function) {
  // Write all files
  Object.entries(project.files).forEach(([fileName, fileData]) => {
    const filePath = path.join(tempDir, fileName);
    const fileDir = path.dirname(filePath);
    
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, fileData.content);
  });

  // Create a simple Express server for static files
  const app = express();
  
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  app.use(express.static(tempDir));

  app.get('*', (req, res) => {
    const indexPath = path.join(tempDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('File not found');
    }
  });

  const tryPort = (port: number) => {
    fileServer = app.listen(port, '0.0.0.0', () => {
      currentPort = port;
      console.log(`Static server started on port ${port}`);
      resolve(port);
    }).on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        tryPort(port + 1);
      } else {
        reject(err);
      }
    });
  };

  tryPort(5000);
}

function setupNodeProject(project: Project, tempDir: string, resolve: Function, reject: Function) {
  // Write all files
  Object.entries(project.files).forEach(([fileName, fileData]) => {
    const filePath = path.join(tempDir, fileName);
    const fileDir = path.dirname(filePath);
    
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, fileData.content);
  });

  // Create package.json if not exists
  if (!fs.existsSync(path.join(tempDir, 'package.json'))) {
    fs.writeFileSync(path.join(tempDir, 'package.json'), createPackageJson('node'));
  }

  // Try to run the project
  const mainFile = fs.existsSync(path.join(tempDir, 'index.js')) ? 'index.js' : 
                   fs.existsSync(path.join(tempDir, 'app.js')) ? 'app.js' : 
                   Object.keys(project.files).find(f => f.endsWith('.js'));

  if (mainFile) {
    devProcess = spawn('node', [mainFile], { 
      cwd: tempDir,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    devProcess.stdout.on('data', (data: Buffer) => {
      console.log('Node app output:', data.toString());
    });

    currentPort = 5000;
    resolve(5000);
  } else {
    setupStaticProject(project, tempDir, resolve, reject);
  }
}

export function stopFileServer() {
  if (fileServer) {
    fileServer.close();
    fileServer = null;
  }
  if (devProcess) {
    devProcess.kill();
    devProcess = null;
  }
}

export function getCurrentPort(): number {
  return currentPort;
}

// Execute terminal commands in project directory
export function executeCommand(projectId: string, command: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(process.cwd(), 'temp-projects', projectId);
    
    if (!fs.existsSync(tempDir)) {
      return reject(new Error('Project directory not found'));
    }

    const childProcess = spawn('bash', ['-c', command], {
      cwd: tempDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    childProcess.on('close', (code) => {
      resolve({
        success: code === 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code,
        command
      });
    });

    childProcess.on('error', (error) => {
      reject(new Error(`Command execution failed: ${error.message}`));
    });

    // Set a timeout for long-running commands
    setTimeout(() => {
      if (!childProcess.killed) {
        childProcess.kill();
        reject(new Error('Command timed out after 30 seconds'));
      }
    }, 30000);
  });
}
