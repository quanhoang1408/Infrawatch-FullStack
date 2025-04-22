import api from './api';

/**
 * Initiate SSH connection to a VM
 * @param {string} vmId - VM ID
 * @param {string} sshUser - SSH username
 * @returns {Promise} - Session info with sessionId and websocketUrl
 */
export const initiateSSHConnection = async (vmId, sshUser = 'ubuntu') => {
  const response = await api.post(`/terminal/${vmId}/session`, { sshUser });
  return response.data;
};

/**
 * Get terminal session
 * Creates a new terminal session or returns an existing one
 * @param {string} vmId - VM ID
 * @returns {Promise} - Terminal session response
 */
export const getTerminalSession = async (vmId) => {
  const response = await api.post(`/terminal/sessions`, { vmId });
  return response.data;
};

/**
 * Send command to terminal
 * @param {string} sessionId - Terminal session ID
 * @param {string} command - Command to send
 * @returns {Promise} - Command response
 */
export const sendTerminalCommand = async (sessionId, command) => {
  const response = await api.post(`/terminal/sessions/${sessionId}/execute`, { command });
  return response.data;
};

/**
 * Get terminal output
 * @param {string} sessionId - Terminal session ID
 * @param {number} since - Get output since timestamp
 * @returns {Promise} - Terminal output response
 */
export const getTerminalOutput = async (sessionId, since = 0) => {
  const response = await api.get(`/terminal/sessions/${sessionId}/output`, {
    params: { since }
  });
  return response.data;
};

/**
 * Resize terminal
 * @param {string} sessionId - Terminal session ID
 * @param {number} cols - Number of columns
 * @param {number} rows - Number of rows
 * @returns {Promise} - Success response
 */
export const resizeTerminal = async (sessionId, cols, rows) => {
  const response = await api.post(`/terminal/sessions/${sessionId}/resize`, {
    cols,
    rows
  });
  return response.data;
};

/**
 * Close terminal session
 * @param {string} sessionId - Terminal session ID
 * @returns {Promise} - Success response
 */
export const closeTerminalSession = async (sessionId) => {
  const response = await api.delete(`/terminal/sessions/${sessionId}`);
  return response.data;
};

/**
 * Get active terminal sessions
 * @returns {Promise} - Terminal sessions response
 */
export const getTerminalSessions = async () => {
  const response = await api.get(`/terminal/sessions`);
  return response.data;
};

/**
 * Create terminal with certificate
 * @param {string} vmId - VM ID
 * @param {string} certificateId - Certificate ID
 * @returns {Promise} - Terminal session response
 */
export const createTerminalWithCertificate = async (vmId, certificateId) => {
  const response = await api.post(`/terminal/sessions/certificate`, {
    vmId,
    certificateId
  });
  return response.data;
};

/**
 * Poll terminal for new output
 * This function uses long polling to get new terminal output
 * @param {string} sessionId - Terminal session ID
 * @param {number} timeout - Poll timeout in milliseconds
 * @param {number} since - Get output since timestamp
 * @returns {Promise} - Terminal output response
 */
export const pollTerminalOutput = async (sessionId, timeout = 30000, since = 0) => {
  const response = await api.get(`/terminal/sessions/${sessionId}/poll`, {
    params: { timeout, since },
    timeout: timeout + 5000 // Add 5 seconds to axios timeout
  });
  return response.data;
};

/**
 * Send interrupt signal (Ctrl+C) to terminal
 * @param {string} sessionId - Terminal session ID
 * @returns {Promise} - Success response
 */
export const sendInterruptSignal = async (sessionId) => {
  const response = await api.post(`/terminal/sessions/${sessionId}/interrupt`);
  return response.data;
};

/**
 * Get terminal session logs
 * @param {string} sessionId - Terminal session ID
 * @returns {Promise} - Terminal logs response
 */
export const getTerminalLogs = async (sessionId) => {
  const response = await api.get(`/terminal/sessions/${sessionId}/logs`);
  return response.data;
};