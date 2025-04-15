"""
Network data collector
"""
import psutil
import time
import logging
from .base_collector import BaseCollector

class NetworkCollector(BaseCollector):
    """Collector for network metrics"""
    
    def __init__(self):
        """Initialize network collector with previous counters"""
        super().__init__()
        self.prev_bytes_sent = 0
        self.prev_bytes_recv = 0
        self.prev_time = time.time()
        self.first_run = True
    
    def _collect_impl(self):
        """
        Collect network usage data
        
        Returns:
            dict: Network usage data
        """
        # Get network I/O statistics
        net_io = psutil.net_io_counters()
        current_time = time.time()
        
        # Get current counters
        bytes_sent = net_io.bytes_sent
        bytes_recv = net_io.bytes_recv
        
        # If this is the first run, just store the counters and return zeros
        if self.first_run:
            self.prev_bytes_sent = bytes_sent
            self.prev_bytes_recv = bytes_recv
            self.prev_time = current_time
            self.first_run = False
            
            return {
                'bytesSent': 0,
                'bytesRecv': 0
            }
        
        # Calculate bytes since last collection
        bytes_sent_since_last = bytes_sent - self.prev_bytes_sent
        bytes_recv_since_last = bytes_recv - self.prev_bytes_recv
        
        # Update previous counters
        self.prev_bytes_sent = bytes_sent
        self.prev_bytes_recv = bytes_recv
        self.prev_time = current_time
        
        # Return formatted network data
        return {
            'bytesSent': bytes_sent_since_last,
            'bytesRecv': bytes_recv_since_last
        }