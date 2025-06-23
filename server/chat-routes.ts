
import express from 'express';

// Add missing helper functions
function getTimerAppCode(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Timer App</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .timer { font-size: 48px; margin: 20px 0; }
        button { padding: 10px 20px; margin: 5px; font-size: 16px; }
    </style>
</head>
<body>
    <h1>Timer App</h1>
    <div class="timer" id="timer">00:00</div>
    <button onclick="startTimer()">Start</button>
    <button onclick="stopTimer()">Stop</button>
    <button onclick="resetTimer()">Reset</button>
    
    <script>
        let seconds = 0;
        let interval = null;
        
        function startTimer() {
            if (!interval) {
                interval = setInterval(() => {
                    seconds++;
                    updateDisplay();
                }, 1000);
            }
        }
        
        function stopTimer() {
            clearInterval(interval);
            interval = null;
        }
        
        function resetTimer() {
            seconds = 0;
            updateDisplay();
            stopTimer();
        }
        
        function updateDisplay() {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            document.getElementById('timer').textContent = 
                \`\${mins.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
        }
    </script>
</body>
</html>`;
}


import { Express } from 'express';

export function registerChatRoutes(app: Express) {
  const PRIMARY_API_BASE = 'https://rpelitis.created.app/api/code-generator';

  // Enhanced detection for code generation requests
  const shouldGenerateCode = (prompt: string): boolean => {
    const lowerPrompt = prompt.toLowerCase().trim();
    
    const creationWords = ['make', 'create', 'build', 'generate', 'develop', 'design', 'write'];
    const hasCreationWord = creationWords.some(word => lowerPrompt.includes(word));
    
    const appIndicators = [
      'app', 'website', 'page', 'tool', 'calculator', 'converter', 'tracker',
      'timer', 'clock', 'weather', 'todo', 'list', 'form', 'login', 'signup',
      'dashboard', 'gallery', 'portfolio', 'blog', 'shop', 'game', 'quiz',
      'chart', 'graph', 'button', 'menu', 'navbar', 'sidebar', 'modal'
    ];
    
    const functionalWords = [
      'function', 'script', 'code', 'program', 'algorithm', 'component'
    ];
    
    const hasAppIndicator = appIndicators.some(indicator => lowerPrompt.includes(indicator));
    const hasFunctionalWord = functionalWords.some(word => lowerPrompt.includes(word));
    
    const questionStarters = ['what is', 'how does', 'why does', 'when does', 'where is', 'who is'];
    const isQuestion = questionStarters.some(starter => lowerPrompt.startsWith(starter));
    
    if (isQuestion) return false;
    
    return hasCreationWord || hasAppIndicator || hasFunctionalWord;
  };

  // Smart parameter detection functions
  const detectLanguageFromPrompt = (prompt: string): string => {
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('react') || lowerPrompt.includes('jsx')) return 'javascript';
    if (lowerPrompt.includes('python') || lowerPrompt.includes('django') || lowerPrompt.includes('flask')) return 'python';
    if (lowerPrompt.includes('html') || lowerPrompt.includes('css') || lowerPrompt.includes('website')) return 'html';
    if (lowerPrompt.includes('vue') || lowerPrompt.includes('angular') || lowerPrompt.includes('javascript')) return 'javascript';
    return 'javascript';
  };

  const detectFrameworkFromPrompt = (prompt: string): string => {
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('react')) return 'react';
    if (lowerPrompt.includes('vue')) return 'vue';
    if (lowerPrompt.includes('angular')) return 'angular';
    if (lowerPrompt.includes('express') || lowerPrompt.includes('api')) return 'express';
    if (lowerPrompt.includes('django')) return 'django';
    if (lowerPrompt.includes('flask')) return 'flask';
    return '';
  };

  const detectComplexityFromPrompt = (prompt: string): string => {
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('simple') || lowerPrompt.includes('basic') || lowerPrompt.includes('quick')) return 'simple';
    if (lowerPrompt.includes('advanced') || lowerPrompt.includes('complex') || lowerPrompt.includes('enterprise')) return 'advanced';
    if (lowerPrompt.includes('dashboard') || lowerPrompt.includes('full') || lowerPrompt.includes('complete')) return 'advanced';
    return 'intermediate';
  };

  app.post('/api/claude-proxy', async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt || prompt.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Prompt is required' 
        });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      if (shouldGenerateCode(prompt)) {
        try {
          const requestBody = {
            description: prompt,
            language: detectLanguageFromPrompt(prompt),
            framework: detectFrameworkFromPrompt(prompt),
            complexity: detectComplexityFromPrompt(prompt),
            fileType: "multiple",
            apiKey: ""
          };

          console.log('Generating code with request:', requestBody);

          const response = await fetch(PRIMARY_API_BASE, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': 'AI-Chat-App/1.0'
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
          }

          const data = await response.json();
          
          if (data.success && data.files && Array.isArray(data.files)) {
            return res.json({
              success: true,
              files: data.files,
              totalFiles: data.files.length,
              metadata: data.metadata || {},
              source: 'api_enhanced'
            });
          } else {
            throw new Error(data.error || 'No files generated by API');
          }

        } catch (codeError) {
          clearTimeout(timeoutId);
          console.error('Code generation error:', codeError);
          
          const fallbackApp = generateFallbackApp(prompt);
          if (fallbackApp) {
            return res.json({
              success: true,
              files: fallbackApp.files,
              totalFiles: fallbackApp.files.length,
              source: 'enhanced_fallback'
            });
          }
          
          return res.status(500).json({
            success: false,
            error: 'Failed to generate code. Please try a different description.',
            source: 'code_error'
          });
        }
      }

      clearTimeout(timeoutId);
      return res.json({
        success: true,
        response: "I specialize in creating applications and tools! Try asking me to 'make a calculator', 'create a todo app', 'build a weather dashboard', or describe any tool you'd like me to build for you.",
        source: 'chat'
      });

    } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        source: 'server_error'
      });
    }
  });
}

