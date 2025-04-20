# Infrawatch Agent Deployment Guide

This guide will help you deploy the Infrawatch Agent to a real VM (EC2 instance).

## Prerequisites

1. An EC2 instance running Amazon Linux 2 or Ubuntu
2. SSH access to the instance
3. A running Infrawatch backend server
4. ngrok or similar tool to expose your local backend server to the internet

## Step 1: Prepare Your Backend Server

1. Start your local backend server:
   ```
   cd server
   npm run dev
   ```

2. Start Vault in development mode (in a separate terminal):
   ```
   vault server -dev
   ```
   
   Note the Root Token that is displayed and update your `.env` file if needed.

3. Expose your local server to the internet using ngrok:
   ```
   ngrok http 3000
   ```
   
   Note the HTTPS URL provided by ngrok (e.g., https://a1b2c3d4.ngrok.io).

## Step 2: Prepare Deployment Files

1. Update the `deploy-agent.sh` script with your ngrok URL:
   ```
   SERVER_URL="https://your-ngrok-url-here"
   ```

2. If you're using Ubuntu instead of Amazon Linux, update the SSH_USER:
   ```
   SSH_USER="ubuntu"  # For Ubuntu instances
   ```

## Step 3: Deploy to EC2 Instance

1. Copy the deployment files to your EC2 instance:
   ```
   scp -i your-key.pem infra-agent.tar.gz deploy-agent.sh ec2-user@your-ec2-ip:~
   ```
   
   Replace `your-key.pem` with your EC2 key file, `ec2-user` with the appropriate user (ubuntu for Ubuntu instances), and `your-ec2-ip` with your EC2 instance's public IP.

2. SSH into your EC2 instance:
   ```
   ssh -i your-key.pem ec2-user@your-ec2-ip
   ```

3. Make the deployment script executable:
   ```
   chmod +x deploy-agent.sh
   ```

4. Run the deployment script:
   ```
   ./deploy-agent.sh
   ```

5. Check the agent logs:
   ```
   tail -f ~/infrawatch-agent/logs/agent.log
   ```

## Step 4: Test SSH Key Update

1. Log in to your Infrawatch UI
2. Navigate to the VM details page
3. Click on "Update SSH Key"
4. Enter the SSH username (ec2-user for Amazon Linux, ubuntu for Ubuntu)
5. Submit the request

The agent should receive the command, update the authorized_keys file, and report success back to the server.

## Troubleshooting

### Agent Not Connecting

1. Check the agent logs:
   ```
   tail -f ~/infrawatch-agent/logs/agent.log
   ```

2. Verify the ngrok URL is correct in the agent.ini file:
   ```
   cat ~/infrawatch-agent/config/agent.ini
   ```

3. Restart the agent service:
   ```
   sudo systemctl restart infrawatch-agent
   ```

### SSH Key Update Failing

1. Check the agent logs for errors
2. Verify the SSH user exists on the system
3. Check permissions on the ~/.ssh directory and authorized_keys file
4. Try running the agent with sudo if there are permission issues

## Uninstalling the Agent

To uninstall the agent:

```
sudo systemctl stop infrawatch-agent
sudo systemctl disable infrawatch-agent
sudo rm /etc/systemd/system/infrawatch-agent.service
sudo systemctl daemon-reload
rm -rf ~/infrawatch-agent
```
