import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import './NotFound.scss';

/**
 * Not found page component
 */
const NotFound = () => {
  const navigate = useNavigate();

  // Handle back button click
  const handleBack = () => {
    navigate(-1);
  };

  // Handle home button click
  const handleHome = () => {
    navigate('/');
  };

  return (
    <div className="not-found-container">
      <Result
        status="404"
        title="404"
        subTitle="Xin lỗi, trang bạn truy cập không tồn tại."
        extra={[
          <Button type="primary" key="home" onClick={handleHome}>
            Trang chủ
          </Button>,
          <Button key="back" onClick={handleBack}>
            Quay lại
          </Button>,
        ]}
      />
    </div>
  );
};

export default NotFound;