function generateFallbackApp(prompt: string): { files: any[] } | null {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('calculator') || lowerPrompt.includes('mortgage')) {
    return {
      files: [
        {
          filename: 'index.html',
          content: getCalculatorHTML(),
          language: 'html',
          lineCount: 120
        },
        {
          filename: 'styles.css',
          content: getCalculatorCSS(),
          language: 'css',
          lineCount: 80
        },
        {
          filename: 'script.js',
          content: getCalculatorJS(),
          language: 'javascript',
          lineCount: 60
        }
      ]
    };
  }
  
  if (lowerPrompt.includes('weather')) {
    return {
      files: [{
        filename: 'WeatherApp.html',
        content: getWeatherAppCode(),
        language: 'html',
        lineCount: 150
      }]
    };
  }
  
  if (lowerPrompt.includes('todo') || lowerPrompt.includes('task')) {
    return {
      files: [
        {
          filename: 'index.html',
          content: getTodoHTML(),
          language: 'html',
          lineCount: 80
        },
        {
          filename: 'styles.css',
          content: getTodoCSS(),
          language: 'css',
          lineCount: 120
        },
        {
          filename: 'app.js',
          content: getTodoJS(),
          language: 'javascript',
          lineCount: 150
        }
      ]
    };
  }
  
  if (lowerPrompt.includes('timer') || lowerPrompt.includes('clock')) {
    return {
      files: [{
        filename: 'Timer.html',
        content: getTimerAppCode(),
        language: 'html',
        lineCount: 120
      }]
    };
  }

  if (lowerPrompt.includes('dashboard') || lowerPrompt.includes('chart')) {
    return {
      files: [{
        filename: 'Dashboard.html',
        content: getDashboardCode(),
        language: 'html',
        lineCount: 180
      }]
    };
  }
  
  return {
    files: [{
      filename: 'App.html',
      content: getGenericAppCode(prompt),
      language: 'html',
      lineCount: 100
    }]
  };
}

function getCalculatorHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mortgage Calculator</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="calculator-container">
        <h1>Mortgage Calculator</h1>
        <div class="form-group">
            <label for="loanAmount">Loan Amount ($)</label>
            <input type="number" id="loanAmount" placeholder="300000">
        </div>
        
        <div class="form-group">
            <label for="interestRate">Annual Interest Rate (%)</label>
            <input type="number" id="interestRate" step="0.01" placeholder="3.5">
        </div>
        
        <div class="form-group">
            <label for="loanTerm">Loan Term (years)</label>
            <input type="number" id="loanTerm" placeholder="30">
        </div>
        
        <button class="calculate-btn" onclick="calculateMortgage()">Calculate Payment</button>
        
        <div class="results" id="results">
            <h2>Payment Breakdown</h2>
            <div class="result-item">
                <span>Monthly Payment:</span>
                <span id="monthlyPayment">$0</span>
            </div>
            <div class="result-item">
                <span>Total Interest:</span>
                <span id="totalInterest">$0</span>
            </div>
            <div class="result-item">
                <span>Total Payment:</span>
                <span id="totalPayment">$0</span>
            </div>
        </div>
        
        <div class="chart-container">
            <canvas id="paymentChart" width="400" height="200"></canvas>
        </div>
    </div>
    
    <script src="script.js"></script>
</body>
</html>`;
}

function getCalculatorCSS() {
  return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.calculator-container {
    background: white;
    border-radius: 15px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    padding: 40px;
    max-width: 500px;
    width: 100%;
}

h1 {
    text-align: center;
    color: #333;
    margin-bottom: 30px;
    font-size: 2.5rem;
}

.form-group {
    margin-bottom: 20px;
}

label {
    display: block;
    margin-bottom: 8px;
    color: #555;
    font-weight: 600;
}

input {
    width: 100%;
    padding: 15px;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.3s;
}

input:focus {
    outline: none;
    border-color: #667eea;
}

.calculate-btn {
    width: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 15px;
    border-radius: 8px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s;
    margin: 20px 0;
}

.calculate-btn:hover {
    transform: translateY(-2px);
}

.results {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
    margin-top: 20px;
    display: none;
}

.results.show {
    display: block;
}

.results h2 {
    color: #333;
    margin-bottom: 15px;
}

.result-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #e1e5e9;
}

.result-item:last-child {
    border-bottom: none;
    font-weight: bold;
    font-size: 1.1rem;
}

.chart-container {
    margin-top: 30px;
    text-align: center;
}

#paymentChart {
    max-width: 100%;
    height: auto;
}`;
}

function getCalculatorJS() {
  return `function calculateMortgage() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value);
    const annualRate = parseFloat(document.getElementById('interestRate').value);
    const loanTerm = parseFloat(document.getElementById('loanTerm').value);
    
    if (!loanAmount || !annualRate || !loanTerm) {
        alert('Please fill in all fields');
        return;
    }
    
    // Convert annual rate to monthly rate
    const monthlyRate = annualRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    
    // Calculate monthly payment using mortgage formula
    const monthlyPayment = loanAmount * 
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    const totalPayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayment - loanAmount;
    
    // Display results
    document.getElementById('monthlyPayment').textContent = 
        '$' + monthlyPayment.toFixed(2);
    document.getElementById('totalInterest').textContent = 
        '$' + totalInterest.toFixed(2);
    document.getElementById('totalPayment').textContent = 
        '$' + totalPayment.toFixed(2);
    
    document.getElementById('results').classList.add('show');
    
    // Draw simple chart
    drawPaymentChart(loanAmount, totalInterest);
}

function drawPaymentChart(principal, interest) {
    const canvas = document.getElementById('paymentChart');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate percentages
    const total = principal + interest;
    const principalPercent = principal / total;
    const interestPercent = interest / total;
    
    // Draw pie chart
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;
    
    // Principal slice (blue)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, principalPercent * 2 * Math.PI);
    ctx.lineTo(centerX, centerY);
    ctx.fillStyle = '#667eea';
    ctx.fill();
    
    // Interest slice (purple)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, principalPercent * 2 * Math.PI, 2 * Math.PI);
    ctx.lineTo(centerX, centerY);
    ctx.fillStyle = '#764ba2';
    ctx.fill();
    
    // Labels
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.fillText('Principal', 20, 30);
    ctx.fillStyle = '#667eea';
    ctx.fillRect(10, 20, 15, 15);
    
    ctx.fillStyle = '#333';
    ctx.fillText('Interest', 20, 60);
    ctx.fillStyle = '#764ba2';
    ctx.fillRect(10, 50, 15, 15);
}`;
}

