// ProviderDistribution.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '../common';
import { PieChart } from '../charts';
import ProviderIcon from '../vm/ProviderIcon';

/**
 * Chart showing distribution of VMs across cloud providers
 * @param {array} data - Provider distribution data
 * @param {boolean} loading - Loading state
 */
const ProviderDistribution = ({
  data = [],
  loading = false,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-provider-distribution';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  // Colors for different providers
  const providerColors = {
    aws: '#FF9900',     // AWS orange
    azure: '#0078D4',   // Azure blue
    gcp: '#4285F4',     // GCP blue
    vmware: '#607078',  // VMware gray
    other: '#6E6E6E'    // Gray for other providers
  };
  
  // Transform data to include provider colors and icons for the legend
  const chartData = data.map(item => ({
    name: item.name,
    value: item.value,
    color: providerColors[item.provider] || providerColors.other,
    icon: <ProviderIcon provider={item.provider} />
  }));
  
  // Custom legend renderer to show provider icons
  const legendFormatter = (entry) => {
    return (
      <div className={`${baseClass}__legend-item`}>
        {entry.icon && (
          <span className={`${baseClass}__legend-icon`}>
            {entry.icon}
          </span>
        )}
        <span>{entry.name}</span>
      </div>
    );
  };
  
  return (
    <Card
      title="Cloud Providers Distribution"
      className={classes}
      loading={loading}
      {...rest}
    >
      <div className={baseClass}>
        <PieChart
          data={chartData}
          nameKey="name"
          dataKey="value"
          donut
          loading={loading}
          height={250}
          tooltipFormatter={(value, name) => {
            return [`${value} instances`, name];
          }}
        />
      </div>
    </Card>
  );
};

ProviderDistribution.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      provider: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired
    })
  ),
  loading: PropTypes.bool,
  className: PropTypes.string
};

export default ProviderDistribution;