import React from 'react';
import { 
  Typography, 
  Form, 
  Switch, 
  Select, 
  Button, 
  Divider, 
  message, 
  Card, 
  Space, 
  Radio 
} from 'antd';
import { 
  BulbOutlined, 
  BellOutlined, 
  GlobalOutlined, 
  ClockCircleOutlined 
} from '@ant-design/icons';
import useTheme from '../../hooks/useTheme';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

/**
 * General settings component
 */
const GeneralSettings = () => {
  const { theme, toggleTheme } = useTheme();
  const [form] = Form.useForm();
  
  // Save settings handler
  const handleSaveSettings = (values) => {
    console.log('Settings:', values);
    message.success('Cài đặt đã được lưu');
  };
  
  return (
    <div className="general-settings">
      <Title level={2}>Cài đặt chung</Title>
      
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          theme: theme,
          language: 'vi',
          notifications: true,
          notificationSound: true,
          refreshInterval: 30,
          timezone: 'Asia/Ho_Chi_Minh'
        }}
        onFinish={handleSaveSettings}
      >
        <div className="settings-section">
          <Title level={4} className="section-title">Giao diện</Title>
          
          <Form.Item
            name="theme"
            label={
              <Space>
                <BulbOutlined />
                <span>Chế độ hiển thị</span>
              </Space>
            }
          >
            <Radio.Group onChange={(e) => toggleTheme()}>
              <Radio.Button value="light">Sáng</Radio.Button>
              <Radio.Button value="dark">Tối</Radio.Button>
              <Radio.Button value="auto">Tự động</Radio.Button>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item
            name="language"
            label={
              <Space>
                <GlobalOutlined />
                <span>Ngôn ngữ</span>
              </Space>
            }
          >
            <Select>
              <Option value="vi">Tiếng Việt</Option>
              <Option value="en">English</Option>
            </Select>
          </Form.Item>
        </div>
        
        <Divider />
        
        <div className="settings-section">
          <Title level={4} className="section-title">Thông báo</Title>
          
          <Form.Item
            name="notifications"
            label={
              <Space>
                <BellOutlined />
                <span>Hiển thị thông báo</span>
              </Space>
            }
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          <Form.Item
            name="notificationSound"
            label="Âm thanh thông báo"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </div>
        
        <Divider />
        
        <div className="settings-section">
          <Title level={4} className="section-title">Dữ liệu & Hiển thị</Title>
          
          <Form.Item
            name="refreshInterval"
            label={
              <Space>
                <ClockCircleOutlined />
                <span>Tự động làm mới dữ liệu (giây)</span>
              </Space>
            }
          >
            <Select>
              <Option value={0}>Không tự động</Option>
              <Option value={10}>10 giây</Option>
              <Option value={30}>30 giây</Option>
              <Option value={60}>1 phút</Option>
              <Option value={300}>5 phút</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="timezone"
            label="Múi giờ"
          >
            <Select showSearch>
              <Option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</Option>
              <Option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</Option>
              <Option value="Asia/Singapore">Asia/Singapore (GMT+8)</Option>
              <Option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</Option>
              <Option value="Europe/London">Europe/London (GMT+0)</Option>
              <Option value="America/New_York">America/New_York (GMT-5)</Option>
              <Option value="UTC">UTC</Option>
            </Select>
          </Form.Item>
        </div>
        
        <Divider />
        
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Lưu cài đặt
          </Button>
        </Form.Item>
      </Form>
      
      <Card title="Thông tin phiên bản" style={{ marginTop: 24 }}>
        <Text strong>Infrawatch v1.0.0</Text>
        <Paragraph type="secondary" style={{ marginTop: 8 }}>
          Hệ thống quản lý máy ảo tập trung, hỗ trợ quản lý trên nhiều nền tảng 
          đám mây như AWS, Azure, Google Cloud, cũng như các hệ thống tại chỗ như VMWare.
        </Paragraph>
      </Card>
    </div>
  );
};

export default GeneralSettings;