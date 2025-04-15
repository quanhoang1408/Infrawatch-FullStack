/**
 * Get access token from local storage
 * @returns {string|null} The access token or null
 */
export const getAccessToken = () => {
    return localStorage.getItem('accessToken');
  };
  
  /**
   * Get refresh token from local storage
   * @returns {string|null} The refresh token or null
   */
  export const getRefreshToken = () => {
    return localStorage.getItem('refreshToken');
  };
  
  /**
   * Set both tokens in local storage
   * @param {string} accessToken - The access token
   * @param {string} refreshToken - The refresh token
   */
  export const setTokens = (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  };
  
  /**
   * Clear both tokens from local storage
   */
  export const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };
  
  /**
   * Check if user is authenticated based on token presence
   * @returns {boolean} True if authenticated
   */
  export const isAuthenticated = () => {
    return !!getAccessToken();
  };