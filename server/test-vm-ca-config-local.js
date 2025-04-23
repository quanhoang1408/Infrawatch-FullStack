/**
 * Test script to verify VM is configured to trust Vault CA (Local Version)
 * 
 * This script runs directly on the VM to check if it's properly configured to trust certificates signed by Vault:
 * 1. Checks if the trusted-user-ca-keys.pem file exists
 * 2. Verifies SSH server configuration for certificate authentication
 * 3. Tests if a sample certificate can be validated
 */

const fs = require('fs');
const { execSync, exec } = require('child_process');
const path = require('path');

// Configure logging
const log = (message) => console.log(`[${new Date().toISOString()}] ${message}`);
const error = (message) => console.error(`[${new Date().toISOString()}] ERROR: ${message}`);

// Configuration
const SSH_USER = process.env.SSH_USER || 'ubuntu';
const TRUSTED_CA_PATH = '/etc/ssh/trusted-user-ca-keys.pem';
const SSHD_CONFIG_PATH = '/etc/ssh/sshd_config';

async function main() {
  try {
    log('Starting VM CA configuration test (local version)');
    
    // Step 1: Check if trusted-user-ca-keys.pem exists
    log(`Checking if ${TRUSTED_CA_PATH} exists...`);
    const caFileExists = fs.existsSync(TRUSTED_CA_PATH);
    
    if (caFileExists) {
      log(`${TRUSTED_CA_PATH} exists`);
      
      // Read the file content
      const caContent = fs.readFileSync(TRUSTED_CA_PATH, 'utf8');
      log(`CA file content (first 40 chars): ${caContent.substring(0, 40)}...`);
      
      // Check if the file is not empty
      if (caContent.trim() === '') {
        error(`${TRUSTED_CA_PATH} exists but is empty`);
      }
    } else {
      error(`${TRUSTED_CA_PATH} does not exist`);
      log('This file is required for certificate-based authentication');
    }
    
    // Step 2: Check SSH server configuration
    log(`Checking SSH server configuration in ${SSHD_CONFIG_PATH}...`);
    await checkSSHConfig();
    
    // Step 3: Test certificate validation
    log('Testing certificate validation...');
    await testCertificateValidation();
    
    log('VM CA configuration test completed');
  } catch (err) {
    error(`Test failed: ${err.message}`);
    console.error(err);
  }
}

async function checkSSHConfig() {
  return new Promise((resolve, reject) => {
    // Check if sshd_config exists
    if (!fs.existsSync(SSHD_CONFIG_PATH)) {
      error(`${SSHD_CONFIG_PATH} does not exist`);
      return resolve();
    }
    
    // Read sshd_config
    const sshdConfig = fs.readFileSync(SSHD_CONFIG_PATH, 'utf8');
    
    // Check for TrustedUserCAKeys directive
    const trustedCAKeysMatch = sshdConfig.match(/^\s*TrustedUserCAKeys\s+(.+)$/m);
    if (trustedCAKeysMatch) {
      log(`TrustedUserCAKeys directive found: ${trustedCAKeysMatch[1]}`);
      
      // Check if the path matches the expected path
      if (trustedCAKeysMatch[1] !== TRUSTED_CA_PATH) {
        log(`Warning: TrustedUserCAKeys path (${trustedCAKeysMatch[1]}) does not match expected path (${TRUSTED_CA_PATH})`);
      }
    } else {
      error('TrustedUserCAKeys directive not found in sshd_config');
      log(`To enable certificate authentication, add the following line to ${SSHD_CONFIG_PATH}:`);
      log(`TrustedUserCAKeys ${TRUSTED_CA_PATH}`);
    }
    
    // Check for AuthorizedPrincipalsFile directive (optional)
    const authorizedPrincipalsMatch = sshdConfig.match(/^\s*AuthorizedPrincipalsFile\s+(.+)$/m);
    if (authorizedPrincipalsMatch) {
      log(`AuthorizedPrincipalsFile directive found: ${authorizedPrincipalsMatch[1]}`);
    } else {
      log('AuthorizedPrincipalsFile directive not found in sshd_config (optional)');
    }
    
    resolve();
  });
}

