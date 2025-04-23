# CORS Troubleshooting Guide

This guide provides solutions for CORS (Cross-Origin Resource Sharing) issues when connecting from a local development environment to a remote server.

## Understanding the Problem

When running the UI locally (e.g., on `http://localhost:3000`) and connecting to a remote server (e.g., `https://api.infrawatch.website`), you may encounter CORS errors. This happens because:

1. Your browser enforces the Same-Origin Policy, which prevents web pages from making requests to a different domain than the one that served the web page.
2. The remote server needs to explicitly allow requests from your origin by sending the appropriate CORS headers.

## Common CORS Error Messages

- "Access to fetch at 'https://api.infrawatch.website/api/v1/...' from origin 'http://localhost:3000' has been blocked by CORS policy"
- "Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource"
- "No 'Access-Control-Allow-Origin' header is present on the requested resource"

## Solutions

### 1. Configure the Server to Allow Your IP Address

The most reliable solution is to configure the server to allow requests from your specific IP address:

```javascript
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://api.infrawatch.website',
      'http://localhost:3000',
      'http://localhost:8000',
      'http://YOUR_IP_ADDRESS:3000',
      'http://YOUR_IP_ADDRESS:8000'
    ];
    
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Agent-Token', 'Sec-WebSocket-Protocol'],
  credentials: true
}));
```

Replace `YOUR_IP_ADDRESS` with your actual IP address.

### 2. Configure the Server to Allow All Origins (Development Only)

For development purposes only, you can configure the server to allow requests from any origin:

```javascript
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Agent-Token', 'Sec-WebSocket-Protocol']
}));
```

**Warning**: This is not recommended for production environments as it allows any website to make requests to your API.

### 3. Use a CORS Proxy

You can use a CORS proxy to bypass CORS restrictions:

```javascript
// Instead of:
fetch('https://api.infrawatch.website/api/v1/...')

// Use:
fetch('https://cors-anywhere.herokuapp.com/https://api.infrawatch.website/api/v1/...')
```

### 4. Use a Browser Extension

Install a browser extension that disables CORS:

- Chrome: [CORS Unblock](https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino)
- Firefox: [CORS Everywhere](https://addons.mozilla.org/en-US/firefox/addon/cors-everywhere/)

### 5. Run the Browser with CORS Disabled

For Chrome:
```bash
chrome --disable-web-security --user-data-dir="/tmp/chrome-dev"
```

For Firefox, you can use the CORS Everywhere extension mentioned above.

## WebSocket CORS Issues

WebSocket connections can also be affected by CORS. To fix WebSocket CORS issues:

1. Make sure the WebSocket server accepts connections from your origin:

```javascript
const wss = new WebSocket.Server({
  server,
  path: '/ws-ssh',
  verifyClient: (info, callback) => {
    // Accept all connections
    callback(true);
  }
});
```

2. Use the same protocol (ws/wss) as your page:

```javascript
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${wsProtocol}//api.infrawatch.website/ws-ssh`;
```

## Finding Your IP Address

To find your IP address:

- Windows: Open Command Prompt and type `ipconfig`
- macOS: Open Terminal and type `ifconfig | grep inet`
- Linux: Open Terminal and type `ip addr show` or `hostname -I`

You can also visit [whatismyip.com](https://www.whatismyip.com/) to find your public IP address.

## Testing CORS Configuration

You can test if your CORS configuration is working by making a simple request:

```javascript
fetch('https://api.infrawatch.website/health', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

If the request succeeds, your CORS configuration is working correctly.
