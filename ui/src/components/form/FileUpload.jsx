// FileUpload.jsx
import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '../common';

/**
 * File upload component
 * @param {function} onChange - Change handler
 * @param {array} accept - Accepted file types
 * @param {boolean} multiple - Whether multiple files can be uploaded
 * @param {number} maxSize - Maximum file size in bytes
 * @param {string} dropzoneText - Text to display in the dropzone
 * @param {boolean} disabled - Whether the uploader is disabled
 */
const FileUpload = ({
  onChange,
  accept = [],
  multiple = false,
  maxSize = 5 * 1024 * 1024, // 5MB
  dropzoneText = 'Drag & drop files here, or click to select',
  disabled = false,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-file-upload';
  const classes = [
    baseClass,
    disabled ? `${baseClass}--disabled` : '',
    className
  ].filter(Boolean).join(' ');
  
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Validate files
  const validateFiles = (fileList) => {
    const newErrors = [];
    const validFiles = [];
    
    Array.from(fileList).forEach(file => {
      // Check file type
      if (accept.length > 0 && !accept.some(type => file.type.includes(type))) {
        newErrors.push(`${file.name}: Invalid file type`);
        return;
      }
      
      // Check file size
      if (file.size > maxSize) {
        newErrors.push(`${file.name}: File size exceeds ${formatFileSize(maxSize)}`);
        return;
      }
      
      validFiles.push(file);
    });
    
    return { validFiles, errors: newErrors };
  };
  
  // Handle file input change
  const handleFileInputChange = (e) => {
    if (disabled) return;
    
    const { validFiles, errors } = validateFiles(e.target.files);
    
    setFiles(prev => multiple ? [...prev, ...validFiles] : validFiles);
    setErrors(errors);
    
    if (validFiles.length > 0) {
      onChange?.(multiple ? validFiles : validFiles[0]);
    }
  };
  
  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    setIsDragging(false);
    
    const { validFiles, errors } = validateFiles(e.dataTransfer.files);
    
    setFiles(prev => multiple ? [...prev, ...validFiles] : validFiles);
    setErrors(errors);
    
    if (validFiles.length > 0) {
      onChange?.(multiple ? validFiles : validFiles[0]);
    }
  };
  
  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!disabled) {
      setIsDragging(true);
    }
  };
  
  // Handle drag leave
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(false);
  };
  
  // Handle click on dropzone
  const handleDropzoneClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle file removal
  const handleRemoveFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    
    setFiles(newFiles);
    onChange?.(multiple ? newFiles : newFiles[0] || null);
  };
  
  // Handle clear all files
  const handleClearFiles = () => {
    setFiles([]);
    setErrors([]);
    onChange?.(multiple ? [] : null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={classes} {...rest}>
      <input
        ref={fileInputRef}
        type="file"
        className={`${baseClass}__input`}
        accept={accept.join(',')}
        multiple={multiple}
        onChange={handleFileInputChange}
        disabled={disabled}
      />
      
      <div
        className={`
          ${baseClass}__dropzone
          ${isDragging ? `${baseClass}__dropzone--dragging` : ''}
        `}
        onClick={handleDropzoneClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`${baseClass}__dropzone-content`}>
          <i className="icon-upload" />
          <div className={`${baseClass}__dropzone-text`}>
            {dropzoneText}
          </div>
          <div className={`${baseClass}__dropzone-info`}>
            {accept.length > 0 && (
              <div>Accepted formats: {accept.join(', ')}</div>
            )}
            <div>Maximum size: {formatFileSize(maxSize)}</div>
          </div>
        </div>
      </div>
      
      {errors.length > 0 && (
        <div className={`${baseClass}__errors`}>
          {errors.map((error, index) => (
            <div key={`error-${index}`} className={`${baseClass}__error`}>
              <i className="icon-alert-circle" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}
      
      {files.length > 0 && (
        <div className={`${baseClass}__file-list`}>
          <div className={`${baseClass}__file-list-header`}>
            <div className={`${baseClass}__file-count`}>
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </div>
            {multiple && (
              <Button
                variant="text"
                size="sm"
                icon={<i className="icon-trash-2" />}
                onClick={handleClearFiles}
              >
                Clear All
              </Button>
            )}
          </div>
          
          <ul className={`${baseClass}__files`}>
            {files.map((file, index) => (
              <li key={`file-${index}`} className={`${baseClass}__file`}>
                <div className={`${baseClass}__file-icon`}>
                  <i className="icon-file" />
                </div>
                
                <div className={`${baseClass}__file-info`}>
                  <div className={`${baseClass}__file-name`}>{file.name}</div>
                  <div className={`${baseClass}__file-size`}>
                    {formatFileSize(file.size)}
                  </div>
                </div>
                
                <Button
                  variant="text"
                  size="sm"
                  icon={<i className="icon-x" />}
                  onClick={() => handleRemoveFile(index)}
                  className={`${baseClass}__file-remove`}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

FileUpload.propTypes = {
  onChange: PropTypes.func,
  accept: PropTypes.arrayOf(PropTypes.string),
  multiple: PropTypes.bool,
  maxSize: PropTypes.number,
  dropzoneText: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

export default FileUpload;