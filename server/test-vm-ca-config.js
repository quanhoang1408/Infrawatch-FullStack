/**
 * Test script to verify VM is configured to trust Vault CA
 * 
 * This script checks if the VM is properly configured to trust certificates signed by Vault:
 * 1. Gets the Vault CA public key
 * 2. Checks if the VM has the CA public key in the trusted keys file
 * 3. Verifies SSH server configuration for certificate authentication
 */

const { Client } = require('ssh2');
const vaultSSHService = require('./src/services/vault-ssh.service');

// Configure logging
const log = (message) => console.log(`[${new Date().toISOString()}] ${message}`);
const error = (message) => console.error(`[${new Date().toISOString()}] ERROR: ${message}`);

// Configuration - update these values
const VM_IP = process.env.VM_IP || '54.197.5.26'; // Default to the IP in the error logs
const SSH_USER = process.env.SSH_USER || 'ubuntu';
const SSH_PASSWORD = process.env.SSH_PASSWORD || 'ubuntu';

async function main() {
  try {
    log('Starting VM CA configuration test');
    log(`Target VM: ${VM_IP}, User: ${SSH_USER}`);
    
    // Step 1: Get Vault CA public key
    log('Getting Vault CA public key...');
    const caPublicKey = await vaultSSHService.getCAPublicKey();
    
    if (!caPublicKey) {
      throw new Error('Failed to get Vault CA public key');
    }
    
    log(`Vault CA public key: ${caPublicKey.substring(0, 40)}...`);
    
    // Step 2: Check if VM has the CA public key in trusted keys
    log('Checking if VM trusts the Vault CA...');
    await checkVMTrustsCA(caPublicKey);
    
    log('VM CA configuration test completed');
  } catch (err) {
    error(`Test failed: ${err.message}`);
    console.error(err);
  }
}

async function checkVMTrustsCA(caPublicKey) {
  return new Promise((resolve, reject) => {
    // Connect to VM using password authentication
    const conn = new Client();
    
    conn.on('ready', () => {
      log('Connected to VM');
      
      // Check for CA public key in trusted keys file
      const checkCommand = `grep -F "${caPublicKey.substring(0, 40)}" /etc/ssh/trusted-user-ca-keys.pem || echo "CA not found"`;
      
      conn.exec(checkCommand, (err, stream) => {
        if (err) {
          conn.end();
          return reject(new Error(`Failed to execute command: ${err.message}`));
        }
        
        let output = '';
        stream.on('data', (data) => {
          output += data.toString();
        });
        
        stream.on('close', (code) => {
          if (output.includes('CA not found')) {
            log('Vault CA public key is NOT in the trusted keys file');
            
            // Check if trusted-user-ca-keys.pem exists
            conn.exec('ls -la /etc/ssh/trusted-user-ca-keys.pem || echo "File not found"', (err2, stream2) => {
              if (err2) {
                conn.end();
                return reject(new Error(`Failed to check for trusted keys file: ${err2.message}`));
              }
              
              let output2 = '';
              stream2.on('data', (data) => {
                output2 += data.toString();
              });
              
              stream2.on('close', (code2) => {
                if (output2.includes('File not found')) {
                  log('trusted-user-ca-keys.pem file does not exist');
                } else {
                  log(`trusted-user-ca-keys.pem exists: ${output2.trim()}`);
                }
                
                // Check SSH server configuration
                checkSSHConfig(conn).then(() => {
                  conn.end();
                  resolve();
                }).catch(configErr => {
                  conn.end();
                  reject(configErr);
                });
              });
            });
          } else {
            log('Vault CA public key is in the trusted keys file');
            
            // Check SSH server configuration
            checkSSHConfig(conn).then(() => {
              conn.end();
              resolve();
            }).catch(configErr => {
              conn.end();
              reject(configErr);
            });
          }
        });
      });
    });
    
    conn.on('error', (err) => {
      error(`Connection error: ${err.message}`);
      reject(err);
    });
    
    // Connect with password authentication
    conn.connect({
      host: VM_IP,
      port: 22,
      username: SSH_USER,
      password: SSH_PASSWORD,
      readyTimeout: 30000
    });
  });
}

async function checkSSHConfig(conn) {
  return new Promise((resolve, reject) => {
    // Check SSH server configuration for certificate authentication
    const checkSSHDConfig = `grep -E "TrustedUserCAKeys|AuthorizedPrincipalsFile" /etc/ssh/sshd_config`;
    
    conn.exec(checkSSHDConfig, (err, stream) => {
      if (err) {
        return reject(new Error(`Failed to check SSH config: ${err.message}`));
      }
      
      let output = '';
      stream.on('data', (data) => {
        output += data.toString();
      });
      
      stream.on('close', (code) => {
        if (output.trim() === '') {
          log('SSH server is NOT configured for certificate authentication');
          log('Missing TrustedUserCAKeys and/or AuthorizedPrincipalsFile directives in sshd_config');
        } else {
          log('SSH server configuration for certificate authentication:');
          output.split('\n').forEach(line => {
            if (line.trim() !== '') {
              log(`- ${line.trim()}`);
            }
          });
        }
        
        // Check if certificate authentication is working
        testCertificateAuth(conn).then(resolve).catch(resolve); // Continue even if this fails
      });
    });
  });
}

async function testCertificateAuth(conn) {
  return new Promise((resolve, reject) => {
    // Generate and sign a test key
    vaultSSHService.signSSHKey('ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC3YZM2ZfFSFQkJQPEEYkQIgbRHvR2phJqc8c5hRRqtnGKFAHbGlIJiVuQFU7ELoYUgBpMdmrQQQQqXYSuDOoAZe9yZc6LDxvBzCDkmwjg7vBk4nP4jgQcfzHmWzlU6+yYBXBCLUQFwxvqCGFaRWwqGBXjfGGQHIcbLYroOUOoHvgmuQ7zzTYBmXgJFdSGPd+LSLkJQn3xGbCS2Bj5UmEJQQJIJ5HbM8Cu0QztTYFnTtYpXQVQPIA0n9HpPJQ1qexyL4Jt6MjsHLlCk6NBR9Sy+aeIYHALXyEJRdK2hg5CZpqZ0sMkJ4mOUJiuiT6TlxKvRiOQS9zBVpz4QM9PTSfDr test-key', SSH_USER)
      .then(({ certificate }) => {
        if (!certificate) {
          return reject(new Error('No certificate returned from signing operation'));
        }
        
        // Check if the certificate is valid on the VM
        const checkCertCommand = `echo "${certificate}" > /tmp/test-cert.pub && ssh-keygen -L -f /tmp/test-cert.pub && rm /tmp/test-cert.pub`;
        
        conn.exec(checkCertCommand, (err, stream) => {
          if (err) {
            return reject(new Error(`Failed to check certificate: ${err.message}`));
          }
          
          let output = '';
          stream.on('data', (data) => {
            output += data.toString();
          });
          
          stream.on('close', (code) => {
            if (code === 0) {
              log('Certificate validation successful:');
              log(output.trim());
              resolve();
            } else {
              error('Certificate validation failed:');
              error(output.trim());
              reject(new Error('Certificate validation failed'));
            }
          });
        });
      })
      .catch(err => {
        error(`Failed to sign test key: ${err.message}`);
        reject(err);
      });
  });
}

// Run the test
main().catch(err => {
  error(`Unhandled error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
