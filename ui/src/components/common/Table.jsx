// Table.jsx - Simplified version for development
import React from 'react';
import PropTypes from 'prop-types';
// import '../styles/components/Table.scss';

/**
 * Table component for displaying data in rows and columns
 * @param {array} columns - Array of column definitions
 * @param {array} dataSource - Array of data objects
 * @param {boolean} loading - Show loading state
 * @param {string} className - Additional class names
 */
const Table = ({
  columns = [],
  dataSource = [],
  loading = false,
  className = '',
  rowKey = 'id',
  size = 'default',
  bordered = false,
  striped = true,
  hover = true,
  emptyText = 'No data',
  onRowClick,
  ...rest
}) => {
  const baseClass = 'iw-table';
  const classes = [
    baseClass,
    `${baseClass}--${size}`,
    bordered ? `${baseClass}--bordered` : '',
    striped ? `${baseClass}--striped` : '',
    hover ? `${baseClass}--hover` : '',
    loading ? `${baseClass}--loading` : '',
    className
  ].filter(Boolean).join(' ');

  const handleRowClick = (record, index) => {
    if (onRowClick) {
      onRowClick(record, index);
    }
  };

  // Style definitions
  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    border: bordered ? '1px solid #ddd' : 'none',
    borderRadius: '4px',
    overflow: 'hidden'
  };

  const thStyle = {
    padding: size === 'small' ? '8px 12px' : size === 'large' ? '16px 24px' : '12px 16px',
    textAlign: 'left',
    backgroundColor: '#f5f5f5',
    borderBottom: '2px solid #ddd',
    fontWeight: 'bold',
    color: '#333'
  };

  const tdStyle = {
    padding: size === 'small' ? '8px 12px' : size === 'large' ? '16px 24px' : '12px 16px',
    borderBottom: '1px solid #eee',
    color: '#333'
  };

  const trStyle = hover ? {
    cursor: onRowClick ? 'pointer' : 'default',
    transition: 'background-color 0.2s'
  } : {};

  const loadingStyle = {
    opacity: 0.5,
    pointerEvents: 'none'
  };

  const loadingContainerStyle = {
    padding: '32px 16px',
    textAlign: 'center',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };

  const loadingSpinnerStyle = {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '2px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '50%',
    borderTopColor: '#2196F3',
    animation: 'spin 1s linear infinite'
  };

  const emptyStyle = {
    padding: '32px 16px',
    textAlign: 'center',
    color: '#666'
  };

  return (
    <div className={`${baseClass}-container`} style={{ overflowX: 'auto' }} {...rest}>
      <table className={classes} style={loading ? {...tableStyle, ...loadingStyle} : tableStyle}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key || column.dataIndex || index}
                className={column.className}
                style={{
                  ...thStyle,
                  width: column.width,
                  textAlign: column.align || 'left'
                }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={loadingContainerStyle}>
                <div style={loadingSpinnerStyle}></div>
                <span>Loading...</span>
              </td>
            </tr>
          ) : dataSource.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={emptyStyle}>
                {emptyText}
              </td>
            </tr>
          ) : (
            dataSource.map((record, rowIndex) => {
              const isEven = rowIndex % 2 === 0;
              const rowStyle = {
                ...trStyle,
                backgroundColor: striped && isEven ? '#f9f9f9' : 'transparent'
              };

              return (
                <tr
                  key={record[rowKey] || rowIndex}
                  style={rowStyle}
                  onClick={() => handleRowClick(record, rowIndex)}
                >
                  {columns.map((column, colIndex) => {
                    const value = record[column.dataIndex];
                    return (
                      <td
                        key={column.key || column.dataIndex || colIndex}
                        className={column.cellClassName}
                        style={{
                          ...tdStyle,
                          textAlign: column.align || 'left'
                        }}
                      >
                        {column.render
                          ? column.render(value, record, rowIndex)
                          : value}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.node,
      dataIndex: PropTypes.string,
      key: PropTypes.string,
      render: PropTypes.func,
      width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      align: PropTypes.oneOf(['left', 'center', 'right']),
      className: PropTypes.string,
      cellClassName: PropTypes.string
    })
  ),
  dataSource: PropTypes.array,
  loading: PropTypes.bool,
  className: PropTypes.string,
  rowKey: PropTypes.string,
  size: PropTypes.oneOf(['small', 'default', 'large']),
  bordered: PropTypes.bool,
  striped: PropTypes.bool,
  hover: PropTypes.bool,
  emptyText: PropTypes.node,
  onRowClick: PropTypes.func
};

export default Table;