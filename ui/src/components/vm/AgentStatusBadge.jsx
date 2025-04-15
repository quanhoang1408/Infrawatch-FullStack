import React from 'react';
import PropTypes from 'prop-types';
import './AgentStatusBadge.scss';

/**
 * Component to display the connection status of the agent
 * @param {boolean} connected - Whether the agent is connected
 * @returns {JSX.Element} Badge showing agent status
 */
const AgentStatusBadge = ({ connected }) => {
  const statusClass = connected ? 'agent-status-badge--connected' : 'agent-status-badge--disconnected';
  const statusText = connected ? 'Connected' : 'Disconnected';

  return (
    <div className={`agent-status-badge ${statusClass}`}>
      <div className="agent-status-badge__indicator"></div>
      <span className="agent-status-badge__text">{statusText}</span>
    </div>
  );
};

AgentStatusBadge.propTypes = {
  connected: PropTypes.bool.isRequired
};

export default AgentStatusBadge;