function getWeatherAppCode() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weather Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #74b9ff, #0984e3);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .weather-container {
            background: rgba(255, 255, 255, 0.95);
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 400px;
            width: 90%;
        }
        .search-input {
            width: 100%;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 10px;
            font-size: 16px;
            margin-bottom: 15px;
        }
        .search-btn {
            background: #0984e3;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            cursor: pointer;
        }
        .weather-info { display: none; }
        .weather-info.show { display: block; }
        .temperature { font-size: 48px; color: #0984e3; font-weight: bold; margin: 20px 0; }
        .weather-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
        .detail-item { background: #f8f9fa; padding: 15px; border-radius: 10px; }
    </style>
</head>
<body>
    <div class="weather-container">
        <h1 style="color: #2d3436; margin-bottom: 20px;">Weather Dashboard</h1>
        <input type="text" class="search-input" id="cityInput" placeholder="Enter city name...">
        <button class="search-btn" onclick="searchWeather()">Get Weather</button>
        
        <div class="weather-info" id="weatherInfo">
            <div id="cityName" style="font-size: 28px; color: #2d3436; margin: 20px 0;">New York</div>
            <div class="temperature" id="temperature">22°C</div>
            <div id="description" style="font-size: 18px; color: #636e72; margin-bottom: 20px;">Partly Cloudy</div>
            
            <div class="weather-details">
                <div class="detail-item">
                    <div style="font-size: 14px; color: #636e72;">Feels Like</div>
                    <div id="feelsLike" style="font-size: 18px; font-weight: bold;">25°C</div>
                </div>
                <div class="detail-item">
                    <div style="font-size: 14px; color: #636e72;">Humidity</div>
                    <div id="humidity" style="font-size: 18px; font-weight: bold;">65%</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function searchWeather() {
            const city = document.getElementById('cityInput').value.trim();
            if (!city) { alert('Please enter a city name'); return; }
            
            const temp = Math.floor(Math.random() * 30) + 5;
            const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Clear'];
            
            document.getElementById('cityName').textContent = city;
            document.getElementById('temperature').textContent = temp + '°C';
            document.getElementById('description').textContent = conditions[Math.floor(Math.random() * conditions.length)];
            document.getElementById('feelsLike').textContent = (temp + Math.floor(Math.random() * 6) - 3) + '°C';
            document.getElementById('humidity').textContent = (Math.floor(Math.random() * 40) + 40) + '%';
            
            document.getElementById('weatherInfo').classList.add('show');
        }
        
        document.getElementById('cityInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchWeather();
        });
        
        window.onload = () => document.getElementById('weatherInfo').classList.add('show');
    </script>
</body>
</html>`;
}

function getTodoHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Advanced Todo App</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="app-container">
        <header class="header">
            <h1>My Tasks</h1>
            <p class="subtitle">Stay organized and productive</p>
        </header>
        
        <div class="input-section">
            <div class="input-container">
                <input type="text" id="taskInput" placeholder="Add a new task..." maxlength="100">
                <select id="prioritySelect">
                    <option value="low">Low</option>
                    <option value="medium" selected>Medium</option>
                    <option value="high">High</option>
                </select>
                <button id="addTaskBtn">Add Task</button>
            </div>
        </div>
        
        <div class="filters">
            <button class="filter-btn active" data-filter="all">All</button>
            <button class="filter-btn" data-filter="pending">Pending</button>
            <button class="filter-btn" data-filter="completed">Completed</button>
            <button class="filter-btn" data-filter="high">High Priority</button>
        </div>
        
        <div class="tasks-container">
            <div id="tasksList" class="tasks-list"></div>
            <div class="empty-state" id="emptyState">
                <h3>No tasks yet!</h3>
                <p>Add your first task above to get started.</p>
            </div>
        </div>
        
        <div class="stats">
            <div class="stat">
                <span class="stat-number" id="totalTasks">0</span>
                <span class="stat-label">Total</span>
            </div>
            <div class="stat">
                <span class="stat-number" id="completedTasks">0</span>
                <span class="stat-label">Completed</span>
            </div>
            <div class="stat">
                <span class="stat-number" id="pendingTasks">0</span>
                <span class="stat-label">Pending</span>
            </div>
        </div>
    </div>
    
    <script src="app.js"></script>
</body>
</html>`;
}