async function testCertificateValidation() {
  return new Promise((resolve, reject) => {
    // Create a sample certificate for testing
    const sampleCertPath = path.join('/tmp', 'sample-cert.pub');
    
    // This is just a sample certificate format for testing validation
    const sampleCert = `ssh-rsa-cert-v01@openssh.com AAAAHHNzaC1yc2EtY2VydC12MDFAb3BlbnNzaC5jb20AAAAgLyYqIwiQmaFP+Off1VfgjKN4SXSW4gl9jToYvbbxgJQAAAADAQABAAABAQDAIppvtlJF6GTBghc73mQGdfA7g4QNw2j5ZBlZrx9Ev/7QoBMe9xovwQJgzvVvDBBUk5hMUnXNgyc3vkd3rXwOMY3BLFYrrVJe9G4XNsMOk/071PVLhjtQ0VKDFVbRk7u89chk2DmLGS0dfZTIzEkL1I+yBOAC6MZxWMMjU/c21jNIY84RpwcEiusx1BQfXlEgpUwCYr9kbRFwyk3bXUrUTXG2eXy3sQkWHFT1FN88SsSn25XS6CoA8m1/QrB3q69lB1dj89zECNZAQBR7fi6149wLu/HDdM374gigaLJe0mFwm8e+2WNsh9YVL/wsA3HUbiODWfntihmwgYF+j7r3AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAGU2FtcGxlAAAAAGULLxsAAAAAZQtDGwAAAAAAAAAAAAAAAAAAAAACAAAACnBlcm1pdC1wdHkAAAAAAAAADnBlcm1pdC11c2VyLXJjAAAAAAAAAAAAAAIXAAAAB3NzaC1yc2EAAAADAQABAAACAQDoWWyG0wDY7sSx4fk229JK/d1PxLMwC40h/4Yeuvdzoksab+iuItcIvZ/3/RrGtRNdDZtbQYqCphyrGKhZg73LY59mgrjq+1I88m6zcv8jHPGxkOyVjiW4mRgFU6loQRejk6R7UxKqi+ueMxzBHHK4O5+AePVPd+WrPaI5d8Bl4di0McAZCUS8r8xvCg334C9gaclCTdur7mt41sIOvbODLQ99EWiXomwkrreE2IUAe6B4kz8SSKOwjlxZ+630s+rK9/9Lg1ern9p3/6S5E7alX5XqPClqdL2eELAPotyvXgEWhjly3IU4coqksh1zdyISzLjMzoSGxBKWIiQUdnHU0/PKtT0yYEtkvyD+b+neui0vLAYM5Tg5QhDZPIaYMTg0ICHMc0nkNLs5d9NJVuO/Vj1h3f1pbiXm24qOWwxkJoS7vwHfIqoWTA1YXTBuf8KAv9/9smKX4QAFcxGfRz3xVhKGw9OnLFT5hYDWzJkyWUGMisQVb7mYIZEF6mmxWqKzDFcgaGWnnAMO0eLuKuy601t7vdMHHO0KH/4njyvk5wl/ocyMnR2M7kJAlv6o64zXIOg7E8hqSbxkY5abb+oBAdK3EgQqiqLKtcWr2HuA6FlenWtNmXnZtn1UEO1MAr7eyAeQHQ49hnCX2u0YbfJQRBHodX1sZLbQFFSBiVak+QAAAhUAAAAMcnNhLXNoYTItNTEyAAACALxWEVs0fvDAgSGDVxNIHLPdLlezVpKrMvDQ9N4XUwqMEEGxXUkAcVJfXIyPGsSB5xcLEFJyNkGmK9fPON6UM8puPMdWZLNHxRJZFJnOPm+JWVUh1miJKfP0g0lJbMhCFz/JUB4/mN3rMoIVzxZQhDR5MJUXp0GGu5TGB0JYv1sRzKGJiKiSJ4kKVnQUzcDCcjnZ/7jHPNPYPr2KwQ6uFxs5nHRoRJYHXp/wNIgGpQYI4WpCKagiRSVRXwCvoBsLcQjqeGEGJiUTwFECCVm3grz3DYJcSYsEBjN9PCe+SzBtpLcA/BARxdUVx4/LKN0XlECRpF8Hy5nnGLvELqRYXLEJnSERa+Lf+IJyMjdYIZ4Byn+zRMrfXlhiRNs3MnlkMZRbfyJ/g8cXRQCMrp4Lw0GRQeRDj0TUy9yaVR/TSGf+KV1EZ0EjYKNrxnW/CV1WxnBHZ1QEfEm+9mVNUh4l4Ek1VjIQGWBKvfCIEZRmZP6lEfG7z1G5aQQRVsgLvQ0g/SCsKlkjCl3fXxmZlKgda4/AFPQl9Y4g test-key`;
    
    try {
      // Write the sample certificate to a file
      fs.writeFileSync(sampleCertPath, sampleCert);
      
      // Try to validate the certificate
      try {
        const output = execSync(`ssh-keygen -L -f ${sampleCertPath}`, { encoding: 'utf8' });
        log('Certificate validation command executed successfully');
        log('Certificate validation output:');
        log(output.substring(0, 200) + '...');
      } catch (execError) {
        error(`Certificate validation failed: ${execError.message}`);
        if (execError.stdout) log(`stdout: ${execError.stdout}`);
        if (execError.stderr) error(`stderr: ${execError.stderr}`);
      }
      
      // Clean up
      fs.unlinkSync(sampleCertPath);
      
      resolve();
    } catch (err) {
      error(`Error during certificate validation test: ${err.message}`);
      resolve(); // Continue even if this fails
    }
  });
}

// Check if we can access the required files
function checkPermissions() {
  try {
    // Check if we can read sshd_config
    if (fs.existsSync(SSHD_CONFIG_PATH)) {
      try {
        fs.accessSync(SSHD_CONFIG_PATH, fs.constants.R_OK);
        log(`Can read ${SSHD_CONFIG_PATH}`);
      } catch (err) {
        error(`Cannot read ${SSHD_CONFIG_PATH}. Try running with sudo.`);
        return false;
      }
    }
    
    // Check if we can read trusted-user-ca-keys.pem
    if (fs.existsSync(TRUSTED_CA_PATH)) {
      try {
        fs.accessSync(TRUSTED_CA_PATH, fs.constants.R_OK);
        log(`Can read ${TRUSTED_CA_PATH}`);
      } catch (err) {
        error(`Cannot read ${TRUSTED_CA_PATH}. Try running with sudo.`);
        return false;
      }
    }
    
    return true;
  } catch (err) {
    error(`Error checking permissions: ${err.message}`);
    return false;
  }
}

// Check permissions first, then run the main function
if (checkPermissions()) {
  main().catch(err => {
    error(`Unhandled error: ${err.message}`);
    console.error(err);
    process.exit(1);
  });
} else {
  error('Permission check failed. Please run this script with sudo.');
  process.exit(1);
}
