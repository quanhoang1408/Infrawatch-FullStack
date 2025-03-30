// Search.jsx
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import '../styles/components/Search.scss';
import useDebounce from '../../hooks/useDebounce';

/**
 * Search component with debounce functionality
 * @param {function} onSearch - Called when search input changes
 * @param {string} placeholder - Placeholder text
 * @param {number} debounceTime - Debounce delay in milliseconds
 * @param {string} className - Additional class names
 * @param {string} defaultValue - Initial search value
 */
const Search = ({
  onSearch,
  placeholder = 'Search...',
  debounceTime = 300,
  className = '',
  defaultValue = '',
  ...rest
}) => {
  const [query, setQuery] = useState(defaultValue);
  const debouncedQuery = useDebounce(query, debounceTime);
  const inputRef = useRef(null);

  const baseClass = 'iw-search';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  useEffect(() => {
    onSearch?.(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className={classes} {...rest}>
      <div className={`${baseClass}__icon`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm0-2a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm10 4l-3.5-3.5-1.4 1.4L19 21l3-3z" />
        </svg>
      </div>
      <input
        type="text"
        className={`${baseClass}__input`}
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        ref={inputRef}
      />
      {query && (
        <button className={`${baseClass}__clear`} onClick={handleClear} aria-label="Clear search">
          &times;
        </button>
      )}
    </div>
  );
};

Search.propTypes = {
  onSearch: PropTypes.func,
  placeholder: PropTypes.string,
  debounceTime: PropTypes.number,
  className: PropTypes.string,
  defaultValue: PropTypes.string
};

export default Search;