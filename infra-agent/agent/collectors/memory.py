"""
Memory data collector
"""
import psutil
import logging
from .base_collector import BaseCollector

class MemoryCollector(BaseCollector):
    """Collector for memory metrics"""
    
    def _collect_impl(self):
        """
        Collect memory usage data
        
        Returns:
            dict: Memory usage data
        """
        # Get virtual memory statistics
        mem = psutil.virtual_memory()
        
        # Convert bytes to MB
        total_mb = mem.total / (1024 * 1024)
        used_mb = mem.used / (1024 * 1024)
        
        # Return formatted memory data
        return {
            'totalMB': round(total_mb, 2),
            'usedMB': round(used_mb, 2),
            'usagePercent': mem.percent
        }