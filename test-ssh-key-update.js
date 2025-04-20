// test-ssh-key-update.js
const axios = require('axios');
const mongoose = require('mongoose');
const { Command, VM } = require('./server/src/models');

// Configuration
const API_URL = 'http://localhost:3000/api/v1';
const ADMIN_TOKEN = 'YOUR_ADMIN_TOKEN_HERE'; // Replace with a valid admin token
const AGENT_TOKEN = 'YOUR_AGENT_TOKEN_HERE'; // Replace with a valid agent token
const VM_ID = 'YOUR_VM_ID_HERE'; // Replace with a valid VM ID

// Test functions
async function testUpdateSSHKey() {
  try {
    console.log('Testing SSH Key Update API...');
    
    const response = await axios.post(
      `${API_URL}/vm/${VM_ID}/ssh-key/update`,
      { sshUser: 'testuser' },
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('SSH Key Update Response:', response.data);
    return response.data.commandId;
  } catch (error) {
    console.error('SSH Key Update Error:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function testGetCommands() {
  try {
    console.log('Testing Get Commands API...');
    
    const response = await axios.get(
      `${API_URL}/agent/${VM_ID}/commands`,
      {
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Get Commands Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get Commands Error:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function testUpdateCommandResult(commandId) {
  try {
    console.log('Testing Update Command Result API...');
    
    const response = await axios.post(
      `${API_URL}/agent/${VM_ID}/command_result`,
      {
        commandId,
        status: 'SUCCESS',
        message: 'SSH key updated successfully',
        data: {
          path: '/home/testuser/.ssh/authorized_keys'
        }
      },
      {
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Update Command Result Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Update Command Result Error:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// Main test function
async function runTests() {
  try {
    // Test SSH Key Update
    const commandId = await testUpdateSSHKey();
    
    // Test Get Commands
    const commands = await testGetCommands();
    
    // Test Update Command Result
    if (commandId) {
      await testUpdateCommandResult(commandId);
    } else if (commands && commands.length > 0) {
      await testUpdateCommandResult(commands[0].id);
    } else {
      console.log('No commands found to update');
    }
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

// Run the tests
runTests();
