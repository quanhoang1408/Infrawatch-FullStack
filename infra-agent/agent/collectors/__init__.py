"""
Data collectors for the Infrawatch Agent
"""
from .cpu import CPUCollector
from .memory import MemoryCollector
from .disk import DiskCollector
from .network import NetworkCollector

__all__ = ['CPUCollector', 'MemoryCollector', 'DiskCollector', 'NetworkCollector']