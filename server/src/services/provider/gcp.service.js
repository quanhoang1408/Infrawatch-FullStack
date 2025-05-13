// src/services/provider/gcp.service.js
const { Compute } = require('@google-cloud/compute');
const { ApiError } = require('../../utils/errors');

class GCPService {
  constructor(credentials) {
    try {
      // Parse the keyFile if it's a string (JSON content)
      let keyFileContent;
      if (typeof credentials.keyFile === 'string') {
        try {
          keyFileContent = JSON.parse(credentials.keyFile);
        } catch (error) {
          throw new ApiError(400, 'Invalid GCP key file format. Must be valid JSON.');
        }
      } else {
        keyFileContent = credentials.keyFile;
      }

      // Create GCP Compute client
      this.compute = new Compute({
        projectId: credentials.projectId,
        credentials: keyFileContent,
      });

      this.projectId = credentials.projectId;
      this.zone = credentials.zone || 'us-central1-a'; // Default zone if not provided
    } catch (error) {
      throw new ApiError(500, `Error initializing GCP service: ${error.message}`);
    }
  }

  /**
   * List all VMs (GCP instances)
   * @returns {Promise<Array>} List of GCP instances
   */
  async listVMs() {
    try {
      // Get all zones
      const [zones] = await this.compute.getZones();
      
      // Transform GCP response to our VM format
      const vms = [];
      
      // Get VMs from each zone
      for (const zone of zones) {
        const [vmsInZone] = await zone.getVMs();
        
        for (const vm of vmsInZone) {
          const [metadata] = await vm.getMetadata();
          
          vms.push({
            instanceId: metadata.id,
            name: metadata.name,
            state: this.mapGCPState(metadata.status),
            ipAddress: this.getPrivateIP(metadata),
            publicIpAddress: this.getPublicIP(metadata),
            region: zone.name,
          });
        }
      }
      
      return vms;
    } catch (error) {
      throw new ApiError(500, `Error listing GCP instances: ${error.message}`);
    }
  }

  /**
   * Get VM details
   * @param {string} instanceId - GCP instance ID
   * @returns {Promise<Object>} Instance details
   */
  async getVM(instanceId) {
    try {
      // Get all zones
      const [zones] = await this.compute.getZones();
      
      // Find the VM in any zone
      for (const zone of zones) {
        try {
          const vm = zone.vm(instanceId);
          const [exists] = await vm.exists();
          
          if (exists) {
            const [metadata] = await vm.getMetadata();
            
            return {
              instanceId: metadata.id,
              name: metadata.name,
              state: this.mapGCPState(metadata.status),
              ipAddress: this.getPrivateIP(metadata),
              publicIpAddress: this.getPublicIP(metadata),
              region: zone.name,
            };
          }
        } catch (error) {
          // Continue to next zone if VM not found in this zone
          continue;
        }
      }
      
      throw new ApiError(404, `Instance ${instanceId} not found`);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Error getting GCP instance: ${error.message}`);
    }
  }

  /**
   * Start a VM
   * @param {string} instanceId - GCP instance ID
   * @returns {Promise<void>}
   */
  async startVM(instanceId) {
    try {
      // Find the VM in any zone
      const [zones] = await this.compute.getZones();
      
      for (const zone of zones) {
        try {
          const vm = zone.vm(instanceId);
          const [exists] = await vm.exists();
          
          if (exists) {
            await vm.start();
            return;
          }
        } catch (error) {
          // Continue to next zone if VM not found in this zone
          continue;
        }
      }
      
      throw new ApiError(404, `Instance ${instanceId} not found`);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Error starting VM: ${error.message}`);
    }
  }

  /**
   * Stop a VM
   * @param {string} instanceId - GCP instance ID
   * @returns {Promise<void>}
   */
  async stopVM(instanceId) {
    try {
      // Find the VM in any zone
      const [zones] = await this.compute.getZones();
      
      for (const zone of zones) {
        try {
          const vm = zone.vm(instanceId);
          const [exists] = await vm.exists();
          
          if (exists) {
            await vm.stop();
            return;
          }
        } catch (error) {
          // Continue to next zone if VM not found in this zone
          continue;
        }
      }
      
      throw new ApiError(404, `Instance ${instanceId} not found`);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Error stopping VM: ${error.message}`);
    }
  }

  /**
   * Reboot a VM
   * @param {string} instanceId - GCP instance ID
   * @returns {Promise<void>}
   */
  async rebootVM(instanceId) {
    try {
      // Find the VM in any zone
      const [zones] = await this.compute.getZones();
      
      for (const zone of zones) {
        try {
          const vm = zone.vm(instanceId);
          const [exists] = await vm.exists();
          
          if (exists) {
            await vm.reset();
            return;
          }
        } catch (error) {
          // Continue to next zone if VM not found in this zone
          continue;
        }
      }
      
      throw new ApiError(404, `Instance ${instanceId} not found`);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Error rebooting VM: ${error.message}`);
    }
  }

  /**
   * Map GCP instance state to our standard state format
   * @param {string} gcpState - GCP instance state
   * @returns {string} Standardized state
   */
  mapGCPState(gcpState) {
    const stateMap = {
      'PROVISIONING': 'pending',
      'STAGING': 'pending',
      'RUNNING': 'running',
      'STOPPING': 'stopping',
      'STOPPED': 'stopped',
      'SUSPENDING': 'stopping',
      'SUSPENDED': 'stopped',
      'TERMINATED': 'terminated',
    };
    
    return stateMap[gcpState] || 'unknown';
  }

  /**
   * Get private IP address from instance metadata
   * @param {Object} metadata - Instance metadata
   * @returns {string} Private IP address
   */
  getPrivateIP(metadata) {
    try {
      if (metadata.networkInterfaces && metadata.networkInterfaces.length > 0) {
        return metadata.networkInterfaces[0].networkIP || '';
      }
      return '';
    } catch (error) {
      return '';
    }
  }

  /**
   * Get public IP address from instance metadata
   * @param {Object} metadata - Instance metadata
   * @returns {string} Public IP address
   */
  getPublicIP(metadata) {
    try {
      if (metadata.networkInterfaces && 
          metadata.networkInterfaces.length > 0 && 
          metadata.networkInterfaces[0].accessConfigs && 
          metadata.networkInterfaces[0].accessConfigs.length > 0) {
        return metadata.networkInterfaces[0].accessConfigs[0].natIP || '';
      }
      return '';
    } catch (error) {
      return '';
    }
  }
}

module.exports = GCPService;
