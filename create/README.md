# AI App Builder - Replit Clone

A complete AI-powered application builder that mimics Replit's interface and functionality. Built as a single HTML file with embedded React JavaScript.

## Features

- **Landing Page**: Describe what you want to build and get AI assistance
- **IDE Interface**: Complete development environment with file explorer, code editor, and preview
- **AI Chat**: Interactive AI assistant that modifies your code based on natural language requests
- **Multi-Language Support**: Automatically detects project type and generates appropriate files
  - React applications
  - Python projects
  - Node.js/Express servers
  - Static websites
- **Live Preview**: Real-time preview of your applications
- **Console Output**: Monitor your application's behavior
- **File Management**: Create, edit, and delete files with syntax highlighting

## Getting Started

1. Open `index.html` in your browser
2. Describe what you want to build in the text area
3. Click "Start Chat" to begin
4. Use the AI assistant to modify and enhance your project

## Supported Project Types

The AI automatically detects your project type based on keywords:

- **React Apps**: Include "react", "component", or "jsx" in your description
- **Python Projects**: Include "python", "data", "ml", or "ai"
- **API/Backend**: Include "api", "server", or "backend"
- **Web Apps**: Default for general web applications

## AI Commands

The AI assistant can help with:

- Adding new features and functionality
- Modifying existing code
- Fixing bugs and errors
- Updating styles and design
- Creating database/API integrations
- Setting up React components
- Writing Python scripts

## Usage Examples

Try these descriptions:
- "Todo list app with React"
- "Weather dashboard with API"
- "Python data analysis tool"
- "E-commerce store with shopping cart"
- "Portfolio website with animations"

## Running the Application

### Simple Method
Just open `index.html` in any modern web browser.

### Local Server Method
```bash
cd create
python3 -m http.server 8000
# Then visit http://localhost:8000
```

## File Structure

- `index.html` - Complete application (all-in-one file)
- `package.json` - Project metadata
- `README.md` - This documentation

## Technologies Used

- React 18 (via CDN)
- Babel (for JSX transformation)
- Lucide React (for icons)
- Modern CSS with gradients and animations
- JavaScript ES6+

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## AI Integration

The application is designed to work with Claude Sonnet API. To add your API key:

1. Look for the AI chat interface
2. The system is ready to accept your API configuration
3. Modify the `generateAIResponse` function to connect to your preferred AI service

## Contributing

This is a demonstration project showing how to build a Replit-like interface. Feel free to:

- Add more programming languages
- Enhance the AI integration
- Improve the UI/UX
- Add more developer tools

## License

MIT License - Feel free to use and modify as needed.

---

Built with AI assistance - Demonstrating the future of AI-powered development tools.