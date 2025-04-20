"""
Command handlers package
"""
from .ssh_key_updater import SSHKeyUpdater

# Map command types to handler classes
HANDLERS = {
    'UPDATE_SSH_KEY': SSHKeyUpdater()
}

def get_handler(command_type):
    """
    Get the appropriate handler for a command type
    
    Args:
        command_type (str): Type of command
        
    Returns:
        object: Handler instance or None if not found
    """
    return HANDLERS.get(command_type)
