"""
Main agent class responsible for coordinating data collection and API communication
"""
import logging
import time
import datetime
from .api_client import APIClient
from .scheduler import Scheduler
from .collectors import CPUCollector, MemoryCollector, DiskCollector, NetworkCollector
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
        
        # Start scheduler
        self.scheduler.start()
        
        # Initial data collection and heartbeat
        self.collect_and_send_monitoring_data()
        self.send_heartbeat()
        
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