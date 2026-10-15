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

        const { data: allUsers } = await supabaseAdmin.from('users').select('role, is_active');
        const all = allUsers || [];
        const total = all.length;
        const adminCount = all.filter(u => u.role === 'admin' && u.is_active !== false).length;
        const kasirCount = all.filter(u => u.role === 'kasir' && u.is_active !== false).length;
        const aktifCount = all.filter(u => u.is_active !== false).length;
        const nonaktifCount = all.filter(u => u.is_active === false).length;

        return NextResponse.json({
          accounts: filtered,
          stats: { total, admin: adminCount, kasir: kasirCount, aktif: aktifCount, nonaktif: nonaktifCount }
        });
      }
    } catch (err) {
      console.error('Supabase GET akun error:', err);
    }
  }

  // Fallback in-memory
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
  const adminCount = db.users.filter(u => u.role === 'admin' && u.is_active !== false).length;
  const kasirCount = db.users.filter(u => u.role === 'kasir' && u.is_active !== false).length;
  const aktifCount = db.users.filter(u => u.is_active !== false).length;
  const nonaktifCount = db.users.filter(u => u.is_active === false).length;

  const safeAccounts = filtered.map(u => ({
    id: u.id,
    nama: u.nama,
    username: u.username,
    role: u.role,
    shift: u.shift || 'Standar',
    tanggal_masuk: u.tanggal_masuk || '2025-01-01',
    is_active: u.is_active !== false
  }));

  return NextResponse.json({
    accounts: safeAccounts,
    stats: {
      total,
      admin: adminCount,
      kasir: kasirCount,
      aktif: aktifCount,
      nonaktif: nonaktifCount
    }
  });
}

export async function POST(req) {
  try {
    const { nama, username, password, role, shift } = await req.json();

    if (!nama?.trim() || !username?.trim() || !password?.trim() || !role?.trim()) {
      return NextResponse.json(
        { error: 'Nama Lengkap, Username, Password, dan Role wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();

    if (isSupabaseConfigured() && supabaseAdmin) {
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .ilike('username', cleanUsername)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: `Username "${cleanUsername}" sudah terdaftar. Silakan pilih username lain.` },
          { status: 400 }
        );
      }

      const { data: newAccount, error } = await supabaseAdmin
        .from('users')
        .insert({
          nama: nama.trim(),
          username: cleanUsername,
          password: password.trim(),
          role: role.trim().toLowerCase(),
          shift: shift?.trim() || (role.toLowerCase() === 'kasir' ? 'Shift POS' : 'Standar'),
          is_active: true
        })
        .select('id, nama, username, role, shift, tanggal_masuk, is_active')
        .single();

      if (!error && newAccount) {
        return NextResponse.json(
          { success: true, message: `Akun "${cleanUsername}" berhasil dibuat.`, account: newAccount },
          { status: 201 }
        );
      }
      return NextResponse.json({ error: error?.message || 'Gagal membuat akun' }, { status: 400 });
    }

    // Fallback
    if (!db.users) db.users = [];
    const existing = db.users.find(u => u.username?.toLowerCase() === cleanUsername);
    if (existing) {
      return NextResponse.json(
        { error: `Username "${cleanUsername}" sudah terdaftar. Silakan pilih username lain.` },
        { status: 400 }
      );
    }

    const newAccount = {
      id: `u_${Date.now()}`,
      nama: nama.trim(),
      username: cleanUsername,
      password: password.trim(),
      role: role.trim().toLowerCase(),
      shift: shift?.trim() || (role.toLowerCase() === 'kasir' ? 'Shift POS' : 'Standar'),
      tanggal_masuk: new Date().toISOString().split('T')[0],
      is_active: true
    };

    db.users.push(newAccount);
    const { password: _, ...safeAccount } = newAccount;

    return NextResponse.json(
      { success: true, message: `Akun "${cleanUsername}" berhasil dibuat.`, account: safeAccount },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal memproses pembuatan akun: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const { id, nama, username, password, role, shift, is_active } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID Akun wajib disertakan.' }, { status: 400 });
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
        return NextResponse.json({ success: true, message: 'Data akun berhasil diperbarui.', account: updated });
      }
      return NextResponse.json({ error: error?.message || 'Gagal memperbarui akun' }, { status: 400 });
    }

    // Fallback In-Memory
    if (!db.users) db.users = [];
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });
    }

    const target = db.users[index];
    if (username) {
      const cleanUsername = username.trim().toLowerCase();
      const duplicate = db.users.find(u => u.id !== id && u.username?.toLowerCase() === cleanUsername);
      if (duplicate) {
        return NextResponse.json({ error: `Username "${cleanUsername}" sudah digunakan.` }, { status: 400 });
      }
      target.username = cleanUsername;
    }

    if (nama) target.nama = nama.trim();
    if (role) target.role = role.trim().toLowerCase();
    if (shift !== undefined) target.shift = shift.trim() || 'Standar';
    if (password && password.trim() !== '') target.password = password.trim();
    if (is_active !== undefined) {
      if ((target.id === 'u1' || target.username === 'admin') && is_active === false) {
        return NextResponse.json({ error: 'Akun Admin Utama tidak boleh dinonaktifkan.' }, { status: 400 });
      }
      target.is_active = Boolean(is_active);
    }

    const { password: _, ...safeAccount } = target;
    return NextResponse.json({ success: true, message: 'Data akun berhasil diperbarui.', account: safeAccount });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memperbarui akun: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID Akun wajib disertakan.' }, { status: 400 });
    }

    if (isSupabaseConfigured() && supabaseAdmin) {
      const { data: target } = await supabaseAdmin.from('users').select('username').eq('id', id).single();
      if (target && target.username === 'admin') {
        return NextResponse.json({ error: 'Akun Admin Utama dilindungi dan tidak dapat dihapus.' }, { status: 400 });
      }
      const { error } = await supabaseAdmin.from('users').delete().eq('id', id);
      if (!error) return NextResponse.json({ success: true, message: 'Akun berhasil dihapus permanen.' });
    }

    // Fallback In-Memory
    if (!db.users) db.users = [];
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });
    }

    const target = db.users[index];
    if (target.id === 'u1' || target.username === 'admin') {
      return NextResponse.json({ error: 'Akun Admin Utama dilindungi dan tidak dapat dihapus.' }, { status: 400 });
    }

    db.users.splice(index, 1);
    return NextResponse.json({ success: true, message: 'Akun berhasil dihapus permanen.' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memproses penghapusan akun: ' + error.message }, { status: 500 });
  }
}
