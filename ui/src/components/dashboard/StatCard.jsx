// StatCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '../common';
import SparklineChart from '../charts/SparklineChart';
import './StatCard.scss';

/**
 * Card component for displaying statistics on the dashboard
 * @param {string} title - Card title
 * @param {string|number} value - Main statistic value
 * @param {string} subtitle - Text below the value (e.g. description or unit)
 * @param {string} trend - Trend indicator ('up', 'down', 'neutral')
 * @param {string|number} trendValue - Value of the trend (e.g. '+15%')
 * @param {string} trendPeriod - Time period for the trend (e.g. 'vs last week')
 * @param {array} sparklineData - Data for sparkline chart
 * @param {node} icon - Icon to display
 * @param {string} iconColor - Color of the icon background
 * @param {function} onClick - Click handler for the card
 */
const StatCard = ({
  title,
  value,
  subtitle,
  trend = 'neutral',
  trendValue,
  trendPeriod,
  sparklineData,
  icon,
  iconColor,
  onClick,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-stat-card';
  const classes = [
    baseClass,
    onClick ? `${baseClass}--clickable` : '',
    className
  ].filter(Boolean).join(' ');
  
  // Determine trend class and icon
  const trendClass = `${baseClass}__trend--${trend}`;
  const trendIcon = {
    up: <i className="icon-trend-up" />,
    down: <i className="icon-trend-down" />,
    neutral: <i className="icon-trend-neutral" />
  }[trend];
  
  return (
    <Card
      className={classes}
      onClick={onClick}
      hoverable={!!onClick}
      {...rest}
    >
      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__header`}>
          <div className={`${baseClass}__title`}>{title}</div>
          {icon && (
            <div 
              className={`${baseClass}__icon`}
              style={{ backgroundColor: iconColor }}
            >
              {icon}
            </div>
          )}
        </div>
        
        <div className={`${baseClass}__value`}>{value}</div>
        
        {subtitle && (
          <div className={`${baseClass}__subtitle`}>{subtitle}</div>
        )}
        
        {(trendValue || sparklineData) && (
          <div className={`${baseClass}__footer`}>
            {trendValue && (
              <div className={`${baseClass}__trend-container`}>
                <div className={`${baseClass}__trend ${trendClass}`}>
                  {trendIcon}
                  <span>{trendValue}</span>
                </div>
                {trendPeriod && (
                  <div className={`${baseClass}__trend-period`}>
                    {trendPeriod}
                  </div>
                )}
              </div>
            )}
            
            {sparklineData && (
              <div className={`${baseClass}__sparkline`}>
                <SparklineChart
                  data={sparklineData}
                  showLastValue
                  color={
                    trend === 'up' ? '#2ca02c' : 
                    trend === 'down' ? '#d62728' : 
                    '#1f77b4'
                  }
                  fillBelow
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  trend: PropTypes.oneOf(['up', 'down', 'neutral']),
  trendValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  trendPeriod: PropTypes.string,
  sparklineData: PropTypes.array,
  icon: PropTypes.node,
  iconColor: PropTypes.string,
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default StatCard;