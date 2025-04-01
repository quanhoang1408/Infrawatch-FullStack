// CreateVMModal.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from '../common';
import ProviderIcon from './ProviderIcon';

/**
 * Modal for creating a new VM
 * @param {boolean} visible - Modal visibility
 * @param {function} onClose - Handler for modal close
 * @param {function} onCreate - Handler for VM creation
 * @param {array} providers - Available cloud providers
 * @param {array} regions - Available regions
 * @param {array} instanceTypes - Available instance types
 * @param {array} operatingSystems - Available operating systems
 */
const CreateVMModal = ({
  visible = false,
  onClose,
  onCreate,
  providers = [],
  regions = [],
  instanceTypes = [],
  operatingSystems = [],
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-create-vm-modal';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    region: '',
    instanceType: '',
    operatingSystem: '',
    storageSize: 50
  });
  
  // Loading state
  const [loading, setLoading] = useState(false);
  
  // Track step in the creation process
  const [step, setStep] = useState(1);
  
  // Filter options based on selected provider
  const filteredRegions = regions.filter(
    region => !formData.provider || region.provider === formData.provider
  );
  
  const filteredInstanceTypes = instanceTypes.filter(
    type => !formData.provider || type.provider === formData.provider
  );
  
  const filteredOperatingSystems = operatingSystems.filter(
    os => !formData.provider || os.provider === formData.provider
  );
  
  // Handle form input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Reset dependent fields when provider changes
    if (name === 'provider') {
      setFormData(prev => ({
        ...prev,
        provider: value,
        region: '',
        instanceType: '',
        operatingSystem: ''
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      await onCreate?.(formData);
      handleReset();
      onClose?.();
    } catch (error) {
      console.error('Error creating VM:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Reset form to initial state
  const handleReset = () => {
    setFormData({
      name: '',
      provider: '',
      region: '',
      instanceType: '',
      operatingSystem: '',
      storageSize: 50
    });
    setStep(1);
  };
  
  // Move to next step
  const handleNextStep = () => {
    setStep(prev => prev + 1);
  };
  
  // Move to previous step
  const handlePreviousStep = () => {
    setStep(prev => prev - 1);
  };
  
  // Render step 1: Basic information
  const renderStep1 = () => (
    <div className={`${baseClass}__step`}>
      <div className={`${baseClass}__form-group`}>
        <label className={`${baseClass}__label`}>
          VM Name <span className={`${baseClass}__required`}>*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`${baseClass}__input`}
          placeholder="Enter VM name"
          required
        />
      </div>
      
      <div className={`${baseClass}__form-group`}>
        <label className={`${baseClass}__label`}>
          Cloud Provider <span className={`${baseClass}__required`}>*</span>
        </label>
        <div className={`${baseClass}__provider-options`}>
          {providers.map(provider => (
            <label
              key={provider.id}
              className={`${baseClass}__provider-option ${
                formData.provider === provider.id ? `${baseClass}__provider-option--selected` : ''
              }`}
            >
              <input
                type="radio"
                name="provider"
                value={provider.id}
                checked={formData.provider === provider.id}
                onChange={handleChange}
                className={`${baseClass}__provider-radio`}
              />
              <ProviderIcon provider={provider.id} size="lg" />
              <span className={`${baseClass}__provider-name`}>{provider.name}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div className={`${baseClass}__form-group`}>
        <label className={`${baseClass}__label`}>
          Region <span className={`${baseClass}__required`}>*</span>
        </label>
        <select
          name="region"
          value={formData.region}
          onChange={handleChange}
          className={`${baseClass}__select`}
          disabled={!formData.provider}
          required
        >
          <option value="">Select a region</option>
          {filteredRegions.map(region => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
  
  // Render step 2: Instance configuration
  const renderStep2 = () => (
    <div className={`${baseClass}__step`}>
      <div className={`${baseClass}__form-group`}>
        <label className={`${baseClass}__label`}>
          Instance Type <span className={`${baseClass}__required`}>*</span>
        </label>
        <select
          name="instanceType"
          value={formData.instanceType}
          onChange={handleChange}
          className={`${baseClass}__select`}
          required
        >
          <option value="">Select an instance type</option>
          {filteredInstanceTypes.map(type => (
            <option key={type.id} value={type.id}>
              {type.name} ({type.description})
            </option>
          ))}
        </select>
      </div>
      
      <div className={`${baseClass}__form-group`}>
        <label className={`${baseClass}__label`}>
          Operating System <span className={`${baseClass}__required`}>*</span>
        </label>
        <select
          name="operatingSystem"
          value={formData.operatingSystem}
          onChange={handleChange}
          className={`${baseClass}__select`}
          required
        >
          <option value="">Select an operating system</option>
          {filteredOperatingSystems.map(os => (
            <option key={os.id} value={os.id}>
              {os.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className={`${baseClass}__form-group`}>
        <label className={`${baseClass}__label`}>
          Storage Size (GB) <span className={`${baseClass}__required`}>*</span>
        </label>
        <input
          type="number"
          name="storageSize"
          value={formData.storageSize}
          onChange={handleChange}
          className={`${baseClass}__input`}
          min="10"
          max="1000"
          required
        />
      </div>
    </div>
  );
  
  // Render step 3: Review and confirmation
  const renderStep3 = () => (
    <div className={`${baseClass}__step`}>
      <div className={`${baseClass}__review-title`}>Review VM Configuration</div>
      
      <div className={`${baseClass}__review-item`}>
        <div className={`${baseClass}__review-label`}>VM Name:</div>
        <div className={`${baseClass}__review-value`}>{formData.name}</div>
      </div>
      
      <div className={`${baseClass}__review-item`}>
        <div className={`${baseClass}__review-label`}>Cloud Provider:</div>
        <div className={`${baseClass}__review-value`}>
          <ProviderIcon provider={formData.provider} />
          <span style={{ marginLeft: '8px' }}>
            {providers.find(p => p.id === formData.provider)?.name || 'Unknown'}
          </span>
        </div>
      </div>
      
      <div className={`${baseClass}__review-item`}>
        <div className={`${baseClass}__review-label`}>Region:</div>
        <div className={`${baseClass}__review-value`}>
          {regions.find(r => r.id === formData.region)?.name || 'Unknown'}
        </div>
      </div>
      
      <div className={`${baseClass}__review-item`}>
        <div className={`${baseClass}__review-label`}>Instance Type:</div>
        <div className={`${baseClass}__review-value`}>
          {instanceTypes.find(t => t.id === formData.instanceType)?.name || 'Unknown'}
        </div>
      </div>
      
      <div className={`${baseClass}__review-item`}>
        <div className={`${baseClass}__review-label`}>Operating System:</div>
        <div className={`${baseClass}__review-value`}>
          {operatingSystems.find(os => os.id === formData.operatingSystem)?.name || 'Unknown'}
        </div>
      </div>
      
      <div className={`${baseClass}__review-item`}>
        <div className={`${baseClass}__review-label`}>Storage Size:</div>
        <div className={`${baseClass}__review-value`}>{formData.storageSize} GB</div>
      </div>
    </div>
  );
  
  // Render the current step
  const renderStep = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };
  
  // Determine if the current step is valid
  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.name && formData.provider && formData.region;
      case 2:
        return formData.instanceType && formData.operatingSystem && formData.storageSize;
      default:
        return true;
    }
  };
  
  // Custom footer with step navigation
  const renderFooter = () => (
    <div className={`${baseClass}__footer`}>
      <div className={`${baseClass}__step-indicator`}>
        <span className={`${baseClass}__step-number ${step === 1 ? `${baseClass}__step-number--active` : ''}`}>1</span>
        <span className={`${baseClass}__step-divider`}></span>
        <span className={`${baseClass}__step-number ${step === 2 ? `${baseClass}__step-number--active` : ''}`}>2</span>
        <span className={`${baseClass}__step-divider`}></span>
        <span className={`${baseClass}__step-number ${step === 3 ? `${baseClass}__step-number--active` : ''}`}>3</span>
      </div>
      
      <div className={`${baseClass}__buttons`}>
        {step > 1 && (
          <Button
            variant="secondary"
            onClick={handlePreviousStep}
            disabled={loading}
          >
            Previous
          </Button>
        )}
        
        {step < 3 ? (
          <Button
            variant="primary"
            onClick={handleNextStep}
            disabled={!isStepValid() || loading}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={!isStepValid()}
          >
            Create VM
          </Button>
        )}
      </div>
    </div>
  );
  
  return (
    <Modal
      visible={visible}
      onClose={() => {
        handleReset();
        onClose?.();
      }}
      title="Create Virtual Machine"
      className={classes}
      footer={renderFooter()}
      showFooter={true}
      width="600px"
      {...rest}
    >
      <div className={`${baseClass}__content`}>
        {renderStep()}
      </div>
    </Modal>
  );
};

CreateVMModal.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func,
  onCreate: PropTypes.func,
  providers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ),
  regions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      provider: PropTypes.string.isRequired
    })
  ),
  instanceTypes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      provider: PropTypes.string.isRequired
    })
  ),
  operatingSystems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      provider: PropTypes.string.isRequired
    })
  ),
  className: PropTypes.string
};

export default CreateVMModal;