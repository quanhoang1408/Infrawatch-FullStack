import React, { useState } from 'react';

const RegisterForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Remove confirmPassword before submission
      const { confirmPassword, ...registerData } = formData;
      onSubmit(registerData);
    }
  };
  
  return (
    <form className="register-form" onSubmit={handleSubmit}>
      <div className="form__group">
        <label htmlFor="name" className="form__label">Full Name</label>
        <input
          type="text"
          id="name"
          name="name"
          className={`form__input ${errors.name ? 'has-error' : ''}`}
          placeholder="Enter your full name"
          value={formData.name}
          onChange={handleChange}
          disabled={loading}
          autoComplete="name"
        />
        {errors.name && <span className="form__error">{errors.name}</span>}
      </div>
      
      <div className="form__group">
        <label htmlFor="email" className="form__label">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          className={`form__input ${errors.email ? 'has-error' : ''}`}
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          autoComplete="email"
        />
        {errors.email && <span className="form__error">{errors.email}</span>}
      </div>
      
      <div className="form__group">
        <label htmlFor="password" className="form__label">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          className={`form__input ${errors.password ? 'has-error' : ''}`}
          placeholder="Create a password"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          autoComplete="new-password"
        />
        {errors.password && <span className="form__error">{errors.password}</span>}
        <span className="form__hint">Password must be at least 8 characters long</span>
      </div>
      
      <div className="form__group">
        <label htmlFor="confirmPassword" className="form__label">Confirm Password</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          className={`form__input ${errors.confirmPassword ? 'has-error' : ''}`}
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={loading}
          autoComplete="new-password"
        />
        {errors.confirmPassword && <span className="form__error">{errors.confirmPassword}</span>}
      </div>
      
      <div className="form__group form__check">
        <input
          type="checkbox"
          id="terms"
          name="terms"
          className="form__checkbox"
          required
        />
        <label htmlFor="terms">I agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a></label>
      </div>
      
      <button
        type="submit"
        className={`btn btn--primary btn--block ${loading ? 'btn--loading' : ''}`}
        disabled={loading}
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
};

export default RegisterForm;