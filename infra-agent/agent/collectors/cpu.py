"""
CPU data collector
"""
import psutil
import logging
from .base_collector import BaseCollector

class CPUCollector(BaseCollector):
    """Collector for CPU metrics"""
    
    def _collect_impl(self):
        """
        Collect CPU usage data
        
        Returns:
            dict: CPU usage data
        """
        # Get CPU usage percentage (across all CPUs)
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # Return formatted CPU data
        return {
            'usagePercent': cpu_percent
        }