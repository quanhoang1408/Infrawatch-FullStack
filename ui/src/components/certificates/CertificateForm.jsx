// CertificateForm.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Modal, 
  Button,
  Spinner
} from '../common';
import { 
  FormItem, 
  FormSection, 
  InputWithIcon, 
  ValidationInput, 
  DatePicker, 
  FileUpload 
} from '../form';

/**
 * Form for creating or editing SSH certificates
 * @param {boolean} visible - Modal visibility
 * @param {function} onClose - Close handler
 * @param {function} onSubmit - Submit handler
 * @param {object} certificate - Certificate for editing (if any)
 * @param {boolean} loading - Loading state
 */
const CertificateForm = ({
  visible = false,
  onClose,
  onSubmit,
  certificate = null,
  loading = false,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-certificate-form';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  const isEdit = !!certificate;
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'SSH Key',
    keyFile: null,
    passphrase: '',
    description: '',
    expiresAt: ''
  });
  
  const [errors, setErrors] = useState({});
  
  // Update form data when certificate changes
  useEffect(() => {
    if (certificate) {
      setFormData({
        name: certificate.name || '',
        type: certificate.type || 'SSH Key',
        keyFile: null,
        passphrase: '',
        description: certificate.description || '',
        expiresAt: certificate.expiresAt ? new Date(certificate.expiresAt).toISOString().split('T')[0] : ''
      });
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        type: 'SSH Key',
        keyFile: null,
        passphrase: '',
        description: '',
        expiresAt: ''
      });
    }
    
    setErrors({});
  }, [certificate, visible]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for the changed field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  // Handle file upload
  const handleFileChange = (file) => {
    setFormData(prev => ({
      ...prev,
      keyFile: file
    }));
    
    // Clear error for the key file
    if (errors.keyFile) {
      setErrors(prev => ({
        ...prev,
        keyFile: undefined
      }));
    }
  };
  
  // Handle date change
  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      expiresAt: date
    }));
    
    // Clear error for the expiration date
    if (errors.expiresAt) {
      setErrors(prev => ({
        ...prev,
        expiresAt: undefined
      }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Certificate name is required';
    }
    
    if (!isEdit && !formData.keyFile) {
      newErrors.keyFile = 'Certificate file is required';
    }
    
    if (!formData.expiresAt) {
      newErrors.expiresAt = 'Expiration date is required';
    } else {
      const expirationDate = new Date(formData.expiresAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expirationDate < today) {
        newErrors.expiresAt = 'Expiration date cannot be in the past';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit?.(formData, certificate?.id);
    }
  };
  
  // Generate a default expiration date (1 year from now)
  const generateDefaultExpiration = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  };
  
  // Handle default expiration button click
  const handleDefaultExpiration = () => {
    const defaultExpiration = generateDefaultExpiration();
    setFormData(prev => ({
      ...prev,
      expiresAt: defaultExpiration
    }));
    
    // Clear error for the expiration date
    if (errors.expiresAt) {
      setErrors(prev => ({
        ...prev,
        expiresAt: undefined
      }));
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={isEdit ? 'Edit Certificate' : 'Add Certificate'}
      className={classes}
      okText={isEdit ? 'Update' : 'Create'}
      cancelText="Cancel"
      onOk={handleSubmit}
      okLoading={loading}
      okDisabled={loading}
      width="600px"
      {...rest}
    >
      <div className={`${baseClass}__content`}>
        {loading && (
          <div className={`${baseClass}__loading`}>
            <Spinner size="lg" />
          </div>
        )}
        
        <FormItem
          label="Certificate Name"
          required
          error={errors.name}
          labelFor="certificate-name"
        >
          <InputWithIcon
            id="certificate-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter certificate name"
            icon={<i className="icon-file-text" />}
            disabled={loading}
            error={!!errors.name}
          />
        </FormItem>
        
        {!isEdit && (
          <FormItem
            label="Certificate File"
            required
            error={errors.keyFile}
            helpText="Upload your SSH private key or public key file"
          >
            <FileUpload
              accept={['.pem', '.key', '.pub', '.ppk']}
              onChange={handleFileChange}
              maxSize={10 * 1024 * 1024} // 10MB
              dropzoneText="Drag & drop your SSH key file here, or click to select"
              disabled={loading}
            />
          </FormItem>
        )}
        
        {!isEdit && (
          <FormItem
            label="Passphrase"
            helpText="If your SSH key is encrypted with a passphrase, enter it here"
            labelFor="certificate-passphrase"
          >
            <InputWithIcon
              id="certificate-passphrase"
              name="passphrase"
              type="password"
              value={formData.passphrase}
              onChange={handleChange}
              placeholder="Enter passphrase (if applicable)"
              icon={<i className="icon-lock" />}
              disabled={loading}
            />
          </FormItem>
        )}
        
        <FormItem
          label="Expiration Date"
          required
          error={errors.expiresAt}
          labelFor="certificate-expiration"
        >
          <div className={`${baseClass}__expiration-container`}>
            <DatePicker
              id="certificate-expiration"
              value={formData.expiresAt}
              onChange={handleDateChange}
              placeholder="Select expiration date"
              minDate={new Date().toISOString().split('T')[0]}
              disabled={loading}
            />
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDefaultExpiration}
              disabled={loading}
            >
              Default (1 Year)
            </Button>
          </div>
        </FormItem>
        
        <FormItem
          label="Description"
          labelFor="certificate-description"
        >
          <textarea
            id="certificate-description"
            name="description"
            className={`${baseClass}__textarea`}
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter certificate description"
            rows={4}
            disabled={loading}
          />
        </FormItem>
      </div>
    </Modal>
  );
};

CertificateForm.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  certificate: PropTypes.object,
  loading: PropTypes.bool,
  className: PropTypes.string
};

export default CertificateForm;