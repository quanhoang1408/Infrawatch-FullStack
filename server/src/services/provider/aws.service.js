// src/services/provider/aws.service.js
const AWS = require('aws-sdk');
const { ApiError } = require('../../utils/errors');

class AWSService {
  constructor(credentials) {
    this.ec2 = new AWS.EC2({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region: credentials.region,
    });
    this.region = credentials.region;
  }

  /**
   * List all VMs (EC2 instances)
   * @returns {Promise<Array>} List of EC2 instances
   */
  async listVMs() {
    try {
      const data = await this.ec2.describeInstances().promise();
      
      // Transform AWS response to our VM format
      const vms = [];
      
      if (data.Reservations) {
        data.Reservations.forEach(reservation => {
          if (reservation.Instances) {
            reservation.Instances.forEach(instance => {
              // Find name from tags
              let name = '';
              if (instance.Tags) {
                const nameTag = instance.Tags.find(tag => tag.Key === 'Name');
                if (nameTag) {
                  name = nameTag.Value;
                }
              }
              
              vms.push({
                instanceId: instance.InstanceId,
                name: name || instance.InstanceId,
                state: instance.State.Name,
                ipAddress: instance.PrivateIpAddress || '',
                publicIpAddress: instance.PublicIpAddress || '',
                region: this.region,
              });
            });
          }
        });
      }
      
      return vms;
    } catch (error) {
      throw new ApiError(500, `Error listing AWS instances: ${error.message}`);
    }
  }

  /**
   * Get VM details
   * @param {string} instanceId - EC2 instance ID
   * @returns {Promise<Object>} Instance details
   */
  async getVM(instanceId) {
    try {
      const params = {
        InstanceIds: [instanceId],
      };
      
      const data = await this.ec2.describeInstances(params).promise();
      
      if (!data.Reservations || data.Reservations.length === 0 || 
          !data.Reservations[0].Instances || data.Reservations[0].Instances.length === 0) {
        throw new ApiError(404, `Instance ${instanceId} not found`);
      }
      
      const instance = data.Reservations[0].Instances[0];
      
      // Find name from tags
      let name = '';
      if (instance.Tags) {
        const nameTag = instance.Tags.find(tag => tag.Key === 'Name');
        if (nameTag) {
          name = nameTag.Value;
        }
      }
      
      return {
        instanceId: instance.InstanceId,
        name: name || instance.InstanceId,
        state: instance.State.Name,
        ipAddress: instance.PrivateIpAddress || '',
        publicIpAddress: instance.PublicIpAddress || '',
        region: this.region,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Error getting AWS instance: ${error.message}`);
    }
  }

  /**
   * Start a VM
   * @param {string} instanceId - EC2 instance ID
   * @returns {Promise<void>}
   */
  async startVM(instanceId) {
    try {
      const params = {
        InstanceIds: [instanceId],
      };
      
      await this.ec2.startInstances(params).promise();
    } catch (error) {
      throw new ApiError(500, `Error starting VM: ${error.message}`);
    }
  }

  /**
   * Stop a VM
   * @param {string} instanceId - EC2 instance ID
   * @returns {Promise<void>}
   */
  async stopVM(instanceId) {
    try {
      const params = {
        InstanceIds: [instanceId],
      };
      
      await this.ec2.stopInstances(params).promise();
    } catch (error) {
      throw new ApiError(500, `Error stopping VM: ${error.message}`);
    }
  }

  /**
   * Reboot a VM
   * @param {string} instanceId - EC2 instance ID
   * @returns {Promise<void>}
   */
  async rebootVM(instanceId) {
    try {
      const params = {
        InstanceIds: [instanceId],
      };
      
      await this.ec2.rebootInstances(params).promise();
    } catch (error) {
      throw new ApiError(500, `Error rebooting VM: ${error.message}`);
    }
  }
}

module.exports = AWSService;