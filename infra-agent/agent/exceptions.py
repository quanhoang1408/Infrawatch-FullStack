"""
Custom exceptions for the Infrawatch Agent
"""

class AgentError(Exception):
    """Base exception for all agent-related errors"""
    pass

class ConfigError(AgentError):
    """Configuration-related errors"""
    pass

class APIError(AgentError):
    """API communication errors"""
    pass

class CollectorError(AgentError):
    """Data collection errors"""
    pass

class AuthenticationError(APIError):
    """Authentication-related errors"""
    pass