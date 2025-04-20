"""
Main agent class responsible for coordinating data collection and API communication
"""
import logging
import time
import datetime
from .api_client import APIClient
from .scheduler import Scheduler
from .collectors import CPUCollector, MemoryCollector, DiskCollector, NetworkCollector
from .handlers import get_handler
from .exceptions import APIError, AuthenticationError

class Agent:
    """Main agent class"""

    def __init__(self, config):
        """
        Initialize the agent

        Args:
            config: Configuration object
        """
        self.config = config
        self.api_client = APIClient(config.server_url, config.vm_id, config.agent_token)
        self.scheduler = Scheduler()

        # Initialize collectors
        self.collectors = {
            'cpu': CPUCollector(),
            'memory': MemoryCollector(),
            'disk': DiskCollector(),
            'network': NetworkCollector()
        }

    def start(self):
        """Start the agent"""
        logging.info("Starting agent...")

        # Validate configuration before starting
        self.config.validate()

        # Add scheduled jobs
        self.scheduler.add_monitoring_job(
            self.collect_and_send_monitoring_data,
            self.config.monitoring_interval
        )

        self.scheduler.add_heartbeat_job(
            self.send_heartbeat,
            self.config.heartbeat_interval
        )

        self.scheduler.add_command_polling_job(
            self.poll_and_execute_commands,
            self.config.command_polling_interval
        )

        # Start scheduler
        self.scheduler.start()

        # Initial data collection, heartbeat, and command polling
        self.collect_and_send_monitoring_data()
        self.send_heartbeat()
        self.poll_and_execute_commands()

        logging.info("Agent started successfully")

        # Keep the main thread alive
        try:
            while True:
                time.sleep(1)
        except (KeyboardInterrupt, SystemExit):
            self.stop()

    def stop(self):
        """Stop the agent"""
        logging.info("Stopping agent...")
        self.scheduler.stop()
        logging.info("Agent stopped")

    def collect_and_send_monitoring_data(self):
        """Collect data from all collectors and send to API"""
        try:
            logging.info("Collecting monitoring data...")

            # Collect data from each collector
            cpu_data = self.collectors['cpu'].collect()
            memory_data = self.collectors['memory'].collect()
            disk_data = self.collectors['disk'].collect()
            network_data = self.collectors['network'].collect()

            # Combine data
            monitoring_data = {
                'timestamp': datetime.datetime.utcnow().isoformat() + 'Z',
                'cpu': cpu_data,
                'memory': memory_data,
                'disk': disk_data,
                'network': network_data
            }

            # Send data to API
            self.api_client.send_monitoring_data(monitoring_data)

            logging.info("Monitoring data sent successfully")

        except (APIError, AuthenticationError) as e:
            logging.error(f"Failed to send monitoring data: {e}")
        except Exception as e:
            logging.error(f"Unexpected error during monitoring: {e}")

    def send_heartbeat(self):
        """Send heartbeat to API"""
        try:
            logging.info("Sending heartbeat...")
            response = self.api_client.send_heartbeat()

            # Check if we need to adjust the heartbeat interval based on server response
            if 'nextExpectedInSeconds' in response:
                next_interval = response['nextExpectedInSeconds']
                if next_interval != self.config.heartbeat_interval:
                    logging.info(f"Adjusting heartbeat interval to {next_interval} seconds")
                    self.config.heartbeat_interval = next_interval

                    # Update the scheduled job
                    self.scheduler.add_heartbeat_job(
                        self.send_heartbeat,
                        self.config.heartbeat_interval
                    )

        except (APIError, AuthenticationError) as e:
            logging.error(f"Failed to send heartbeat: {e}")
        except Exception as e:
            logging.error(f"Unexpected error during heartbeat: {e}")

    def poll_and_execute_commands(self):
        """Poll for commands and execute them"""
        try:
            logging.info("Polling for commands...")
            commands = self.api_client.poll_commands()

            if not commands:
                logging.info("No pending commands found")
                return

            logging.info(f"Received {len(commands)} commands to execute")

            for command in commands:
                self.execute_command(command)

        except (APIError, AuthenticationError) as e:
            logging.error(f"Failed to poll commands: {e}")
        except Exception as e:
            logging.error(f"Unexpected error during command polling: {e}")

    def execute_command(self, command):
        """Execute a command and send the result"""
        command_id = command.get('id')
        command_type = command.get('type')
        payload = command.get('payload', {})

        logging.info(f"Executing command {command_id} of type {command_type}")

        try:
            # Get the appropriate handler for this command type
            handler = get_handler(command_type)

            if not handler:
                logging.error(f"No handler found for command type: {command_type}")
                self.api_client.send_command_result(
                    command_id,
                    'ERROR',
                    f"Unsupported command type: {command_type}"
                )
                return

            # Execute the command
            result = handler.handle(payload)

            # Send the result back to the server
            status = result.get('status')
            message = result.get('message')
            data = result.get('data')

            self.api_client.send_command_result(
                command_id,
                status,
                message,
                data
            )

            logging.info(f"Command {command_id} executed with status: {status}")

        except Exception as e:
            logging.error(f"Error executing command {command_id}: {str(e)}")

            # Send error result
            try:
                self.api_client.send_command_result(
                    command_id,
                    'ERROR',
                    f"Error executing command: {str(e)}"
                )
            except Exception as send_error:
                logging.error(f"Failed to send command result: {str(send_error)}")