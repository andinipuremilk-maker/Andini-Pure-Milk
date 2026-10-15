import { mockUsers } from './mockData';

export const loginUser = async (username, password, role) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const user = mockUsers.find(u => u.username === username && u.password === password);
  
  if (!user) {
    throw new Error('Username atau password salah.');
  }
  
  if (user.role !== role) {
    throw new Error(`Akses ditolak. Anda tidak terdaftar sebagai ${role}.`);
  }
  
  if (!user.is_active) {
    throw new Error('Akun Anda tidak aktif.');
  }

  // Remove password before returning
  const { password: _, ...safeUser } = user;
  return safeUser;
};