function getTodoCSS() {
  return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 20px;
}

.app-container {
    max-width: 600px;
    margin: 0 auto;
    background: white;
    border-radius: 20px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
    overflow: hidden;
}

.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 40px 30px;
    text-align: center;
}

.header h1 {
    font-size: 2.5rem;
    margin-bottom: 10px;
}

.subtitle {
    opacity: 0.9;
    font-size: 1.1rem;
}

.input-section {
    padding: 30px;
    border-bottom: 1px solid #f0f0f0;
}

.input-container {
    display: flex;
    gap: 10px;
    align-items: center;
}

#taskInput {
    flex: 1;
    padding: 15px;
    border: 2px solid #e1e5e9;
    border-radius: 10px;
    font-size: 16px;
    transition: border-color 0.3s;
}

#taskInput:focus {
    outline: none;
    border-color: #667eea;
}

#prioritySelect {
    padding: 15px;
    border: 2px solid #e1e5e9;
    border-radius: 10px;
    background: white;
    cursor: pointer;
}

#addTaskBtn {
    background: #667eea;
    color: white;
    border: none;
    padding: 15px 25px;
    border-radius: 10px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.3s;
}

#addTaskBtn:hover {
    background: #5a6fd8;
}

.filters {
    display: flex;
    gap: 10px;
    padding: 20px 30px;
    border-bottom: 1px solid #f0f0f0;
}

.filter-btn {
    background: #f8f9fa;
    border: none;
    padding: 10px 15px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s;
}

.filter-btn.active {
    background: #667eea;
    color: white;
}

.tasks-container {
    min-height: 300px;
    position: relative;
}

.tasks-list {
    padding: 30px;
}

