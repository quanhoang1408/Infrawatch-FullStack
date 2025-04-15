"""
Utility functions for the Infrawatch Agent
"""
import os
import logging
from pathlib import Path

def setup_logging(log_level, log_file=None):
    """
    Setup logging configuration for the agent
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Path to log file (if None, log to console only)
    """
    handlers = []
    
    # Always log to console
    console_handler = logging.StreamHandler()
    handlers.append(console_handler)
    
    # Log to file if specified
    if log_file:
        log_dir = os.path.dirname(log_file)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)
            
        file_handler = logging.FileHandler(log_file)
        handlers.append(file_handler)
    
    # Configure logging
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=handlers
    )