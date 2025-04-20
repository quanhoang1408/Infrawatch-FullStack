const config = {
  vault: {
    address: process.env.VAULT_ADDR || 'http://localhost:8200',
    token: process.env.VAULT_TOKEN,
    mount: process.env.VAULT_SSH_MOUNT || 'ssh',
    role: process.env.VAULT_SSH_ROLE || 'ssh-role'
  }
};

module.exports = config;
