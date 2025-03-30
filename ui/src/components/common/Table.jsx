// Table.jsx
import React from 'react';
import PropTypes from 'prop-types';
import '../styles/components/Table.scss';

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

  return (
    <div className={`${baseClass}-container`} {...rest}>
      <table className={classes}>
        <thead className={`${baseClass}__header`}>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key || column.dataIndex || index}
                className={column.className}
                style={{ 
                  width: column.width,
                  textAlign: column.align || 'left'
                }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`${baseClass}__body`}>
          {loading ? (
            <tr className={`${baseClass}__loading-row`}>
              <td colSpan={columns.length}>
                <div className={`${baseClass}__loading-indicator`}>
                  <div className={`${baseClass}__loading-spinner`}></div>
                  <span>Loading...</span>
                </div>
              </td>
            </tr>
          ) : dataSource.length === 0 ? (
            <tr className={`${baseClass}__empty-row`}>
              <td colSpan={columns.length}>
                <div className={`${baseClass}__empty-text`}>{emptyText}</div>
              </td>
            </tr>
          ) : (
            dataSource.map((record, rowIndex) => (
              <tr
                key={record[rowKey] || rowIndex}
                className={`${baseClass}__row`}
                onClick={() => handleRowClick(record, rowIndex)}
              >
                {columns.map((column, colIndex) => {
                  const value = record[column.dataIndex];
                  return (
                    <td
                      key={column.key || column.dataIndex || colIndex}
                      className={column.cellClassName}
                      style={{ textAlign: column.align || 'left' }}
                    >
                      {column.render
                        ? column.render(value, record, rowIndex)
                        : value}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
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