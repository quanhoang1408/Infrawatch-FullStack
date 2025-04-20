"""
Configuration management for the Infrawatch Agent
"""
import os
import configparser
import logging
from pathlib import Path

class Config:
    """Configuration handler for the agent"""

    DEFAULT_CONFIG_PATHS = [
        './config/agent.ini',
        '/etc/infrawatch/agent.ini'
    ]

    def __init__(self):
        # Server settings
        self.server_url = None
        self.vm_id = None
        self.agent_token = None

        # Intervals (seconds)
        self.monitoring_interval = 60
        self.heartbeat_interval = 30
        self.command_polling_interval = 15

        # Logging
        self.log_level = "INFO"
        self.log_file = "./logs/agent.log"

    def load(self):
        """Load configuration from environment variables or config file"""
        # Try environment variables first
        if self._load_from_env():
            logging.info("Loaded configuration from environment variables")
            return

        # Then try config file
        if self._load_from_file():
            logging.info("Loaded configuration from config file")
            return

        # If we get here, configuration is incomplete
        raise Exception("Could not load complete configuration. Please set required environment variables or provide a config file.")

    def _load_from_env(self):
        """Load configuration from environment variables"""
        required_vars = {
            'INFRAWATCH_SERVER_URL': 'server_url',
            'INFRAWATCH_VM_ID': 'vm_id',
            'INFRAWATCH_AGENT_TOKEN': 'agent_token'
        }

        # Check if all required variables are set
        if not all(var in os.environ for var in required_vars):
            return False

        # Load required variables
        for env_var, attr_name in required_vars.items():
            setattr(self, attr_name, os.environ[env_var])

        # Load optional variables
        if 'INFRAWATCH_MONITORING_INTERVAL' in os.environ:
            self.monitoring_interval = int(os.environ['INFRAWATCH_MONITORING_INTERVAL'])

        if 'INFRAWATCH_HEARTBEAT_INTERVAL' in os.environ:
            self.heartbeat_interval = int(os.environ['INFRAWATCH_HEARTBEAT_INTERVAL'])

        if 'INFRAWATCH_COMMAND_POLLING_INTERVAL' in os.environ:
            self.command_polling_interval = int(os.environ['INFRAWATCH_COMMAND_POLLING_INTERVAL'])

        if 'INFRAWATCH_LOG_LEVEL' in os.environ:
            self.log_level = os.environ['INFRAWATCH_LOG_LEVEL']

        if 'INFRAWATCH_LOG_FILE' in os.environ:
            self.log_file = os.environ['INFRAWATCH_LOG_FILE']

        return True

    def _load_from_file(self):
        """Load configuration from config file"""
        config_parser = configparser.ConfigParser()

        # Try to find config file
        config_file = None
        for path in self.DEFAULT_CONFIG_PATHS:
            if os.path.exists(path):
                config_file = path
                break

        if not config_file:
            return False

        # Read config file
        config_parser.read(config_file)

        # Check if all required sections and options are present
        if not ('Server' in config_parser and
                all(option in config_parser['Server'] for option in ['url', 'vm_id', 'agent_token'])):
            return False

        # Load server settings
        self.server_url = config_parser['Server']['url']
        self.vm_id = config_parser['Server']['vm_id']
        self.agent_token = config_parser['Server']['agent_token']

        # Load intervals if present
        if 'Intervals' in config_parser:
            if 'monitoring' in config_parser['Intervals']:
                self.monitoring_interval = int(config_parser['Intervals']['monitoring'])
            if 'heartbeat' in config_parser['Intervals']:
                self.heartbeat_interval = int(config_parser['Intervals']['heartbeat'])
            if 'command_polling' in config_parser['Intervals']:
                self.command_polling_interval = int(config_parser['Intervals']['command_polling'])

        # Load logging settings if present
        if 'Logging' in config_parser:
            if 'level' in config_parser['Logging']:
                self.log_level = config_parser['Logging']['level']
            if 'file' in config_parser['Logging']:
                self.log_file = config_parser['Logging']['file']

        return True

    def validate(self):
        """Validate that the configuration is complete and valid"""
        if not self.server_url:
            raise ValueError("Server URL is required")
        if not self.vm_id:
            raise ValueError("VM ID is required")
        if not self.agent_token:
            raise ValueError("Agent token is required")

        # Ensure intervals are positive integers
        if self.monitoring_interval <= 0:
            raise ValueError("Monitoring interval must be a positive integer")
        if self.heartbeat_interval <= 0:
            raise ValueError("Heartbeat interval must be a positive integer")
        if self.command_polling_interval <= 0:
            raise ValueError("Command polling interval must be a positive integer")

        # Ensure log directory exists
        log_dir = os.path.dirname(self.log_file)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)