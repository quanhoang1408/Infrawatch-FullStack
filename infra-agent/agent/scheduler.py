"""
Scheduler for periodic tasks
"""
import logging
import time
import threading
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

class Scheduler:
    """Scheduler for running periodic tasks"""
    
    def __init__(self):
        """Initialize the scheduler"""
        self.scheduler = BackgroundScheduler()
        self.running = False
    
    def start(self):
        """Start the scheduler"""
        if not self.running:
            self.scheduler.start()
            self.running = True
            logging.info("Scheduler started")
    
    def stop(self):
        """Stop the scheduler"""
        if self.running:
            self.scheduler.shutdown()
            self.running = False
            logging.info("Scheduler stopped")
    
    def add_monitoring_job(self, func, interval):
        """
        Add a monitoring job to the scheduler
        
        Args:
            func: Function to run
            interval: Interval in seconds
        
        Returns:
            Job ID
        """
        logging.info(f"Adding monitoring job with interval {interval} seconds")
        return self.scheduler.add_job(
            func,
            IntervalTrigger(seconds=interval),
            name="monitoring",
            max_instances=1,
            replace_existing=True
        )
    
    def add_heartbeat_job(self, func, interval):
        """
        Add a heartbeat job to the scheduler
        
        Args:
            func: Function to run
            interval: Interval in seconds
        
        Returns:
            Job ID
        """
        logging.info(f"Adding heartbeat job with interval {interval} seconds")
        return self.scheduler.add_job(
            func,
            IntervalTrigger(seconds=interval),
            name="heartbeat",
            max_instances=1,
            replace_existing=True
        )