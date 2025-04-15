import React, { useState } from 'react';
import './ProviderForm.scss';

const ProviderForm = ({ onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'aws',
    credentials: {
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1'
    }
  });
  
  const [errors, setErrors] = useState({});
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Provider name is required';
    }
    
    if (!formData.type) {
      newErrors.type = 'Provider type is required';
    }
    
    // Validate credentials based on provider type
    if (formData.type === 'aws') {
      if (!formData.credentials.accessKeyId.trim()) {
        newErrors['credentials.accessKeyId'] = 'Access Key ID is required';
      }
      
      if (!formData.credentials.secretAccessKey.trim()) {
        newErrors['credentials.secretAccessKey'] = 'Secret Access Key is required';
      }
      
      if (!formData.credentials.region.trim()) {
        newErrors['credentials.region'] = 'Region is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('credentials.')) {
      const credentialField = name.split('.')[1];
      setFormData({
        ...formData,
        credentials: {
          ...formData.credentials,
          [credentialField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
      
      // Reset credentials when provider type changes
      if (name === 'type') {
        if (value === 'aws') {
          setFormData(prev => ({
            ...prev,
            [name]: value,
            credentials: {
              accessKeyId: '',
              secretAccessKey: '',
              region: 'us-east-1'
            }
          }));
        } else if (value === 'azure') {
          setFormData(prev => ({
            ...prev,
            [name]: value,
            credentials: {
              clientId: '',
              clientSecret: '',
              tenantId: '',
              subscriptionId: ''
            }
          }));
        } else if (value === 'gcp') {
          setFormData(prev => ({
            ...prev,
            [name]: value,
            credentials: {
              projectId: '',
              keyFile: ''
            }
          }));
        } else if (value === 'vmware') {
          setFormData(prev => ({
            ...prev,
            [name]: value,
            credentials: {
              host: '',
              username: '',
              password: ''
            }
          }));
        }
      }
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  const renderCredentialsFields = () => {
    switch (formData.type) {
      case 'aws':
        return (
          <>
            <div className="form__group">
              <label htmlFor="credentials.accessKeyId" className="form__label">Access Key ID</label>
              <input
                type="text"
                id="credentials.accessKeyId"
                name="credentials.accessKeyId"
                className={`form__input ${errors['credentials.accessKeyId'] ? 'has-error' : ''}`}
                value={formData.credentials.accessKeyId}
                onChange={handleChange}
                disabled={loading}
              />
              {errors['credentials.accessKeyId'] && (
                <span className="form__error">{errors['credentials.accessKeyId']}</span>
              )}
            </div>
            
            <div className="form__group">
              <label htmlFor="credentials.secretAccessKey" className="form__label">Secret Access Key</label>
              <input
                type="password"
                id="credentials.secretAccessKey"
                name="credentials.secretAccessKey"
                className={`form__input ${errors['credentials.secretAccessKey'] ? 'has-error' : ''}`}
                value={formData.credentials.secretAccessKey}
                onChange={handleChange}
                disabled={loading}
              />
              {errors['credentials.secretAccessKey'] && (
                <span className="form__error">{errors['credentials.secretAccessKey']}</span>
              )}
            </div>
            
            <div className="form__group">
              <label htmlFor="credentials.region" className="form__label">Region</label>
              <select
                id="credentials.region"
                name="credentials.region"
                className={`form__input ${errors['credentials.region'] ? 'has-error' : ''}`}
                value={formData.credentials.region}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="us-east-1">US East (N. Virginia)</option>
                <option value="us-east-2">US East (Ohio)</option>
                <option value="us-west-1">US West (N. California)</option>
                <option value="us-west-2">US West (Oregon)</option>
                <option value="ap-south-1">Asia Pacific (Mumbai)</option>
                <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                <option value="ap-northeast-2">Asia Pacific (Seoul)</option>
                <option value="ap-northeast-3">Asia Pacific (Osaka)</option>
                <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
                <option value="ca-central-1">Canada (Central)</option>
                <option value="eu-central-1">EU (Frankfurt)</option>
                <option value="eu-west-1">EU (Ireland)</option>
                <option value="eu-west-2">EU (London)</option>
                <option value="eu-west-3">EU (Paris)</option>
                <option value="eu-north-1">EU (Stockholm)</option>
                <option value="sa-east-1">South America (São Paulo)</option>
              </select>
              {errors['credentials.region'] && (
                <span className="form__error">{errors['credentials.region']}</span>
              )}
            </div>
          </>
        );
      
      case 'azure':
        return (
          <>
            <div className="form__group">
              <label htmlFor="credentials.clientId" className="form__label">Client ID</label>
              <input
                type="text"
                id="credentials.clientId"
                name="credentials.clientId"
                className="form__input"
                value={formData.credentials.clientId || ''}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <div className="form__group">
              <label htmlFor="credentials.clientSecret" className="form__label">Client Secret</label>
              <input
                type="password"
                id="credentials.clientSecret"
                name="credentials.clientSecret"
                className="form__input"
                value={formData.credentials.clientSecret || ''}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <div className="form__group">
              <label htmlFor="credentials.tenantId" className="form__label">Tenant ID</label>
              <input
                type="text"
                id="credentials.tenantId"
                name="credentials.tenantId"
                className="form__input"
                value={formData.credentials.tenantId || ''}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <div className="form__group">
              <label htmlFor="credentials.subscriptionId" className="form__label">Subscription ID</label>
              <input
                type="text"
                id="credentials.subscriptionId"
                name="credentials.subscriptionId"
                className="form__input"
                value={formData.credentials.subscriptionId || ''}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </>
        );
      
      case 'gcp':
        return (
          <>
            <div className="form__group">
              <label htmlFor="credentials.projectId" className="form__label">Project ID</label>
              <input
                type="text"
                id="credentials.projectId"
                name="credentials.projectId"
                className="form__input"
                value={formData.credentials.projectId || ''}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <div className="form__group">
              <label htmlFor="credentials.keyFile" className="form__label">Service Account Key (JSON)</label>
              <textarea
                id="credentials.keyFile"
                name="credentials.keyFile"
                className="form__input"
                rows="5"
                value={formData.credentials.keyFile || ''}
                onChange={handleChange}
                disabled={loading}
                placeholder="Paste the contents of your service account key JSON file"
              />
            </div>
          </>
        );
      
      case 'vmware':
        return (
          <>
            <div className="form__group">
              <label htmlFor="credentials.host" className="form__label">vCenter Server / ESXi Host</label>
              <input
                type="text"
                id="credentials.host"
                name="credentials.host"
                className="form__input"
                value={formData.credentials.host || ''}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <div className="form__group">
              <label htmlFor="credentials.username" className="form__label">Username</label>
              <input
                type="text"
                id="credentials.username"
                name="credentials.username"
                className="form__input"
                value={formData.credentials.username || ''}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <div className="form__group">
              <label htmlFor="credentials.password" className="form__label">Password</label>
              <input
                type="password"
                id="credentials.password"
                name="credentials.password"
                className="form__input"
                value={formData.credentials.password || ''}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <form className="provider-form" onSubmit={handleSubmit}>
      <h2 className="provider-form__title">Add New Provider</h2>
      
      <div className="form__group">
        <label htmlFor="name" className="form__label">Provider Name</label>
        <input
          type="text"
          id="name"
          name="name"
          className={`form__input ${errors.name ? 'has-error' : ''}`}
          placeholder="My AWS Account"
          value={formData.name}
          onChange={handleChange}
          disabled={loading}
        />
        {errors.name && <span className="form__error">{errors.name}</span>}
      </div>
      
      <div className="form__group">
        <label htmlFor="type" className="form__label">Provider Type</label>
        <select
          id="type"
          name="type"
          className={`form__input ${errors.type ? 'has-error' : ''}`}
          value={formData.type}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="aws">Amazon Web Services (AWS)</option>
          <option value="azure">Microsoft Azure</option>
          <option value="gcp">Google Cloud Platform (GCP)</option>
          <option value="vmware">VMware</option>
        </select>
        {errors.type && <span className="form__error">{errors.type}</span>}
      </div>
      
      <div className="provider-form__credentials">
        <h3 className="provider-form__section-title">Credentials</h3>
        {renderCredentialsFields()}
      </div>
      
      <div className="provider-form__actions">
        <button 
          type="button" 
          className="btn btn--outline-primary" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className={`btn btn--primary ${loading ? 'btn--loading' : ''}`}
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Provider'}
        </button>
      </div>
    </form>
  );
};

export default ProviderForm;