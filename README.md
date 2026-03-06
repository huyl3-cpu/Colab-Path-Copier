# Colab Path Copier

[🇬🇧 English](README_en.md)

Extension Chrome giúp copy nhanh đường dẫn Google Colab từ Google Drive.

## Tính năng

- **Menu chuột phải**: Chuột phải vào file/thư mục trên Google Drive để:
  - 📄 **Copy URL File** - Copy đường dẫn Colab đầy đủ kèm tên file
  - 📁 **Copy URL Thư Mục** - Copy đường dẫn thư mục hiện tại trên Colab
- **Phím tắt**: `Ctrl+Shift+C` để copy đường dẫn file đang chọn
- **Tự động nhận diện đường dẫn**: Đọc breadcrumb navigation của Google Drive
- **Không ghi đè**: Hiển thị bên cạnh menu chuột phải gốc của Google Drive

## Định dạng đường dẫn

Đường dẫn theo format mount Drive trên Google Colab:

```
/content/drive/MyDrive/thư_mục/thư_mục_con/file.mp4
/content/drive/MyDrive/thư_mục/thư_mục_con
```

## Cài đặt

1. Tải file ZIP mới nhất từ [Releases](https://github.com/huyl3-cpu/Colab-Path-Copier/releases)
2. Giải nén file ZIP
3. Mở Chrome, vào `chrome://extensions/`
4. Bật **Chế độ nhà phát triển** (Developer mode) ở góc trên bên phải
5. Bấm **"Tải tiện ích đã giải nén"** (Load unpacked)
6. Chọn thư mục vừa giải nén
7. Xong! Vào Google Drive và chuột phải vào file bất kỳ

## Cách sử dụng

1. Vào [Google Drive](https://drive.google.com)
2. Chuột phải vào file hoặc thư mục
3. Bấm **"Copy URL File"** hoặc **"Copy URL Thư Mục"** từ menu bên phải
4. Dán đường dẫn vào Google Colab hoặc ComfyUI
