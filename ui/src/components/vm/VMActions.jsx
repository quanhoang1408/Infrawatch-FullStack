// VMActions.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Dropdown, Button, Tooltip } from '../common';
import './VMActions.scss';

/**
 * Component for VM action buttons (start, stop, etc.)
 * @param {object} vm - Virtual machine object
 * @param {function} onActionClick - Handler for action clicks
 */
const VMActions = ({
  vm,
  onActionClick,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-vm-actions';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  // Check if actions are disabled based on VM status
  const isRunning = vm.status === 'running';
  const isStopped = vm.status === 'stopped';
  const isCreating = vm.status === 'creating';
  const isTerminating = vm.status === 'terminating';
  
  // Disabled states for actions
  const disableStart = !isStopped || isCreating || isTerminating;
  const disableStop = !isRunning || isCreating || isTerminating;
  const disableRestart = !isRunning || isCreating || isTerminating;
  const disableTerminate = isCreating || isTerminating;
  
  // Handle action click
  const handleActionClick = (action) => {
    onActionClick?.(action, vm);
  };
  
  // Primary action button (varies based on VM state)
  const renderPrimaryAction = () => {
    if (isRunning) {
      return (
        <Tooltip content="Stop VM">
          <Button
            variant="text"
            size="sm"
            icon={<i className="icon-stop-circle" />}
            className={`${baseClass}__primary-action`}
            onClick={() => handleActionClick('stop')}
            disabled={disableStop}
          />
        </Tooltip>
      );
    }
    
    if (isStopped) {
      return (
        <Tooltip content="Start VM">
          <Button
            variant="text"
            size="sm"
            icon={<i className="icon-play-circle" />}
            className={`${baseClass}__primary-action`}
            onClick={() => handleActionClick('start')}
            disabled={disableStart}
          />
        </Tooltip>
      );
    }
    
    // For other states, show a disabled button
    return (
      <Tooltip content={`VM is ${vm.status}`}>
        <Button
          variant="text"
          size="sm"
          icon={<i className="icon-more-vertical" />}
          className={`${baseClass}__primary-action`}
          disabled
        />
      </Tooltip>
    );
  };
  
  // Dropdown menu for more actions
  const actionsMenu = (
    <>
      <Dropdown.Item
        onClick={() => handleActionClick('start')}
        disabled={disableStart}
      >
        <i className="icon-play-circle" />
        <span>Start</span>
      </Dropdown.Item>
      
      <Dropdown.Item
        onClick={() => handleActionClick('stop')}
        disabled={disableStop}
      >
        <i className="icon-stop-circle" />
        <span>Stop</span>
      </Dropdown.Item>
      
      <Dropdown.Item
        onClick={() => handleActionClick('restart')}
        disabled={disableRestart}
      >
        <i className="icon-refresh" />
        <span>Restart</span>
      </Dropdown.Item>
      
      <Dropdown.Divider />
      
      <Dropdown.Item
        onClick={() => handleActionClick('ssh')}
        disabled={!isRunning}
      >
        <i className="icon-terminal" />
        <span>SSH Connect</span>
      </Dropdown.Item>
      
      <Dropdown.Item
        onClick={() => handleActionClick('view')}
      >
        <i className="icon-eye" />
        <span>View Details</span>
      </Dropdown.Item>
      
      <Dropdown.Divider />
      
      <Dropdown.Item
        onClick={() => handleActionClick('terminate')}
        disabled={disableTerminate}
        className={`${baseClass}__terminate-action`}
      >
        <i className="icon-trash" />
        <span>Terminate</span>
      </Dropdown.Item>
    </>
  );
  
  return (
    <div className={classes} {...rest} onClick={(e) => e.stopPropagation()}>
      {renderPrimaryAction()}
      
      <Dropdown
        trigger={
          <Button
            variant="text"
            size="sm"
            icon={<i className="icon-more-vertical" />}
            className={`${baseClass}__more-action`}
          />
        }
        placement="bottom-right"
      >
        {actionsMenu}
      </Dropdown>
    </div>
  );
};

VMActions.propTypes = {
  vm: PropTypes.shape({
    id: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired
  }).isRequired,
  onActionClick: PropTypes.func,
  className: PropTypes.string
};

export default VMActions;