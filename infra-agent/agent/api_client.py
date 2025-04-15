"""
API client for communicating with the Infrawatch backend
"""
import json
import logging
import requests
from requests.exceptions import RequestException
from .exceptions import APIError, AuthenticationError

class APIClient:
    """Client for interacting with the Infrawatch API"""
    
    def __init__(self, server_url, vm_id, agent_token):
        """
        Initialize API client
        
        Args:
            server_url: Base URL of the Infrawatch server
            vm_id: ID of the VM this agent is running on
            agent_token: Authentication token for the agent
        """
        self.server_url = server_url.rstrip('/')
        self.vm_id = vm_id
        self.agent_token = agent_token
        self.headers = {
            'Content-Type': 'application/json',
            'X-Agent-Token': agent_token
        }
    
    def send_monitoring_data(self, data):
        """
        Send monitoring data to the server
        
        Args:
            data: Dictionary containing monitoring data
            
        Returns:
            Response from the server
            
        Raises:
            APIError: If the server returns an error
            AuthenticationError: If authentication fails
        """
        url = f"{self.server_url}/api/v1/monitoring/{self.vm_id}"
        logging.debug(f"Sending monitoring data to {url}")
        
        try:
            response = requests.post(
                url,
                headers=self.headers,
                json=data,
                timeout=10
            )
            
            if response.status_code == 401:
                logging.error("Authentication failed. Check agent token.")
                raise AuthenticationError("Authentication failed. Check agent token.")
            
            if response.status_code != 201:
                logging.error(f"API error: {response.status_code}, {response.text}")
                raise APIError(f"API error: {response.status_code}, {response.text}")
            
            logging.debug("Monitoring data sent successfully")
            return response.json()
            
        except RequestException as e:
            logging.error(f"Failed to send monitoring data: {e}")
            raise APIError(f"Failed to send monitoring data: {e}")
    
    def send_heartbeat(self):
        """
        Send heartbeat to the server
        
        Returns:
            Response from the server with nextExpectedInSeconds
            
        Raises:
            APIError: If the server returns an error
            AuthenticationError: If authentication fails
        """
        url = f"{self.server_url}/api/v1/monitoring/{self.vm_id}/heartbeat"
        logging.debug(f"Sending heartbeat to {url}")
        
        try:
            response = requests.post(
                url,
                headers=self.headers,
                timeout=5
            )
            
            if response.status_code == 401:
                logging.error("Authentication failed. Check agent token.")
                raise AuthenticationError("Authentication failed. Check agent token.")
            
            if response.status_code != 200:
                logging.error(f"API error: {response.status_code}, {response.text}")
                raise APIError(f"API error: {response.status_code}, {response.text}")
            
            data = response.json()
            logging.debug(f"Heartbeat sent successfully. Next expected in {data.get('nextExpectedInSeconds', '?')} seconds")
            return data
            
        except RequestException as e:
            logging.error(f"Failed to send heartbeat: {e}")
            raise APIError(f"Failed to send heartbeat: {e}")