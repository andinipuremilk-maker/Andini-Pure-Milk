import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabase';
import { db } from '../../../lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const role = searchParams.get('role') || 'ALL';
  const status = searchParams.get('status') || 'ALL';

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      let query = supabaseAdmin
        .from('users')
        .select('id, nama, username, role, shift, tanggal_masuk, is_active')
        .order('created_at', { ascending: false });

      if (role !== 'ALL') {
        query = query.eq('role', role.toLowerCase());
      }

      if (status === 'ACTIVE') {
        query = query.eq('is_active', true);
      } else if (status === 'INACTIVE') {
        query = query.eq('is_active', false);
      }

      const { data: usersData, error } = await query;
      if (!error && usersData) {
        let filtered = usersData;
        if (search) {
          filtered = filtered.filter(u => 
            u.nama?.toLowerCase().includes(search) || 
            u.username?.toLowerCase().includes(search)
          );
        }

        // Stats dari seluruh user
        const { data: allUsers } = await supabaseAdmin.from('users').select('role, is_active');
        const all = allUsers || [];
        const total = all.length;
        const aktif = all.filter(u => u.is_active !== false).length;
        const kasir = all.filter(u => u.role === 'kasir' && u.is_active !== false).length;
        const admin = all.filter(u => u.role === 'admin' && u.is_active !== false).length;
        const operasional = all.filter(u => ['barista', 'staff', 'kurir'].includes(u.role) && u.is_active !== false).length;

        return NextResponse.json({
          users: filtered,
          stats: { total, aktif, kasir, admin, operasional }
        });
      }
    } catch (err) {
      console.error('Supabase GET karyawan error:', err);
    }
  }

  // Fallback In-Memory
  if (!db.users) db.users = [];
  let filtered = [...db.users];

  if (search) {
    filtered = filtered.filter(u => 
      u.nama?.toLowerCase().includes(search) || 
      u.username?.toLowerCase().includes(search)
    );
  }

  if (role !== 'ALL') {
    filtered = filtered.filter(u => u.role?.toLowerCase() === role.toLowerCase());
  }

  if (status === 'ACTIVE') {
    filtered = filtered.filter(u => u.is_active !== false);
  } else if (status === 'INACTIVE') {
    filtered = filtered.filter(u => u.is_active === false);
  }

  const total = db.users.length;
  const aktif = db.users.filter(u => u.is_active !== false).length;
  const kasir = db.users.filter(u => u.role === 'kasir' && u.is_active !== false).length;
  const admin = db.users.filter(u => u.role === 'admin' && u.is_active !== false).length;
  const operasional = db.users.filter(u => ['barista', 'staff', 'kurir'].includes(u.role) && u.is_active !== false).length;

  const safeUsers = filtered.map(u => ({
    id: u.id,
    nama: u.nama,
    username: u.username,
    role: u.role,
    shift: u.shift || 'Standar',
    tanggal_masuk: u.tanggal_masuk || '2025-01-01',
    is_active: u.is_active !== false
  }));

  return NextResponse.json({
    users: safeUsers,
    stats: { total, aktif, kasir, admin, operasional }
  });
}

