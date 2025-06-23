
// Enhanced HTTP handler with caching and retry logic
const cache = new Map();

interface HandlerOptions {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cacheTime?: number;
}

export async function httpHandler({ 
  url, 
  method = 'GET', 
  headers = {}, 
  body, 
  timeout = 10000, 
  retries = 3, 
  cacheTime = 300000 
}: HandlerOptions) {
  const cacheKey = `${method}:${url}:${JSON.stringify(body)}`;
  
  if (method === 'GET' && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < cacheTime) {
      return {
        success: true,
        data: cached.data,
        cached: true,
        timestamp: cached.timestamp
      };
    }
    cache.delete(cacheKey);
  }

  if (!url) {
    return {
      success: false,
      error: 'URL parameter is required',
      code: 'MISSING_URL'
    };
  }

  const baseUrl = 'https://urlbackend.created.app';
  let targetUrl;
  
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      targetUrl = url;
    } else {
      targetUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
    }
    new URL(targetUrl);
  } catch (urlError) {
    return {
      success: false,
      error: 'Invalid URL format',
      code: 'INVALID_URL',
      details: urlError.message
    };
  }

  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
  if (!validMethods.includes(method.toUpperCase())) {
    return {
      success: false,
      error: 'Invalid HTTP method',
      code: 'INVALID_METHOD',
      allowedMethods: validMethods
    };
  }

  const requestOptions: RequestInit = {
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'URL-Backend-Proxy/1.0',
      ...headers
    }
  };

  if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    try {
      requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    } catch (bodyError) {
      return {
        success: false,
        error: 'Invalid request body format',
        code: 'INVALID_BODY',
        details: bodyError.message
      };
    }
  }

  let lastError;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(targetUrl, {
        ...requestOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let responseData;
      const contentType = response.headers.get('content-type') || '';

      try {
        if (contentType.includes('application/json')) {
          responseData = await response.json();
        } else if (contentType.includes('text/')) {
          responseData = await response.text();
        } else {
          const arrayBuffer = await response.arrayBuffer();
          responseData = {
            type: 'binary',
            size: arrayBuffer.byteLength,
            contentType: contentType
          };
        }
      } catch (parseError) {
        responseData = await response.text();
      }

      const result = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        headers: responseHeaders,
        url: targetUrl,
        method: method.toUpperCase(),
        timestamp: Date.now(),
        attempt: attempt + 1,
        cached: false
      };

      if (!response.ok) {
        result.error = `HTTP ${response.status}: ${response.statusText}`;
        result.code = `HTTP_${response.status}`;
        
        if (response.status >= 500 && attempt < retries) {
          lastError = result;
          attempt++;
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
      }

      if (response.ok && method === 'GET' && responseData) {
        cache.set(cacheKey, {
          data: responseData,
          timestamp: Date.now()
        });
      }

      return result;

    } catch (fetchError: any) {
      lastError = {
        success: false,
        error: fetchError.name === 'AbortError' ? 'Request timeout' : fetchError.message,
        code: fetchError.name === 'AbortError' ? 'TIMEOUT' : 'FETCH_ERROR',
        url: targetUrl,
        method: method.toUpperCase(),
        attempt: attempt + 1,
        timestamp: Date.now()
      };

      if (fetchError.name === 'AbortError' || fetchError.message.includes('network') || attempt >= retries) {
        break;
      }

      attempt++;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  return {
    ...lastError,
    totalAttempts: attempt + 1,
    retriesExhausted: true
  };
}

// Clear cache periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > 300000) { // 5 minutes
      cache.delete(key);
    }
  }
}, 60000); // Clean every minute
