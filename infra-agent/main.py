#!/usr/bin/env python3
"""
Infrawatch Agent - Entry point
"""
import os
import sys
import signal
import logging
from agent.config import Config
from agent.agent import Agent
from agent.utils import setup_logging

def signal_handler(sig, frame):
    """Handle termination signals gracefully"""
    logging.info("Received termination signal. Shutting down agent...")
    sys.exit(0)

def main():
    """Main entry point for the agent"""
    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Load configuration
    try:
        config = Config()
        config.load()
    except Exception as e:
        print(f"Error loading configuration: {e}")
        sys.exit(1)
    
    # Setup logging
    log_level = getattr(logging, config.log_level.upper(), logging.INFO)
    setup_logging(log_level, config.log_file)
    
    logging.info("Starting Infrawatch Agent...")
    logging.info(f"Agent configured for VM ID: {config.vm_id}")
    
    # Create and start agent
    try:
        agent = Agent(config)
        agent.start()
    except Exception as e:
        logging.error(f"Failed to start agent: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()