.task-item {
    display: flex;
    align-items: center;
    padding: 20px;
    margin-bottom: 15px;
    background: #f8f9fa;
    border-radius: 15px;
    border-left: 4px solid;
    transition: all 0.3s;
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.task-item.completed {
    opacity: 0.6;
    background: #e8f5e8;
}

.task-item.high { border-left-color: #e74c3c; }
.task-item.medium { border-left-color: #f39c12; }
.task-item.low { border-left-color: #27ae60; }

.task-checkbox {
    margin-right: 15px;
    width: 20px;
    height: 20px;
    cursor: pointer;
}

.task-content {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.task-text {
    font-size: 16px;
    margin-bottom: 5px;
}

.task-text.completed {
    text-decoration: line-through;
    color: #666;
}

.task-meta {
    font-size: 12px;
    color: #888;
    display: flex;
    gap: 15px;
}

.priority-badge {
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
}

.priority-badge.high { background: #ffe6e6; color: #e74c3c; }
.priority-badge.medium { background: #fff3e0; color: #f39c12; }
.priority-badge.low { background: #e8f5e8; color: #27ae60; }

.delete-btn {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
    transition: background 0.3s;
}

.delete-btn:hover {
    background: #c0392b;
}

.empty-state {
    text-align: center;
    padding: 60px 30px;
    color: #888;
}

.empty-state h3 {
    font-size: 1.5rem;
    margin-bottom: 10px;
}

.stats {
    display: flex;
    background: #f8f9fa;
    padding: 20px 30px;
}

.stat {
    flex: 1;
    text-align: center;
}

.stat-number {
    display: block;
    font-size: 2rem;
    font-weight: bold;
    color: #667eea;
}

.stat-label {
    font-size: 12px;
    color: #888;
    text-transform: uppercase;
}`;
}

function getTodoJS() {
  return `class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentFilter = 'all';
        this.initializeApp();
    }
    
    initializeApp() {
        this.bindEvents();
        this.render();
        this.updateStats();
    }
    
    bindEvents() {
        document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
    }
    
    addTask() {
        const input = document.getElementById('taskInput');
        const priority = document.getElementById('prioritySelect').value;
        const text = input.value.trim();
        
        if (!text) {
            this.showNotification('Please enter a task!', 'error');
            return;
        }
        
        const task = {
            id: Date.now(),
            text: text,
            priority: priority,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.tasks.unshift(task);
        this.saveTasks();
        this.render();
        this.updateStats();
        
        input.value = '';
        this.showNotification('Task added successfully!', 'success');
    }
    
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.render();
            this.updateStats();
        }
    }
    
    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.render();
            this.updateStats();
            this.showNotification('Task deleted!', 'info');
        }
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    }
    
    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'completed':
                return this.tasks.filter(t => t.completed);
            case 'pending':
                return this.tasks.filter(t => !t.completed);
            case 'high':
                return this.tasks.filter(t => t.priority === 'high');
            default:
                return this.tasks;
        }
    }
    
    render() {
        const tasksList = document.getElementById('tasksList');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            tasksList.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        tasksList.innerHTML = filteredTasks.map(task => this.renderTask(task)).join('');
    }
    
    renderTask(task) {
        const createdDate = new Date(task.createdAt).toLocaleDateString();
        const createdTime = new Date(task.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        return \`
            <div class="task-item \${task.completed ? 'completed' : ''} \${task.priority}" data-id="\${task.id}">
                <input type="checkbox" class="task-checkbox" \${task.completed ? 'checked' : ''} 
                       onchange="app.toggleTask(\${task.id})">
                <div class="task-content">
                    <div class="task-text \${task.completed ? 'completed' : ''}">\${task.text}</div>
                    <div class="task-meta">
                        <span class="priority-badge \${task.priority}">\${task.priority}</span>
                        <span>Created: \${createdDate} at \${createdTime}</span>
                        \${task.completed ? \`<span>✓ Completed</span>\` : ''}
                    </div>
                </div>
                <button class="delete-btn" onclick="app.deleteTask(\${task.id})">Delete</button>
            </div>
        \`;
    }
    
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        
        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
    }
    
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
    
    showNotification(message, type) {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = \`notification \${type}\`;
        notification.textContent = message;
        notification.style.cssText = \`
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            background: \${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        \`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the app
const app = new TodoApp();`;
}

function getTodoHTML() {
  return \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo App</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .todo-container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 500px;
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .input-section { padding: 30px; border-bottom: 1px solid #eee; }
        .input-container { display: flex; gap: 10px; }
        .todo-input {
            flex: 1;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
        }
        .add-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
        }
        .todo-item {
            display: flex;
            align-items: center;
            padding: 20px 30px;
            border-bottom: 1px solid #eee;
        }
        .todo-checkbox { margin-right: 15px; width: 20px; height: 20px; cursor: pointer; }
        .todo-text { flex: 1; font-size: 16px; }
        .delete-btn {
            background: #e74c3c;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        }
        .completed .todo-text { text-decoration: line-through; color: #999; }
        .stats { padding: 20px 30px; background: #f8f9fa; text-align: center; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="todo-container">
        <div class="header">
            <h1>Todo App</h1>
            <p>Stay organized and productive</p>
        </div>
        
        <div class="input-section">
            <div class="input-container">
                <input type="text" class="todo-input" id="todoInput" placeholder="Add a new task...">
                <button class="add-btn" onclick="addTodo()">Add</button>
            </div>
        </div>
        
        <div id="todoList">
            <div style="text-align: center; padding: 40px; color: #999;">
                No tasks yet. Add one above to get started!
            </div>
        </div>
        
        <div class="stats" id="stats">Total: 0 | Completed: 0 | Remaining: 0</div>
    </div>

    <script>
        let todos = [];
        let todoIdCounter = 1;
        
        function addTodo() {
            const input = document.getElementById('todoInput');
            const text = input.value.trim();
            if (!text) { alert('Please enter a task'); return; }
            
            todos.push({ id: todoIdCounter++, text: text, completed: false });
            input.value = '';
            renderTodos();
        }
        
        function toggleTodo(id) {
            todos = todos.map(todo => 
                todo.id === id ? { ...todo, completed: !todo.completed } : todo
            );
            renderTodos();
        }
        
        function deleteTodo(id) {
            todos = todos.filter(todo => todo.id !== id);
            renderTodos();
        }
        
        function renderTodos() {
            const todoList = document.getElementById('todoList');
            
            if (todos.length === 0) {
                todoList.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">No tasks yet. Add one above to get started!</div>';
            } else {
                todoList.innerHTML = todos.map(todo => \`
                    <div class="todo-item \${todo.completed ? 'completed' : ''}">
                        <input type="checkbox" class="todo-checkbox" 
                               \${todo.completed ? 'checked' : ''} 
                               onchange="toggleTodo(\${todo.id})">
                        <span class="todo-text">\${todo.text}</span>
                        <button class="delete-btn" onclick="deleteTodo(\${todo.id})">Delete</button>
                    </div>
                \`).join('');
            }
            
            const total = todos.length;
            const completed = todos.filter(todo => todo.completed).length;
            document.getElementById('stats').textContent = 
                \`Total: \${total} | Completed: \${completed} | Remaining: \${total - completed}\`;
        }
        
        document.getElementById('todoInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTodo();
        });
    </script>
</body>
</html>`;
}

function getTimerCode() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Timer App</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #ff6b6b, #ee5a24);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .timer-container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 400px;
            width: 90%;
        }
        .timer-display {
            font-size: 64px;
            font-weight: bold;
            color: #2d3436;
            margin: 30px 0;
            font-family: 'Courier New', monospace;
        }
        .input-section { display: flex; gap: 10px; margin-bottom: 30px; }
        .time-input {
            flex: 1;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            text-align: center;
            font-size: 16px;
        }
        .controls { display: flex; gap: 15px; justify-content: center; }
        .btn {
            padding: 15px 25px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
        }
        .start-btn { background: #00b894; color: white; }
        .pause-btn { background: #fdcb6e; color: white; }
        .reset-btn { background: #e17055; color: white; }
    </style>
</head>
<body>
    <div class="timer-container">
        <h1 style="color: #2d3436; margin-bottom: 20px;">Timer</h1>
        
        <div class="input-section">
            <input type="number" class="time-input" id="minutesInput" placeholder="Minutes" min="0" max="59" value="5">
            <input type="number" class="time-input" id="secondsInput" placeholder="Seconds" min="0" max="59" value="0">
        </div>
        
        <div class="timer-display" id="timerDisplay">05:00</div>
        
        <div class="controls">
            <button class="btn start-btn" id="startBtn" onclick="startTimer()">Start</button>
            <button class="btn pause-btn" id="pauseBtn" onclick="pauseTimer()" style="display: none;">Pause</button>
            <button class="btn reset-btn" onclick="resetTimer()">Reset</button>
        </div>
    </div>

    <script>
        let timer = null;
        let totalSeconds = 300;
        let currentSeconds = totalSeconds;
        let isRunning = false;
        
        function updateDisplay() {
            const minutes = Math.floor(currentSeconds / 60);
            const seconds = currentSeconds % 60;
            document.getElementById('timerDisplay').textContent = 
                \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
        }
        
        function startTimer() {
            if (!isRunning) {
                if (currentSeconds === totalSeconds) {
                    const minutes = parseInt(document.getElementById('minutesInput').value) || 0;
                    const seconds = parseInt(document.getElementById('secondsInput').value) || 0;
                    totalSeconds = minutes * 60 + seconds;
                    currentSeconds = totalSeconds;
                    
                    if (totalSeconds === 0) { alert('Please set a time greater than 0'); return; }
                }
                
                isRunning = true;
                document.getElementById('startBtn').style.display = 'none';
                document.getElementById('pauseBtn').style.display = 'inline-block';
                
                timer = setInterval(() => {
                    currentSeconds--;
                    updateDisplay();
                    
                    if (currentSeconds <= 0) {
                        clearInterval(timer);
                        isRunning = false;
                        document.getElementById('startBtn').style.display = 'inline-block';
                        document.getElementById('pauseBtn').style.display = 'none';
                        alert('Time\\'s up!');
                    }
                }, 1000);
            }
        }
        
        function pauseTimer() {
            if (isRunning) {
                clearInterval(timer);
                isRunning = false;
                document.getElementById('startBtn').style.display = 'inline-block';
                document.getElementById('pauseBtn').style.display = 'none';
            }
        }
        
        function resetTimer() {
            clearInterval(timer);
            isRunning = false;
            currentSeconds = totalSeconds;
            document.getElementById('startBtn').style.display = 'inline-block';
            document.getElementById('pauseBtn').style.display = 'none';
            updateDisplay();
        }
        
        updateDisplay();
    </script>
</body>
</html>`;
}

function getDashboardCode() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytics Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; background: #f5f6fa; min-height: 100vh; }
        .dashboard { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
            margin-bottom: 30px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
            text-align: center;
        }
        .stat-value { font-size: 36px; font-weight: bold; margin-bottom: 10px; }
        .stat-label { color: #666; font-size: 14px; text-transform: uppercase; }
        .chart-container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
            margin-bottom: 20px;
        }
        .bar-chart { display: flex; align-items: end; height: 200px; gap: 10px; }
        .bar {
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 4px 4px 0 0;
            min-width: 30px;
            display: flex;
            align-items: end;
            justify-content: center;
            color: white;
            font-size: 12px;
            padding-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1 style="color: #2d3436;">Analytics Dashboard</h1>
            <p style="color: #666; margin-top: 10px;">Real-time insights and performance metrics</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value" style="color: #00b894;">2,547</div>
                <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #fdcb6e;">$12,847</div>
                <div class="stat-label">Revenue</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #e17055;">89.3%</div>
                <div class="stat-label">Conversion Rate</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #a29bfe;">1,234</div>
                <div class="stat-label">Page Views</div>
            </div>
        </div>
        
        <div class="chart-container">
            <h2 style="margin-bottom: 20px;">Monthly Performance</h2>
            <div class="bar-chart">
                <div class="bar" style="height: 60%;">Jan</div>
                <div class="bar" style="height: 80%;">Feb</div>
                <div class="bar" style="height: 45%;">Mar</div>
                <div class="bar" style="height: 90%;">Apr</div>
                <div class="bar" style="height: 70%;">May</div>
                <div class="bar" style="height: 95%;">Jun</div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

function getGenericAppCode(prompt: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Custom App</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .app-container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 500px;
            width: 100%;
        }
        .feature-list { text-align: left; margin: 30px 0; }
        .feature-item {
            padding: 15px;
            margin: 10px 0;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .action-button {
            background: #667eea;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px;
        }
        .demo-section {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <div class="app-container">
        <h1>Custom Application</h1>
        <p style="color: #666; margin: 20px 0;">
            Created based on your request: "${prompt}"
        </p>
        
        <div class="feature-list">
            <div class="feature-item">✨ Responsive Design - Works on all devices</div>
            <div class="feature-item">🎨 Modern UI - Clean and professional interface</div>
            <div class="feature-item">⚡ Interactive Elements - Engaging user experience</div>
            <div class="feature-item">🔧 Customizable - Easy to modify and extend</div>
        </div>
        
        <button class="action-button" onclick="showDemo()">Try Demo</button>
        <button class="action-button" onclick="showInfo()">Learn More</button>
        
        <div class="demo-section" id="demoSection" style="display: none;">
            <h3>Demo Mode Active</h3>
            <p>Custom functionality based on your requirements.</p>
            <div style="margin-top: 20px;">
                <input type="text" placeholder="Enter data..." style="padding: 10px; margin: 5px; border: 1px solid #ddd; border-radius: 5px;">
                <button onclick="processData()" style="padding: 10px 20px; background: #00b894; color: white; border: none; border-radius: 5px; cursor: pointer;">Process</button>
            </div>
            <div id="output" style="margin-top: 15px; padding: 10px; background: white; border-radius: 5px; min-height: 50px;"></div>
        </div>
    </div>

    <script>
        function showDemo() {
            const demoSection = document.getElementById('demoSection');
            demoSection.style.display = demoSection.style.display === 'none' ? 'block' : 'none';
        }
        
        function showInfo() {
            alert('This application can be customized to meet your specific needs.');
        }
        
        function processData() {
            const input = document.querySelector('input[type="text"]');
            const output = document.getElementById('output');
            const data = input.value || 'No data entered';
            
            output.innerHTML = '<strong>Processed:</strong> ' + data + ' - Generated at ' + new Date().toLocaleTimeString();
            input.value = '';
        }
    </script>
</body>
</html>`;
}