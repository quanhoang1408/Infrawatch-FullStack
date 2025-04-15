const ACTIVITY_TYPES = {
    // VM actions
    VM_CREATED: 'vm:created',
    VM_STARTED: 'vm:started',
    VM_STOPPED: 'vm:stopped',
    VM_RESTARTED: 'vm:restarted',
    VM_DELETED: 'vm:deleted',
    
    // Agent actions
    AGENT_CONNECTED: 'agent:connected',
    AGENT_DISCONNECTED: 'agent:disconnected',
    AGENT_INSTALLED: 'agent:installed',
    AGENT_UPDATED: 'agent:updated',
    AGENT_TOKEN_REFRESHED: 'agent:token_refreshed',
    
    // User actions
    USER_LOGIN: 'user:login',
    USER_LOGOUT: 'user:logout',
    USER_PASSWORD_CHANGED: 'user:password_changed',
    USER_PROFILE_UPDATED: 'user:profile_updated',
    
    // Admin actions
    PROVIDER_ADDED: 'provider:added',
    PROVIDER_UPDATED: 'provider:updated',
    PROVIDER_REMOVED: 'provider:removed',
    
    // Certificate actions
    CERTIFICATE_CREATED: 'certificate:created',
    CERTIFICATE_REVOKED: 'certificate:revoked',
  
    // Other
    SYSTEM_ERROR: 'system:error',
    SYSTEM_WARNING: 'system:warning',
  };
  
  module.exports = {
    ACTIVITY_TYPES,
  };