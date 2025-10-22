import pool from '../config/db.js';
import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';
import bcrypt from 'bcryptjs'; // Pastikan Anda meng-import bcryptjs untuk hashing password

// Ambil semua pengguna
export const getUsers = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, username, email, role, avatar_url FROM users');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch users', error: err.message });
    }
};
// ambil data user berdasarkan ID
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Query untuk mencari satu user berdasarkan ID
        const { rows } = await pool.query('SELECT id, username, email, role, avatar_url, updated_at FROM users WHERE id = $1', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Mengembalikan objek user pertama
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch user', error: err.message });
    }
};

// Logika upload avatar ke Cloudinary (digunakan untuk endpoint POST /avatar)
export const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const uploadStream = () =>
            new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'avatars' },
                    (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });

        const result = await uploadStream();
        // Menggunakan req.user.id dari token yang diverifikasi (verifyToken middleware)
        const userId = req.user.id; 

        // Update database dengan URL avatar baru
       await pool.query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [result.secure_url, userId]);

        res.json({ message: 'Avatar uploaded and updated', url: result.secure_url });
    } catch (err) {
        res.status(500).json({ message: 'Upload failed', error: err.message });
    }
};
// delete pengguna
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id; // ID yang diambil dari Token JWT

        // Konversi ID dari URL ke integer untuk perbandingan
        const requestedId = parseInt(id, 10); 

        // KONTROL AKSES ID: Blokir jika ID token tidak sama dengan ID yang diminta di URL
        if (currentUserId !== requestedId) {
            return res.status(403).json({ 
                message: 'Forbidden: You can only delete your own profile.' 
            });
        }

        // Jalankan Query Delete
        const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
        
        if (rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error("Delete User Error:", err);
        res.status(500).json({ message: 'Deletion failed', error: err.message });
    }
};

// Memperbarui data pengguna (dipanggil dari PATCH /users/:id)
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id; // ID dari Token JWT
        const { username, email, password } = req.body;
        const avatarFile = req.file;

        // --- KONTROL AKSES ID ---
        const requestedId = parseInt(id, 10); 
        if (currentUserId !== requestedId) {
            return res.status(403).json({ 
                message: 'Forbidden: You can only edit your own profile.' 
            });
        }
        // --------------------------

        // Deklarasi variabel
        let updateFields = [];
        let queryParams = [];
        let paramIndex = 1;

        // Cek user dulu
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (userResult.rowCount === 0)
            return res.status(404).json({ message: 'User not found' });

        const currentUser = userResult.rows[0];
        let avatarUrl = currentUser.avatar_url;

        // Kalau ada avatar baru, unggah ke Cloudinary 
        if (avatarFile) {
            const uploadStream = () =>
                new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: 'avatars' },
                        (err, result) => {
                            if (err) reject(err);
                            else resolve(result);
                        }
                    );
                    streamifier.createReadStream(avatarFile.buffer).pipe(stream);
                });

            const result = await uploadStream();
            avatarUrl = result.secure_url;
        }

        // --- LOGIKA PEMBARUAN FIELD TEKS ---
        if (username) {
            updateFields.push(`username = $${paramIndex++}`);
            queryParams.push(username);
        }
        if (email) {
            updateFields.push(`email = $${paramIndex++}`);
            queryParams.push(email);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push(`password = $${paramIndex++}`);
            queryParams.push(hashedPassword);
        }

        // Tambahkan URL Avatar dan Waktu Update
        updateFields.push(`avatar_url = $${paramIndex++}`);
        queryParams.push(avatarUrl);
        updateFields.push(`updated_at = NOW()`); 

        // 5. JALANKAN QUERY UPDATE
        if (updateFields.length > 0) {
            const query = `
                UPDATE users 
                SET ${updateFields.join(', ')} 
                WHERE id = $${paramIndex} 
                RETURNING id, username, email, avatar_url, updated_at
            `;
            queryParams.push(id);
            
            const updatedUser = await pool.query(query, queryParams);
            return res.json({ 
                message: 'User updated successfully', 
                user: updatedUser.rows[0] 
            });
        }

        return res.status(200).json({ message: 'No changes provided' });

    } catch (err) {
        console.error("Update User Error:", err);
        res.status(500).json({ message: 'Update failed', error: err.message });
    }
};