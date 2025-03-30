/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} - True if email is valid
 */
export const isValidEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };
  
  /**
   * Validate phone number
   * @param {string} phone - Phone to validate
   * @returns {boolean} - True if phone is valid
   */
  export const isValidPhone = (phone) => {
    // Simple validation for Vietnamese phone numbers
    const re = /^(0|\+84)(\d{9,10})$/;
    return re.test(String(phone));
  };
  
  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} - Validation result with score and feedback
   */
  export const validatePasswordStrength = (password) => {
    if (!password) {
      return {
        score: 0,
        feedback: {
          warning: 'Mật khẩu không được để trống',
          suggestions: ['Nhập mật khẩu']
        }
      };
    }
    
    let score = 0;
    const feedback = {
      warning: '',
      suggestions: []
    };
    
    // Length check
    if (password.length < 8) {
      feedback.warning = 'Mật khẩu quá ngắn';
      feedback.suggestions.push('Mật khẩu nên có ít nhất 8 ký tự');
    } else {
      score += 1;
    }
    
    // Check for mixed case
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) {
      score += 1;
    } else {
      feedback.suggestions.push('Thêm chữ hoa và chữ thường');
    }
    
    // Check for numbers
    if (password.match(/\d/)) {
      score += 1;
    } else {
      feedback.suggestions.push('Thêm số');
    }
    
    // Check for special characters
    if (password.match(/[^a-zA-Z\d]/)) {
      score += 1;
    } else {
      feedback.suggestions.push('Thêm ký tự đặc biệt');
    }
    
    // Set the main warning based on score
    if (score < 2) {
      feedback.warning = 'Mật khẩu yếu';
    } else if (score < 4) {
      feedback.warning = 'Mật khẩu trung bình';
    }
    
    return {
      score,
      feedback
    };
  };
  
  /**
   * Validate URL
   * @param {string} url - URL to validate
   * @returns {boolean} - True if URL is valid
   */
  export const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  /**
   * Validate IP address
   * @param {string} ip - IP to validate
   * @returns {boolean} - True if IP is valid
   */
  export const isValidIp = (ip) => {
    // IPv4 validation
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipv4Match = ip.match(ipv4Pattern);
    
    if (ipv4Match) {
      return ipv4Match.slice(1).every(octet => {
        const num = parseInt(octet, 10);
        return num >= 0 && num <= 255;
      });
    }
    
    // Simple IPv6 validation (not comprehensive)
    const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv6Pattern.test(ip);
  };
  
  /**
   * Form validation rules for Ant Design Form
   */
  export const validationRules = {
    required: { required: true, message: 'Trường này là bắt buộc' },
    email: { type: 'email', message: 'Email không hợp lệ' },
    phone: { 
      pattern: /^(0|\+84)(\d{9,10})$/,
      message: 'Số điện thoại không hợp lệ' 
    },
    username: {
      pattern: /^[a-zA-Z0-9_]{3,20}$/,
      message: 'Tên đăng nhập phải có 3-20 ký tự, chỉ gồm chữ cái, số và dấu gạch dưới'
    },
    password: { 
      min: 8, 
      message: 'Mật khẩu phải có ít nhất 8 ký tự'
    },
    url: { 
      type: 'url', 
      message: 'URL không hợp lệ' 
    },
    ip: {
      validator: (_, value) => {
        if (!value) return Promise.resolve();
        return isValidIp(value) 
          ? Promise.resolve() 
          : Promise.reject(new Error('Địa chỉ IP không hợp lệ'));
      }
    }
  };