// src/services/provider/gcp.service.js
const compute = require('@google-cloud/compute');
const { ApiError } = require('../../utils/errors');

class GCPService {
  constructor(credentials) {
    try {
      console.log(`[GCP] Initializing GCP service for project: ${credentials.projectId}`);

      // Parse the keyFile if it's a string (JSON content)
      let keyFileContent;
      if (typeof credentials.keyFile === 'string') {
        try {
          console.log('[GCP] Parsing keyFile from string');
          keyFileContent = JSON.parse(credentials.keyFile);
          console.log('[GCP] Successfully parsed keyFile');
        } catch (error) {
          console.error('[GCP] Error parsing keyFile:', error);
          throw new ApiError(400, 'Invalid GCP key file format. Must be valid JSON.');
        }
      } else {
        console.log('[GCP] Using keyFile as object');
        keyFileContent = credentials.keyFile;
      }

      // Validate keyFile content
      if (!keyFileContent || !keyFileContent.client_email || !keyFileContent.private_key) {
        console.error('[GCP] Invalid keyFile content:', JSON.stringify(keyFileContent, null, 2).substring(0, 200) + '...');
        throw new ApiError(400, 'Invalid GCP key file content. Missing required fields.');
      }

      console.log(`[GCP] Using service account: ${keyFileContent.client_email}`);

      // Create GCP Compute client - using the correct client initialization
      // We'll use the InstancesClient, ZonesClient, etc. as needed
      this.instancesClient = new compute.InstancesClient({
        projectId: credentials.projectId,
        credentials: keyFileContent,
      });

      this.zonesClient = new compute.ZonesClient({
        projectId: credentials.projectId,
        credentials: keyFileContent,
      });

      this.projectId = credentials.projectId;
      this.zone = credentials.zone || 'us-central1-a'; // Default zone if not provided
      console.log(`[GCP] GCP service initialized for project: ${this.projectId}, default zone: ${this.zone}`);
    } catch (error) {
      console.error(`[GCP] Error initializing GCP service: ${error.message}`, error);
      throw new ApiError(500, `Error initializing GCP service: ${error.message}`);
    }
  }

  /**
   * List all VMs (GCP instances)
   * @returns {Promise<Array>} List of GCP instances
   */
  async listVMs() {
    try {
      console.log(`[GCP] Listing VMs for project: ${this.projectId}`);

      // Get all zones
      const zoneRequest = await this.zonesClient.list({
        project: this.projectId
      });

      const zones = zoneRequest[0].items || [];
      console.log(`[GCP] Found ${zones.length} zones`);

      // Transform GCP response to our VM format
      const vms = [];

      // Use aggregatedList to get all instances across zones
      const instancesRequest = this.instancesClient.aggregatedListAsync({
        project: this.projectId
      });

      // Process all instances from all zones
      for await (const [zone, instancesObject] of instancesRequest) {
        const zoneName = zone.split('/').pop(); // Extract zone name from the key
        const instances = instancesObject.instances || [];

        console.log(`[GCP] Found ${instances.length} VMs in zone ${zoneName}`);

        for (const instance of instances) {
          try {
            console.log(`[GCP] Processing VM: ${instance.name} (${instance.id}) in state: ${instance.status}`);

            vms.push({
              instanceId: instance.id,
              name: instance.name,
              state: this.mapGCPState(instance.status),
              ipAddress: this.getPrivateIP(instance),
              publicIpAddress: this.getPublicIP(instance),
              region: zoneName,
            });
          } catch (vmError) {
            console.error(`[GCP] Error processing VM in zone ${zoneName}: ${vmError.message}`);
            // Continue with next VM
          }
        }
      }

      console.log(`[GCP] Total VMs found: ${vms.length}`);
      return vms;
    } catch (error) {
      console.error(`[GCP] Error listing GCP instances: ${error.message}`, error);
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
      // Use aggregatedList to find the instance in any zone
      const instancesRequest = this.instancesClient.aggregatedListAsync({
        project: this.projectId,
        filter: `id=${instanceId}`
      });

      // Look for the instance in any zone
      for await (const [zone, instancesObject] of instancesRequest) {
        const zoneName = zone.split('/').pop(); // Extract zone name from the key
        const instances = instancesObject.instances || [];

        if (instances.length > 0) {
          const instance = instances[0];
          return {
            instanceId: instance.id,
            name: instance.name,
            state: this.mapGCPState(instance.status),
            ipAddress: this.getPrivateIP(instance),
            publicIpAddress: this.getPublicIP(instance),
            region: zoneName,
          };
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
      // Find the VM zone first
      const vmInfo = await this.findVMZone(instanceId);
      if (!vmInfo) {
        throw new ApiError(404, `Instance ${instanceId} not found`);
      }

      // Start the VM
      await this.instancesClient.start({
        project: this.projectId,
        zone: vmInfo.zone,
        instance: vmInfo.name
      });

      return;
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
      // Find the VM zone first
      const vmInfo = await this.findVMZone(instanceId);
      if (!vmInfo) {
        throw new ApiError(404, `Instance ${instanceId} not found`);
      }

      // Stop the VM
      await this.instancesClient.stop({
        project: this.projectId,
        zone: vmInfo.zone,
        instance: vmInfo.name
      });

      return;
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
      // Find the VM zone first
      const vmInfo = await this.findVMZone(instanceId);
      if (!vmInfo) {
        throw new ApiError(404, `Instance ${instanceId} not found`);
      }

      // Reset (reboot) the VM
      await this.instancesClient.reset({
        project: this.projectId,
        zone: vmInfo.zone,
        instance: vmInfo.name
      });

      return;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Error rebooting VM: ${error.message}`);
    }
  }

  /**
   * Helper method to find a VM's zone
   * @param {string} instanceId - GCP instance ID
   * @returns {Promise<Object|null>} VM info with zone and name
   */
  async findVMZone(instanceId) {
    try {
      // Use aggregatedList to find the instance in any zone
      const instancesRequest = this.instancesClient.aggregatedListAsync({
        project: this.projectId,
        filter: `id=${instanceId}`
      });

      // Look for the instance in any zone
      for await (const [zone, instancesObject] of instancesRequest) {
        const zoneName = zone.split('/').pop(); // Extract zone name from the key
        const instances = instancesObject.instances || [];

        if (instances.length > 0) {
          const instance = instances[0];
          return {
            zone: zoneName,
            name: instance.name
          };
        }
      }

      return null;
    } catch (error) {
      console.error(`[GCP] Error finding VM zone: ${error.message}`);
      return null;
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