export async function POST(req) {
  try {
    const { nama, username, password, role, shift } = await req.json();

    if (!nama?.trim() || !username?.trim() || !password?.trim() || !role?.trim()) {
      return NextResponse.json({ error: 'Nama, username, password, dan role wajib diisi.' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    if (isSupabaseConfigured() && supabaseAdmin) {
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .ilike('username', cleanUsername)
        .single();

      if (existing) {
        return NextResponse.json({ error: 'Username sudah digunakan oleh karyawan lain.' }, { status: 400 });
      }

      const { data: newUser, error } = await supabaseAdmin
        .from('users')
        .insert({
          nama: nama.trim(),
          username: cleanUsername,
          password: password.trim(),
          role: role.trim().toLowerCase(),
          shift: shift?.trim() || 'Standar',
          is_active: true
        })
        .select('id, nama, username, role, shift, tanggal_masuk, is_active')
        .single();

      if (!error && newUser) {
        return NextResponse.json({ success: true, user: newUser }, { status: 201 });
      }
      return NextResponse.json({ error: error?.message || 'Gagal menambahkan karyawan' }, { status: 400 });
    }

    // Fallback In-Memory
    if (!db.users) db.users = [];
    const existing = db.users.find(u => u.username?.toLowerCase() === cleanUsername);
    if (existing) {
      return NextResponse.json({ error: 'Username sudah digunakan oleh karyawan lain.' }, { status: 400 });
    }

    const newUser = {
      id: `u_${Date.now()}`,
      nama: nama.trim(),
      username: cleanUsername,
      password: password.trim(),
      role: role.trim().toLowerCase(),
      shift: shift?.trim() || 'Standar',
      tanggal_masuk: new Date().toISOString().split('T')[0],
      is_active: true
    };

    db.users.push(newUser);
    const { password: _, ...safeUser } = newUser;
    return NextResponse.json({ success: true, user: safeUser }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menambahkan data karyawan: ' + error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, nama, username, password, role, shift, is_active } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID Karyawan wajib disertakan.' }, { status: 400 });
    }

    if (isSupabaseConfigured() && supabaseAdmin) {
      const updatePayload = {};
      if (nama) updatePayload.nama = nama.trim();
      if (role) updatePayload.role = role.trim().toLowerCase();
      if (shift !== undefined) updatePayload.shift = shift.trim() || 'Standar';
      if (password && password.trim() !== '') updatePayload.password = password.trim();
      if (is_active !== undefined) {
        if (username === 'admin' && is_active === false) {
          return NextResponse.json({ error: 'Akun Admin Utama tidak boleh dinonaktifkan.' }, { status: 400 });
        }
        updatePayload.is_active = Boolean(is_active);
      }

      if (username) {
        const cleanUsername = username.trim().toLowerCase();
        const { data: duplicate } = await supabaseAdmin
          .from('users')
          .select('id')
          .ilike('username', cleanUsername)
          .neq('id', id)
          .single();

        if (duplicate) {
          return NextResponse.json({ error: 'Username sudah digunakan oleh akun lain.' }, { status: 400 });
        }
        updatePayload.username = cleanUsername;
      }

      const { data: updated, error } = await supabaseAdmin
        .from('users')
        .update(updatePayload)
        .eq('id', id)
        .select('id, nama, username, role, shift, tanggal_masuk, is_active')
        .single();

      if (!error && updated) {
        return NextResponse.json({ success: true, user: updated });
      }
      return NextResponse.json({ error: error?.message || 'Gagal memperbarui karyawan' }, { status: 400 });
    }

    // Fallback In-Memory
    if (!db.users) db.users = [];
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Data karyawan tidak ditemukan.' }, { status: 404 });
    }

    const targetUser = db.users[index];
    if (username) {
      const cleanUsername = username.trim().toLowerCase();
      const duplicate = db.users.find(u => u.id !== id && u.username?.toLowerCase() === cleanUsername);
      if (duplicate) {
        return NextResponse.json({ error: 'Username sudah digunakan oleh akun lain.' }, { status: 400 });
      }
      targetUser.username = cleanUsername;
    }

    if (nama) targetUser.nama = nama.trim();
    if (role) targetUser.role = role.trim().toLowerCase();
    if (shift !== undefined) targetUser.shift = shift.trim() || 'Standar';
    if (password && password.trim() !== '') targetUser.password = password.trim();
    if (is_active !== undefined) {
      if ((targetUser.id === 'u1' || targetUser.username === 'admin') && is_active === false) {
        return NextResponse.json({ error: 'Akun Admin Utama tidak boleh dinonaktifkan.' }, { status: 400 });
      }
      targetUser.is_active = Boolean(is_active);
    }

    const { password: _, ...safeUser } = targetUser;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memperbarui data karyawan: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const permanent = searchParams.get('permanent') === 'true';

    if (!id) {
      return NextResponse.json({ error: 'ID Karyawan wajib disertakan.' }, { status: 400 });
    }

    if (isSupabaseConfigured() && supabaseAdmin) {
      const { data: targetUser } = await supabaseAdmin.from('users').select('username').eq('id', id).single();
      if (targetUser && targetUser.username === 'admin') {
        return NextResponse.json({ error: 'Akun Admin Utama tidak dapat dihapus.' }, { status: 400 });
      }

      if (permanent) {
        const { error } = await supabaseAdmin.from('users').delete().eq('id', id);
        if (!error) return NextResponse.json({ success: true, message: 'Data karyawan berhasil dihapus permanen.' });
      } else {
        const { error } = await supabaseAdmin.from('users').update({ is_active: false }).eq('id', id);
        if (!error) return NextResponse.json({ success: true, message: 'Status karyawan berhasil diubah menjadi Nonaktif.' });
      }
    }

    // Fallback In-Memory
    if (!db.users) db.users = [];
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Karyawan tidak ditemukan.' }, { status: 404 });
    }

    const user = db.users[index];
    if (user.id === 'u1' || user.username === 'admin') {
      return NextResponse.json({ error: 'Akun Admin Utama tidak dapat dihapus.' }, { status: 400 });
    }

    if (permanent) {
      db.users.splice(index, 1);
      return NextResponse.json({ success: true, message: 'Data karyawan berhasil dihapus permanen.' });
    } else {
      user.is_active = false;
      return NextResponse.json({ success: true, message: 'Status karyawan berhasil diubah menjadi Nonaktif.' });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memproses permintaan: ' + error.message }, { status: 500 });
  }
}
