import { useState } from 'react';
import { createMotorPrice, errorMessage } from '../../../../api/authServices';
import Modal from '../../../../shared/components/Modal';
import { Spin } from '../../../../shared/components/Loading';
import MotorSelect from '../MotorSelect';
import { formatRp, formatThousands } from '../../utils/formatters';

const EMPTY_FORM = {
  item_code: '',
  tahun_produksi: String(new Date().getFullYear()),
  harga_kosong: '',
  bbn_tnkb_hitam: '',
  bbn_tnkb_merah: '',
};

function validateForm(form) {
  const errors = {};
  if (!form.item_code.trim()) errors.item_code = 'Model motor wajib dipilih.';
  else if (form.item_code.trim().length > 6) errors.item_code = 'Kode item motor maksimal 6 karakter.';

  const tahun = Number(form.tahun_produksi);
  if (!form.tahun_produksi) errors.tahun_produksi = 'Tahun produksi wajib diisi.';
  else if (!Number.isInteger(tahun) || tahun < 2000 || tahun > 2100) {
    errors.tahun_produksi = 'Tahun produksi harus antara 2000 - 2100.';
  }

  if (form.harga_kosong === '' || Number(form.harga_kosong) < 0 || Number.isNaN(Number(form.harga_kosong))) {
    errors.harga_kosong = 'Harga kosong wajib diisi dan tidak boleh negatif.';
  }
  if (form.bbn_tnkb_hitam === '' || Number(form.bbn_tnkb_hitam) < 0 || Number.isNaN(Number(form.bbn_tnkb_hitam))) {
    errors.bbn_tnkb_hitam = 'BBN TNKB Hitam wajib diisi dan tidak boleh negatif.';
  }
  if (form.bbn_tnkb_merah === '' || Number(form.bbn_tnkb_merah) < 0 || Number.isNaN(Number(form.bbn_tnkb_merah))) {
    errors.bbn_tnkb_merah = 'BBN TNKB Merah wajib diisi dan tidak boleh negatif.';
  }
  return errors;
}

export default function MotorPriceFormModal({ onSuccess, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const setCurrencyField = (key) => (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    setForm((prev) => ({ ...prev, [key]: digits }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const errors = validateForm(form);
  const hasError = Object.keys(errors).length > 0;

  const otrHitam = (Number(form.harga_kosong) || 0) + (Number(form.bbn_tnkb_hitam) || 0);
  const otrMerah = (Number(form.harga_kosong) || 0) + (Number(form.bbn_tnkb_merah) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      item_code: true,
      tahun_produksi: true,
      harga_kosong: true,
      bbn_tnkb_hitam: true,
      bbn_tnkb_merah: true,
    });
    if (hasError) return;

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        item_code: form.item_code.trim().toUpperCase(),
        tahun_produksi: Number(form.tahun_produksi),
        harga_kosong: Number(form.harga_kosong),
        bbn_tnkb_hitam: Number(form.bbn_tnkb_hitam),
        bbn_tnkb_merah: Number(form.bbn_tnkb_merah),
      };
      const res = await createMotorPrice(payload);
      onSuccess?.(res);
      onClose?.();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={saving ? undefined : onClose} dismissOnBackdrop={!saving}>
      <div className="dash-modal-head">
        <h3>Tambah Harga Motor</h3>
        {!saving && (
          <button
            type="button"
            className="dash-modal-close"
            onClick={onClose}
            aria-label="Tutup"
            title="Tutup"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>

      {formError && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#dc2626', fontSize: '0.9em', margin: '10px 0' }}>
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
        <MotorSelect
          id="price-item-code"
          value={form.item_code}
          error={touched.item_code ? errors.item_code : ''}
          onChange={(itemCode) => {
            setForm((prev) => ({ ...prev, item_code: itemCode }));
            setTouched((prev) => ({ ...prev, item_code: true }));
          }}
          onError={setFormError}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px' }}>
          <div className={`dash-field ${touched.tahun_produksi && errors.tahun_produksi ? 'has-error' : ''}`}>
            <label htmlFor="price-tahun">
              Tahun Produksi <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="price-tahun"
              type="number"
              min="2000"
              max="2100"
              className={`dash-input ${touched.tahun_produksi && errors.tahun_produksi ? 'dash-input-error' : ''}`}
              value={form.tahun_produksi}
              onChange={setField('tahun_produksi')}
            />
            {touched.tahun_produksi && errors.tahun_produksi && <p className="dash-field-error">{errors.tahun_produksi}</p>}
          </div>

          <div className={`dash-field ${touched.harga_kosong && errors.harga_kosong ? 'has-error' : ''}`}>
            <label htmlFor="price-kosong">
              Harga Kosong (Tanpa BBN) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="price-kosong"
              type="text"
              inputMode="numeric"
              className={`dash-input ${touched.harga_kosong && errors.harga_kosong ? 'dash-input-error' : ''}`}
              value={formatThousands(form.harga_kosong)}
              onChange={setCurrencyField('harga_kosong')}
              placeholder="Contoh: 18.000.000"
            />
            {touched.harga_kosong && errors.harga_kosong && <p className="dash-field-error">{errors.harga_kosong}</p>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px' }}>
          <div className={`dash-field ${touched.bbn_tnkb_hitam && errors.bbn_tnkb_hitam ? 'has-error' : ''}`}>
            <label htmlFor="price-bbn-hitam">
              BBN TNKB Hitam <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="price-bbn-hitam"
              type="text"
              inputMode="numeric"
              className={`dash-input ${touched.bbn_tnkb_hitam && errors.bbn_tnkb_hitam ? 'dash-input-error' : ''}`}
              value={formatThousands(form.bbn_tnkb_hitam)}
              onChange={setCurrencyField('bbn_tnkb_hitam')}
              placeholder="Contoh: 2.500.000"
            />
            {touched.bbn_tnkb_hitam && errors.bbn_tnkb_hitam && <p className="dash-field-error">{errors.bbn_tnkb_hitam}</p>}
          </div>

          <div className={`dash-field ${touched.bbn_tnkb_merah && errors.bbn_tnkb_merah ? 'has-error' : ''}`}>
            <label htmlFor="price-bbn-merah">
              BBN TNKB Merah <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="price-bbn-merah"
              type="text"
              inputMode="numeric"
              className={`dash-input ${touched.bbn_tnkb_merah && errors.bbn_tnkb_merah ? 'dash-input-error' : ''}`}
              value={formatThousands(form.bbn_tnkb_merah)}
              onChange={setCurrencyField('bbn_tnkb_merah')}
              placeholder="Contoh: 2.000.000"
            />
            {touched.bbn_tnkb_merah && errors.bbn_tnkb_merah && <p className="dash-field-error">{errors.bbn_tnkb_merah}</p>}
          </div>
        </div>

        <div style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.88em', display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span>OTR Hitam: <strong>{formatRp(otrHitam)}</strong></span>
          <span>OTR Merah: <strong>{formatRp(otrMerah)}</strong></span>
        </div>

        <div className="dash-modal-actions" style={{ marginTop: 18 }}>
          <button type="button" className="dash-btn outline" onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button type="submit" className="dash-btn solid" disabled={saving}>
            {saving ? <Spin /> : 'Simpan Harga'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
