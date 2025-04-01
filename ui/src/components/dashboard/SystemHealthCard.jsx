// SystemHealthCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card, StatusBadge } from '../common';
import { GaugeChart } from '../charts';

/**
 * Card displaying system health metrics
 * @param {object} metrics - System health metrics
 * @param {boolean} loading - Loading state
 */
const SystemHealthCard = ({
  metrics = {
    score: 0,
    status: 'unknown',
    alerts: 0,
    warnings: 0
  },
  loading = false,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-system-health-card';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  // Determine status type for the badge
  const statusType = (() => {
    if (metrics.status === 'healthy') return 'success';
    if (metrics.status === 'warning') return 'warning';
    if (metrics.status === 'critical') return 'error';
    return 'default';
  })();
  
  // Gauge thresholds and colors
  const gaugeThresholds = [60, 80];
  const gaugeColors = ['#d62728', '#ff7f0e', '#2ca02c']; // Red, Orange, Green
  
  return (
    <Card
      title="System Health"
      className={classes}
      loading={loading}
      {...rest}
    >
      <div className={baseClass}>
        <div className={`${baseClass}__gauge`}>
          <GaugeChart
            value={metrics.score}
            min={0}
            max={100}
            thresholds={gaugeThresholds}
            colors={gaugeColors}
            label="Health Score"
            unit="%"
            loading={loading}
            height={160}
          />
        </div>
        
        <div className={`${baseClass}__metrics`}>
          <div className={`${baseClass}__metric`}>
            <div className={`${baseClass}__metric-label`}>Status</div>
            <StatusBadge
              status={metrics.status || 'Unknown'}
              type={statusType}
              className={`${baseClass}__status`}
            />
          </div>
          
          <div className={`${baseClass}__metric`}>
            <div className={`${baseClass}__metric-label`}>Active Alerts</div>
            <div className={`${baseClass}__metric-value ${metrics.alerts > 0 ? `${baseClass}__metric-value--error` : ''}`}>
              {metrics.alerts}
            </div>
          </div>
          
          <div className={`${baseClass}__metric`}>
            <div className={`${baseClass}__metric-label`}>Warnings</div>
            <div className={`${baseClass}__metric-value ${metrics.warnings > 0 ? `${baseClass}__metric-value--warning` : ''}`}>
              {metrics.warnings}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

SystemHealthCard.propTypes = {
  metrics: PropTypes.shape({
    score: PropTypes.number,
    status: PropTypes.string,
    alerts: PropTypes.number,
    warnings: PropTypes.number
  }),
  loading: PropTypes.bool,
  className: PropTypes.string
};

export default SystemHealthCard;