# Hướng dẫn cấu hình VM để tin tưởng Vault CA

Hướng dẫn này giúp bạn cấu hình VM để tin tưởng certificate được ký bởi Vault CA, cho phép xác thực SSH bằng certificate.

## Các bước thực hiện

### 1. Sao chép các script cần thiết lên VM

Sao chép các file sau từ server lên VM:

- `test-vm-ca-config-local.js`: Script kiểm tra cấu hình CA trên VM
- `fix-vm-ca-config.js`: Script sửa cấu hình CA trên VM

```bash
# Trên server
scp server/test-vm-ca-config-local.js ubuntu@your-vm-ip:~/
scp server/fix-vm-ca-config.js ubuntu@your-vm-ip:~/
```

### 2. Lấy Vault CA public key

Trên server, chạy lệnh sau để lấy Vault CA public key:

```bash
cd ~/Infrawatch-FullStack/server
node -e "require('./src/services/vault-ssh.service').getCAPublicKey().then(key => console.log(key))"
```

Sao chép public key này để sử dụng trong bước tiếp theo.

### 3. Kiểm tra cấu hình CA trên VM

SSH vào VM và chạy script kiểm tra:

```bash
# SSH vào VM
ssh ubuntu@your-vm-ip

# Cài đặt Node.js nếu chưa có
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Chạy script kiểm tra
sudo node test-vm-ca-config-local.js
```

Script sẽ kiểm tra:
- Xem file `/etc/ssh/trusted-user-ca-keys.pem` có tồn tại không
- Xem SSH server có được cấu hình để sử dụng certificate authentication không
- Xem certificate có thể được xác thực trên VM không

### 4. Sửa cấu hình CA trên VM

Nếu kiểm tra phát hiện vấn đề, chạy script sửa lỗi:

```bash
sudo node fix-vm-ca-config.js
```

Script sẽ yêu cầu bạn nhập Vault CA public key (đã lấy ở bước 2). Sau đó, script sẽ:
- Tạo hoặc cập nhật file `/etc/ssh/trusted-user-ca-keys.pem`
- Cập nhật cấu hình SSH server
- Khởi động lại SSH server

### 5. Kiểm tra lại cấu hình

Sau khi sửa xong, chạy lại script kiểm tra để đảm bảo mọi thứ đã được cấu hình đúng:

```bash
sudo node test-vm-ca-config-local.js
```

## Kiểm tra xác thực certificate

Để kiểm tra xem VM có chấp nhận certificate từ Vault CA không, bạn có thể thử kết nối SSH từ server đến VM bằng certificate:

1. Trên server, chạy script `test-ssh-connection.js`:

```bash
cd ~/Infrawatch-FullStack/server
export VM_IP=your-vm-ip
export SSH_USER=ubuntu
node test-ssh-connection.js
```

2. Nếu kết nối thành công với certificate, bạn sẽ thấy thông báo "Connection successful!" trong log.

## Ghi chú

- Đảm bảo rằng VM có thể kết nối đến server để nhận lệnh cập nhật SSH key.
- Nếu bạn thay đổi Vault CA, bạn cần cập nhật lại file `trusted-user-ca-keys.pem` trên tất cả các VM.
- Đảm bảo rằng quyền truy cập file `trusted-user-ca-keys.pem` được đặt đúng (644).
- Nếu bạn gặp vấn đề với xác thực certificate, hãy kiểm tra log của SSH server:

```bash
sudo journalctl -u sshd
```
