"""
SSH key updater handler for managing SSH keys on the local system
"""
import os
import logging
import stat
import platform
from pathlib import Path

# Import pwd module only on Unix/Linux systems
if platform.system() != 'Windows':
    import pwd

class SSHKeyUpdater:
    """Handler for updating SSH keys on the local system"""

    def handle(self, payload):
        """
        Handle SSH key update command

        Args:
            payload (dict): Command payload containing:
                - sshUser: Username for SSH access
                - publicKey: Public key to add
                - signedKey: Signed key from Vault (optional)
                - serialNumber: Serial number of the signed key (optional)

        Returns:
            dict: Result of the operation with:
                - status: 'SUCCESS' or 'ERROR'
                - message: Description of the result
                - data: Additional data (optional)
        """
        try:
            # Extract payload data
            ssh_user = payload.get('sshUser')
            public_key = payload.get('publicKey')
            signed_key = payload.get('signedKey')

            if not ssh_user:
                return {
                    'status': 'ERROR',
                    'message': 'Missing sshUser in payload'
                }

            if not public_key and not signed_key:
                return {
                    'status': 'ERROR',
                    'message': 'Missing publicKey or signedKey in payload'
                }

            # Use signed key if available, otherwise use public key
            key_to_add = signed_key if signed_key else public_key

            # Find user's home directory
            if platform.system() == 'Windows':
                # On Windows, use a simulated home directory for testing
                home_dir = os.path.join(os.environ.get('USERPROFILE', 'C:\\Users\\' + ssh_user))
                # For testing, we'll use the current user's home directory
                if not os.path.exists(home_dir):
                    home_dir = os.environ.get('USERPROFILE', 'C:\\Users\\' + os.environ.get('USERNAME', 'Default'))
                    logging.warning(f"User {ssh_user} not found, using current user's home directory: {home_dir}")
            else:
                # On Unix/Linux, use pwd module
                try:
                    user_info = pwd.getpwnam(ssh_user)
                    home_dir = user_info.pw_dir
                except KeyError:
                    return {
                        'status': 'ERROR',
                        'message': f'User {ssh_user} does not exist on this system'
                    }

            # Create .ssh directory if it doesn't exist
            ssh_dir = os.path.join(home_dir, '.ssh')
            authorized_keys_path = os.path.join(ssh_dir, 'authorized_keys')

            try:
                # Create .ssh directory if it doesn't exist
                if not os.path.exists(ssh_dir):
                    logging.info(f"Creating .ssh directory for user {ssh_user}")
                    os.makedirs(ssh_dir, exist_ok=True)
                    os.chmod(ssh_dir, stat.S_IRWXU)  # 700 permissions
                    # Set ownership only on Unix/Linux
                    if platform.system() != 'Windows':
                        os.chown(ssh_dir, user_info.pw_uid, user_info.pw_gid)

                # Create or update authorized_keys file
                with open(authorized_keys_path, 'a+') as f:
                    # Move to beginning of file to check if key already exists
                    f.seek(0)
                    existing_content = f.read()

                    # Only add the key if it's not already there
                    if key_to_add not in existing_content:
                        if existing_content and not existing_content.endswith('\n'):
                            f.write('\n')  # Ensure we start on a new line
                        f.write(f"{key_to_add}\n")

                # Set proper permissions on authorized_keys file
                os.chmod(authorized_keys_path, stat.S_IRUSR | stat.S_IWUSR)  # 600 permissions
                # Set ownership only on Unix/Linux
                if platform.system() != 'Windows':
                    os.chown(authorized_keys_path, user_info.pw_uid, user_info.pw_gid)

                return {
                    'status': 'SUCCESS',
                    'message': f'SSH key added for user {ssh_user}',
                    'data': {
                        'path': authorized_keys_path
                    }
                }

            except PermissionError as e:
                return {
                    'status': 'ERROR',
                    'message': f'Permission denied: {str(e)}'
                }
            except Exception as e:
                return {
                    'status': 'ERROR',
                    'message': f'Failed to update SSH key: {str(e)}'
                }

        except Exception as e:
            logging.error(f"Unexpected error in SSH key updater: {str(e)}")
            return {
                'status': 'ERROR',
                'message': f'Unexpected error: {str(e)}'
            }
