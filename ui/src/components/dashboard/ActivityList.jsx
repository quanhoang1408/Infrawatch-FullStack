// ActivityList.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card, Spinner, EmptyState, Button } from '../common';
import './ActivityList.scss';

/**
 * Component to display a list of recent system activities
 * @param {array} activities - List of activity objects
 * @param {boolean} loading - Loading state
 * @param {boolean} showAll - Show "View all" button
 * @param {function} onViewAll - Handler for "View all" button
 * @param {function} onActivityClick - Click handler for individual activities
 */
const ActivityList = ({
  activities = [],
  loading = false,
  showAll = true,
  onViewAll,
  onActivityClick,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-activity-list';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  // Helper to format time display (e.g., "2 hours ago")
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) return `${diffDay}d ago`;
    if (diffHour > 0) return `${diffHour}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return 'Just now';
  };
  
  // Get activity icon based on type
  const getActivityIcon = (type) => {
    const icons = {
      'create': 'icon-plus-circle',
      'delete': 'icon-trash',
      'update': 'icon-edit',
      'start': 'icon-play-circle',
      'stop': 'icon-stop-circle',
      'restart': 'icon-refresh',
      'login': 'icon-login',
      'logout': 'icon-logout',
      'error': 'icon-alert-circle'
    };
    
    return icons[type] || 'icon-info-circle';
  };
  
  // Get activity icon color based on type
  const getActivityColor = (type) => {
    const colors = {
      'create': 'var(--color-success)',
      'delete': 'var(--color-error)',
      'update': 'var(--color-warning)',
      'start': 'var(--color-success)',
      'stop': 'var(--color-warning)',
      'restart': 'var(--color-info)',
      'login': 'var(--color-info)',
      'logout': 'var(--color-info)',
      'error': 'var(--color-error)'
    };
    
    return colors[type] || 'var(--text-color-secondary)';
  };
  
  return (
    <Card 
      title="Recent Activity"
      className={classes}
      loading={loading}
      actions={showAll && onViewAll && (
        <Button 
          variant="text" 
          size="sm" 
          onClick={onViewAll}
        >
          View all
        </Button>
      )}
      {...rest}
    >
      <div className={`${baseClass}__content`}>
        {loading ? (
          <div className={`${baseClass}__loading`}>
            <Spinner size="md" />
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            title="No recent activity"
            description="Activity logs will appear here as you use the system."
            icon={<i className="icon-activity" />}
          />
        ) : (
          <ul className={`${baseClass}__items`}>
            {activities.map((activity) => (
              <li 
                key={activity.id} 
                className={`${baseClass}__item`}
                onClick={() => onActivityClick && onActivityClick(activity)}
              >
                <div 
                  className={`${baseClass}__icon`}
                  style={{ backgroundColor: getActivityColor(activity.type) }}
                >
                  <i className={getActivityIcon(activity.type)} />
                </div>
                
                <div className={`${baseClass}__details`}>
                  <div className={`${baseClass}__message`}>
                    {activity.message}
                  </div>
                  
                  <div className={`${baseClass}__meta`}>
                    {activity.user && (
                      <span className={`${baseClass}__user`}>
                        {activity.user}
                      </span>
                    )}
                    
                    <span className={`${baseClass}__time`}>
                      {formatTime(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
};

ActivityList.propTypes = {
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      type: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]).isRequired,
      user: PropTypes.string
    })
  ),
  loading: PropTypes.bool,
  showAll: PropTypes.bool,
  onViewAll: PropTypes.func,
  onActivityClick: PropTypes.func,
  className: PropTypes.string
};

export default ActivityList;