'use client';
import { IconCheck, IconPrinter, IconX } from '../../components/ui/icons';

/**
 * Modal Nota Digital Bukti Transaksi.
 * Props:
 *  - isOpen: boolean, menampilkan modal bila true
 *  - onClose: dipanggil saat modal ditutup
 *  - tx: objek transaksi (no_transaksi, tanggal, items, subtotal, diskon, total, bayar, metode_bayar, seller, keterangan, kasir)
 *  - onNewTransaction: dipanggil saat tombol "Transaksi Baru" ditekan
 */
const rupiah = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

const METODE_LABEL = {
  tunai: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer'
};

export default function ReceiptModal({ isOpen, onClose, tx, onNewTransaction }) {
  if (!isOpen || !tx) return null;

  const items = Array.isArray(tx.items) ? tx.items : [];
  const tanggal = tx.tanggal ? new Date(tx.tanggal) : new Date();
  const diskon = Number(tx.diskon || 0);
  const total = Number(tx.total || 0);
  const bayar = Number(tx.bayar ?? total);
  const kembalian = tx.metode_bayar === 'tunai' ? Math.max(0, bayar - total) : 0;

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div className="modal-content" style={{ maxWidth: '420px', width: '92%' }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <IconCheck size={16} />
            </div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Nota Digital
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            style={{ color: 'var(--text-tertiary)', padding: '0.25rem', display: 'flex' }}
          >
            <IconX size={18} />
          </button>
        </div>

        <div className="printable-receipt" style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
          <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>ANDINI PURE MILK</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              {tanggal.toLocaleString('id-ID')}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              No: {tx.no_transaksi || '-'}
            </div>
          </div>

          <div style={{ borderTop: '1px dashed var(--border-strong)', borderBottom: '1px dashed var(--border-strong)', padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {items.length === 0 && (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Tidak ada item</div>
            )}
            {items.map((it, i) => {
              const qty = Number(it?.qty || 0);
              const harga = Number(it?.harga_satuan || 0);
              return (
                <div key={it?.order_item_key || i} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{it?.nama || '-'}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      {qty} &times; {rupiah(harga)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{rupiah(qty * harga)}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', padding: '0.6rem 0' }}>
            {tx.subtotal !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span><span>{rupiah(tx.subtotal)}</span>
              </div>
            )}
            {diskon > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--status-success)' }}>
                <span>Diskon{tx.diskon_nama ? ` (${tx.diskon_nama})` : ''}</span><span>- {rupiah(diskon)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem' }}>
              <span>Total</span><span>{rupiah(total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Metode</span><span>{METODE_LABEL[tx.metode_bayar] || tx.metode_bayar || '-'}</span>
            </div>
            {tx.metode_bayar === 'tunai' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Bayar</span><span>{rupiah(bayar)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Kembalian</span><span>{rupiah(kembalian)}</span>
                </div>
              </>
            )}
          </div>

          {(tx.seller || tx.kasir || tx.keterangan) && (
            <div style={{ borderTop: '1px dashed var(--border-strong)', paddingTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {tx.seller && <div>Mitra: {tx.seller}</div>}
              {tx.kasir && <div>Kasir: {tx.kasir}</div>}
              {tx.keterangan && <div>Catatan: {tx.keterangan}</div>}
            </div>
          )}
        </div>

        <div className="no-print" style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ flex: 1 }}
            onClick={() => window.print()}
          >
            <IconPrinter size={14} /> Cetak
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ flex: 1 }}
            onClick={() => (onNewTransaction ? onNewTransaction() : onClose())}
          >
            Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
}
