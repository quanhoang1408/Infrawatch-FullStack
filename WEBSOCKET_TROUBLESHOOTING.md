# WebSocket Troubleshooting Guide

This guide provides solutions for common WebSocket connection issues when using the Terminal feature.

## Common Issues

1. **WebSocket Connection Failures (Error 1006)**
   - This is an "Abnormal Closure" error, meaning the connection was closed unexpectedly
   - Common causes: network issues, CORS restrictions, mixed content issues

2. **Mixed Content Issues**
   - When running the UI on HTTP but trying to connect to a WebSocket on HTTPS (or vice versa)
   - Browsers block these connections for security reasons

3. **CORS Restrictions**
   - When the server doesn't allow WebSocket connections from your origin
   - The server needs to explicitly allow your origin in its CORS configuration

## Solutions

### 1. Run the UI with HTTPS

This is the most reliable solution for mixed content issues:

```bash
cd ui
HTTPS=true npm start
```

This will start the UI on `https://localhost:3000` and allow secure WebSocket connections.

### 2. Install a CORS Unblock Extension

Browser extensions can help bypass CORS restrictions:

- Chrome: [CORS Unblock](https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino)
- Firefox: [CORS Everywhere](https://addons.mozilla.org/en-US/firefox/addon/cors-everywhere/)

### 3. Use a Different Browser

Some browsers handle WebSocket connections differently. Try:
- Chrome
- Firefox
- Edge

### 4. Check Network Restrictions

Some networks (corporate, public WiFi) block WebSocket connections. Try:
- Using a different network
- Using a VPN
- Using a mobile hotspot

### 5. Use SSH Directly

If the WebSocket terminal doesn't work, you can still connect to the VM using a standard SSH client:

```bash
ssh -i /path/to/private/key username@vm-ip-address
```

You can get the VM IP address from the VM details page.

## Debugging Tips

1. **Check Browser Console**
   - Open DevTools (F12)
   - Go to the Console tab
   - Look for WebSocket-related errors

2. **Check Network Tab**
   - Open DevTools (F12)
   - Go to the Network tab
   - Filter by "WS" to see WebSocket connections
   - Check for failed connections and their status codes

3. **Check Server Logs**
   - Look for WebSocket-related errors in the server logs
   - Check for authentication failures or connection issues

## Server Configuration

If you're running your own server, make sure:

1. The server allows WebSocket connections from any origin:
   ```javascript
   app.use(cors({
     origin: '*',  // Allow any origin
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization', 'X-Agent-Token', 'Sec-WebSocket-Protocol'],
     credentials: false  // Must be false when using origin: '*'
   }));
   ```

2. The WebSocket server is configured to accept connections from any origin:
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

3. The server is using OpenSSH for SSH connections:
   ```
   USE_OPENSSH=true
   ```

4. The server has the necessary ports open for WebSocket connections (usually the same as the HTTP/HTTPS port)

5. The server can extract session IDs from multiple sources (protocol, headers, URL query parameters)
