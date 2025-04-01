// VMCardInfo.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '../common';
import VMStatusBadge from './VMStatusBadge';
import VMTypeTag from './VMTypeTag';
import ProviderIcon from './ProviderIcon';

/**
 * Card displaying VM information
 * @param {object} vm - Virtual machine object
 * @param {boolean} loading - Loading state
 */
const VMCardInfo = ({
  vm,
  loading = false,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-vm-card-info';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  if (!vm && !loading) {
    return null;
  }
  
  // Format creation date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <Card
      title="VM Information"
      className={classes}
      loading={loading}
      {...rest}
    >
      {vm && (
        <div className={`${baseClass}__content`}>
          <div className={`${baseClass}__header`}>
            <div className={`${baseClass}__provider`}>
              <ProviderIcon provider={vm.provider} size="lg" />
              <span>{vm.provider.toUpperCase()}</span>
            </div>
            
            <div className={`${baseClass}__status`}>
              <VMStatusBadge status={vm.status} />
            </div>
          </div>
          
          <div className={`${baseClass}__info-grid`}>
            <div className={`${baseClass}__info-item`}>
              <div className={`${baseClass}__info-label`}>Name</div>
              <div className={`${baseClass}__info-value`}>{vm.name}</div>
            </div>
            
            <div className={`${baseClass}__info-item`}>
              <div className={`${baseClass}__info-label`}>ID</div>
              <div className={`${baseClass}__info-value ${baseClass}__info-id`}>{vm.id}</div>
            </div>
            
            <div className={`${baseClass}__info-item`}>
              <div className={`${baseClass}__info-label`}>Type</div>
              <div className={`${baseClass}__info-value`}>
                <VMTypeTag type={vm.type} />
              </div>
            </div>
            
            <div className={`${baseClass}__info-item`}>
              <div className={`${baseClass}__info-label`}>IP Address</div>
              <div className={`${baseClass}__info-value`}>{vm.ipAddress || 'N/A'}</div>
            </div>
            
            <div className={`${baseClass}__info-item`}>
              <div className={`${baseClass}__info-label`}>Region</div>
              <div className={`${baseClass}__info-value`}>{vm.region || 'N/A'}</div>
            </div>
            
            <div className={`${baseClass}__info-item`}>
              <div className={`${baseClass}__info-label`}>Created</div>
              <div className={`${baseClass}__info-value`}>{formatDate(vm.createdAt)}</div>
            </div>
            
            <div className={`${baseClass}__info-item`}>
              <div className={`${baseClass}__info-label`}>Last Modified</div>
              <div className={`${baseClass}__info-value`}>{formatDate(vm.updatedAt)}</div>
            </div>
            
            <div className={`${baseClass}__info-item`}>
              <div className={`${baseClass}__info-label`}>Operating System</div>
              <div className={`${baseClass}__info-value`}>{vm.os || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

VMCardInfo.propTypes = {
  vm: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    provider: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    ipAddress: PropTypes.string,
    region: PropTypes.string,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    os: PropTypes.string
  }),
  loading: PropTypes.bool,
  className: PropTypes.string
};

export default VMCardInfo;