# Infra-Agent

Agent for Infrawatch monitoring system that collects system metrics and sends them to the Infrawatch server.

## Features

- Collects CPU, memory, disk, and network metrics
- Sends metrics to Infrawatch server
- Polls for commands from the server
- Secure communication with agent token authentication

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd infra-agent
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a configuration file:
   ```bash
   cp config/agent.ini.example config/agent.ini
   ```

4. Edit the configuration file with your settings:
   ```bash
   nano config/agent.ini
   ```
   
   Make sure to set:
   - `SERVER_URL`: URL of your Infrawatch server API
   - `VM_ID`: ID of your VM in Infrawatch
   - `AGENT_TOKEN`: Authentication token for your agent

## Running the Agent

```bash
python main.py
```

## Running as a Service

### Systemd (Linux)

1. Create a systemd service file:
   ```bash
   sudo nano /etc/systemd/system/infra-agent.service
   ```

2. Add the following content:
   ```
   [Unit]
   Description=Infrawatch Agent
   After=network.target

   [Service]
   User=<user>
   WorkingDirectory=/path/to/infra-agent
   ExecStart=/usr/bin/python3 /path/to/infra-agent/main.py
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable infra-agent
   sudo systemctl start infra-agent
   ```

4. Check status:
   ```bash
   sudo systemctl status infra-agent
   ```

## Troubleshooting

Check the logs for errors:
```bash
cat logs/agent.log
```

## Development

1. Set up a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install development dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the agent in development mode:
   ```bash
   python main.py
   ```