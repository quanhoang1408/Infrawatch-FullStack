# SSH Troubleshooting Guide

Hướng dẫn này giúp bạn khắc phục các vấn đề với kết nối SSH trong hệ thống Infrawatch.

## Vấn đề

Khi nhấn nút "Terminal SSH" trong UI, kết nối SSH thất bại với lỗi:
```
All configured authentication methods failed
```

Lỗi này xảy ra khi không có phương thức xác thực nào thành công, có thể do:
1. Định dạng private key hoặc certificate không đúng
2. VM không được cấu hình để tin tưởng Vault CA
3. Vault không được cấu hình đúng để ký certificate

## Các script chẩn đoán

Chúng tôi đã tạo một số script để giúp chẩn đoán và sửa lỗi:

### 1. Kiểm tra định dạng SSH key và certificate

Script này kiểm tra xem các key và certificate có đúng định dạng không:

```bash
cd server
node test-ssh-format.js
```

### 2. Kiểm tra kết nối SSH với các phương thức khác nhau

Script này thử kết nối SSH với VM bằng các phương thức xác thực khác nhau:

```bash
cd server
# Cập nhật thông tin VM
export VM_IP=54.197.5.26
export SSH_USER=ubuntu
export SSH_PASSWORD=your_password
node test-ssh-connection.js
```

### 3. Kiểm tra cấu hình Vault

Script này kiểm tra xem Vault có được cấu hình đúng để ký certificate không:

```bash
cd server
node test-vault-config.js
```

### 4. Kiểm tra cấu hình VM

Script này kiểm tra xem VM có được cấu hình để tin tưởng Vault CA không:

```bash
cd server
# Cập nhật thông tin VM
export VM_IP=54.197.5.26
export SSH_USER=ubuntu
export SSH_PASSWORD=your_password
node test-vm-ca-config.js
```

## Các giải pháp

### 1. Sửa định dạng certificate và private key

Chạy script sửa lỗi tự động:

```bash
cd server
node fix-ssh-certificate.js
```

### 2. Thử nghiệm với các phương thức xác thực khác

Bạn có thể tạm thời vô hiệu hóa xác thực certificate và sử dụng private key hoặc password:

```bash
# Vô hiệu hóa certificate authentication
export DISABLE_CERT_AUTH=true
# Hoặc sử dụng password authentication
export USE_PASSWORD_AUTH=true
# Khởi động lại server
pm2 restart server
```

### 3. Cấu hình VM để tin tưởng Vault CA

Để VM tin tưởng certificate từ Vault CA, bạn cần:

1. Lấy public key của Vault CA:
```bash
cd server
node -e "require('./src/services/vault-ssh.service').getCAPublicKey().then(key => console.log(key))"
```

2. Thêm public key vào file trusted-user-ca-keys.pem trên VM:
```bash
# Trên VM
sudo mkdir -p /etc/ssh
sudo bash -c 'echo "CA_PUBLIC_KEY" > /etc/ssh/trusted-user-ca-keys.pem'
```

3. Cấu hình SSH server để sử dụng CA:
```bash
# Thêm vào /etc/ssh/sshd_config
TrustedUserCAKeys /etc/ssh/trusted-user-ca-keys.pem
```

4. Khởi động lại SSH server:
```bash
sudo systemctl restart sshd
```

## Kiểm tra lại

Sau khi áp dụng các giải pháp, hãy thử lại tính năng Terminal SSH trong UI.

## Ghi chú bổ sung

- Nếu bạn vẫn gặp vấn đề, hãy kiểm tra log của server để biết thêm chi tiết:
```bash
pm2 logs server
```

- Đảm bảo rằng agent đã được cài đặt và chạy trên VM để cập nhật SSH key khi cần thiết.

- Nếu bạn muốn sử dụng password authentication thay vì certificate, hãy đảm bảo rằng password được cấu hình đúng trong biến môi trường `SSH_DEFAULT_PASSWORD`.
