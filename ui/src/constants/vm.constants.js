/**
 * Constants for VM status and actions
 */

// VM status constants
export const VM_STATUS = {
  RUNNING: 'running',
  STOPPED: 'stopped',
  PENDING: 'pending',
  STARTING: 'starting',
  STOPPING: 'stopping',
  TERMINATED: 'terminated',
  ERROR: 'error'
};

// VM action constants
export const VM_ACTIONS = {
  START: 'start',
  STOP: 'stop',
  RESTART: 'restart',
  TERMINATE: 'terminate'
};

// VM provider constants
export const PROVIDERS = {
  AWS: 'aws',
  AZURE: 'azure',
  GCP: 'gcp',
  VMWARE: 'vmware'
};