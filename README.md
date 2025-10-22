# User Management API
Link URL Dokumentasi Postman API: User Management API:
https://documenter.getpostman.com/view/49107675/2sB3QRn7E6


## Ringkasan Fitur
1. Autentikasi JWT,Register & Login yang menghasilkan Token JWT. Token melindungi semua endpoint CRUD.
2. CRUD Data User,"Implementasi lengkap Create, Read, Update, Delete data user. Data minimal: id, username, email, password (di-hash), role, avatar_url."
3. Kontrol Akses ID,Fitur Keamanan: User hanya dapat mengedit dan menghapus data profilnya sendiri yang harus menggunakan token dan ID milik pribadi .
4. Validasi Input,Validasi format Email (Regex) dan panjang Password (minimal 6 karakter).
5. Pencatatan Waktu,Kolom updated_at diperbarui secara otomatis setiap kali profil diubah.
6. Upload File,Menggunakan Cloudinary untuk penyimpanan foto profil (avatar_url).
7. Keamanan Server,Menggunakan Helmet (HTTP security headers) dan CORS (membatasi domain).
8. Konfigurasi Sensitif,Menggunakan file .env untuk menyimpan semua secret key.