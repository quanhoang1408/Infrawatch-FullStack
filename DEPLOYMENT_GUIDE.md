# Infrawatch Agent Deployment Guide

This comprehensive guide will walk you through deploying the Infrawatch Agent to a real VM step by step.

## Phase 1: Preparation

### 1.1 Start Your Backend Server

```bash
cd server
npm run dev
```

Verify that the server is running and connected to MongoDB.

### 1.2 Start Vault in Development Mode

```bash
vault server -dev
```

Note the Root Token displayed in the output and update your `.env` file if needed:

```
VAULT_TOKEN=your-root-token-here
```

### 1.3 Expose Your Backend with ngrok

```bash
ngrok http 3000
```

Note the HTTPS URL provided by ngrok (e.g., https://a1b2c3d4.ngrok.io).

### 1.4 Update Agent Configuration

Run the update script with your ngrok URL:

```bash
chmod +x update-agent-config.sh
./update-agent-config.sh https://your-ngrok-url-here
```

### 1.5 Prepare Deployment Package

```bash
tar -czvf infra-agent.tar.gz .
```

## Phase 2: EC2 Instance Setup

### 2.1 Launch an EC2 Instance

1. Log in to the AWS Management Console
2. Navigate to EC2 → Instances → Launch instances
3. Choose Amazon Linux 2 AMI or Ubuntu Server LTS AMI (Free tier eligible)
4. Select t2.micro or t3.micro instance type
5. Create a new key pair and download the .pem file
6. Configure security group to allow SSH (port 22) from your IP
7. Launch the instance and note its public IP address

### 2.2 Connect to Your EC2 Instance

For Amazon Linux 2:
```bash
chmod 400 your-key.pem
ssh -i your-key.pem ec2-user@your-ec2-ip
```

For Ubuntu:
```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 2.3 Install Prerequisites

```bash
# For Amazon Linux 2
sudo yum update -y
sudo yum install -y python3 python3-pip git

# For Ubuntu
sudo apt update
sudo apt install -y python3 python3-pip git
```

## Phase 3: Agent Deployment

### 3.1 Copy Files to EC2

From your local machine:

```bash
scp -i your-key.pem infra-agent.tar.gz deploy-agent.sh ec2-user@your-ec2-ip:~
```

Replace `ec2-user` with `ubuntu` for Ubuntu instances.

### 3.2 Update Deployment Script

On your local machine, edit `deploy-agent.sh` to update:

1. SERVER_URL with your ngrok URL
2. SSH_USER with the appropriate user (ec2-user or ubuntu)

### 3.3 Run Deployment Script

On the EC2 instance:

```bash
chmod +x deploy-agent.sh
./deploy-agent.sh
```

This script will:
1. Create necessary directories
2. Install dependencies
3. Extract agent files
4. Create configuration file
5. Install Python dependencies
6. Create and start systemd service

### 3.4 Verify Agent is Running

```bash
sudo systemctl status infrawatch-agent
```

Check the logs:
```bash
tail -f ~/infrawatch-agent/logs/agent.log
```

## Phase 4: Testing

### 4.1 Test Agent Connection

On the EC2 instance:

```bash
chmod +x test-agent-connection.sh
./test-agent-connection.sh
```

### 4.2 Test SSH Key Update

1. Log in to your Infrawatch UI
2. Navigate to the VM details page
3. Click on "Update SSH Key"
4. Enter the SSH username (ec2-user for Amazon Linux, ubuntu for Ubuntu)
5. Submit the request

### 4.3 Verify SSH Key Update

On the EC2 instance:

```bash
cat ~/.ssh/authorized_keys
```

The new public key should be present in this file.

## Phase 5: Monitoring and Maintenance

### 5.1 Monitor Agent Logs

```bash
tail -f ~/infrawatch-agent/logs/agent.log
```

### 5.2 Restart Agent if Needed

```bash
sudo systemctl restart infrawatch-agent
```

### 5.3 Update Agent Configuration

Edit the configuration file:

```bash
nano ~/infrawatch-agent/config/agent.ini
```

After making changes, restart the agent:

```bash
sudo systemctl restart infrawatch-agent
```

## Troubleshooting

### Agent Not Connecting

1. Verify ngrok is still running and the URL is valid
2. Check agent logs for connection errors
3. Ensure VM_ID and AGENT_TOKEN are correct
4. Check if the backend server is accessible from the EC2 instance

### SSH Key Update Failing

1. Check agent logs for errors
2. Verify the SSH user exists on the system
3. Check permissions on the ~/.ssh directory and authorized_keys file
4. Try running the agent with sudo if there are permission issues

### Service Not Starting

1. Check systemd logs:
   ```bash
   journalctl -u infrawatch-agent
   ```
2. Verify Python dependencies are installed correctly
3. Check file permissions

## Uninstalling

To completely remove the agent:

```bash
sudo systemctl stop infrawatch-agent
sudo systemctl disable infrawatch-agent
sudo rm /etc/systemd/system/infrawatch-agent.service
sudo systemctl daemon-reload
rm -rf ~/infrawatch-agent
```
