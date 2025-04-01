// VMDetailHeader.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '../common';
import VMStatusBadge from './VMStatusBadge';
import VMActions from './VMActions';

/**
 * Header for VM detail page
 * @param {object} vm - Virtual machine object
 * @param {boolean} loading - Loading state
 * @param {function} onActionClick - Handler for action clicks
 * @param {function} onBackClick - Handler for back button click
 */
const VMDetailHeader = ({
  vm,
  loading = false,
  onActionClick,
  onBackClick,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-vm-detail-header';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  if (!vm && !loading) {
    return null;
  }
  
  return (
    <div className={classes} {...rest}>
      <div className={`${baseClass}__back`}>
        <Button
          variant="text"
          icon={<i className="icon-arrow-left" />}
          onClick={onBackClick}
        >
          Back to VM List
        </Button>
      </div>
      
      {vm && (
        <div className={`${baseClass}__content`}>
          <div className={`${baseClass}__info`}>
            <h1 className={`${baseClass}__name`}>{vm.name}</h1>
            
            <div className={`${baseClass}__meta`}>
              <VMStatusBadge status={vm.status} />
              <span className={`${baseClass}__id`}>ID: {vm.id}</span>
              {vm.ipAddress && (
                <span className={`${baseClass}__ip`}>IP: {vm.ipAddress}</span>
              )}
            </div>
          </div>
          
          <div className={`${baseClass}__actions`}>
            <Button
              variant="primary"
              icon={<i className="icon-terminal" />}
              disabled={vm.status !== 'running'}
              onClick={() => onActionClick?.('ssh', vm)}
            >
              SSH Connect
            </Button>
            
            <div className={`${baseClass}__vm-actions`}>
              <VMActions
                vm={vm}
                onActionClick={onActionClick}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

VMDetailHeader.propTypes = {
  vm: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    ipAddress: PropTypes.string
  }),
  loading: PropTypes.bool,
  onActionClick: PropTypes.func,
  onBackClick: PropTypes.func,
  className: PropTypes.string
};

export default VMDetailHeader;