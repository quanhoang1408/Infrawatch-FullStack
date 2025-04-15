"""
Base collector class for the Infrawatch Agent
"""
import logging
from ..exceptions import CollectorError

class BaseCollector:
    """Base class for all data collectors"""
    
    def __init__(self):
        """Initialize the collector"""
        self.name = self.__class__.__name__
    
    def collect(self):
        """
        Collect data
        
        Returns:
            dict: Collected data
            
        Raises:
            CollectorError: If data collection fails
        """
        try:
            logging.debug(f"Collecting data using {self.name}")
            data = self._collect_impl()
            logging.debug(f"Data collection completed for {self.name}")
            return data
        except Exception as e:
            logging.error(f"Error collecting data with {self.name}: {e}")
            raise CollectorError(f"Error collecting data with {self.name}: {e}")
    
    def _collect_impl(self):
        """
        Implementation of data collection
        
        This method should be overridden by subclasses.
        
        Returns:
            dict: Collected data
        """
        raise NotImplementedError("Subclasses must implement _collect_impl()")