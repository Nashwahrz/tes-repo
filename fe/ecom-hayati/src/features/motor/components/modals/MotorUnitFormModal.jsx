import { useEffect, useState } from 'react';
import {
  createMotorUnit,
  getDealers,
  errorMessage,
} from '../../../../api/authServices';
import Modal from '../../../../shared/components/Modal';
import Loading, { Spin } from '../../../../shared/components/Loading';
import MotorSelect from '../MotorSelect';

const EMPTY_FORM = {
  item_code: '',
  dealer_id: '',
  nomor_rangka: '',
  nomor_mesin: '',
  catatan: '',
};

function validateForm(form) {
  const errors = {};
  if (!form.item_code.trim()) errors.item_code = 'Model motor wajib dipilih.';
  else if (form.item_code.trim().length > 6) errors.item_code = 'Kode item motor maksimal 6 karakter.';

  if (!form.dealer_id) errors.dealer_id = 'Dealer wajib dipilih.';

  if (!form.nomor_rangka.trim()) errors.nomor_rangka = 'Nomor rangka wajib diisi.';
  else if (form.nomor_rangka.trim().length > 50) errors.nomor_rangka = 'Nomor rangka maksimal 50 karakter.';

  if (!form.nomor_mesin.trim()) errors.nomor_mesin = 'Nomor mesin wajib diisi.';
  else if (form.nomor_mesin.trim().length > 50) errors.nomor_mesin = 'Nomor mesin maksimal 50 karakter.';

  if (form.catatan.length > 500) errors.catatan = 'Catatan maksimal 500 karakter.';
  return errors;
}

export default function MotorUnitFormModal({ dealers = [], onSuccess, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [dealerOptions, setDealerOptions] = useState(dealers);
  const [dealersLoading, setDealersLoading] = useState(dealers.length === 0);

  useEffect(() => {
    if (dealers.length > 0) {
      setDealerOptions(dealers);
      setDealersLoading(false);
      return undefined;
    }
    let active = true;
    getDealers()
      .then((res) => { if (active) setDealerOptions(res); })
      .catch((err) => { if (active) setFormError(errorMessage(err)); })
      .finally(() => { if (active) setDealersLoading(false); });
    return () => { active = false; };
  }, [dealers]);

  const setField = (key, uppercase = false) => (e) => {
    const val = uppercase ? e.target.value.toUpperCase() : e.target.value;
    setForm((prev) => ({ ...prev, [key]: val }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const errors = validateForm(form);
  const hasError = Object.keys(errors).length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      item_code: true,
      dealer_id: true,
      nomor_rangka: true,
      nomor_mesin: true,
      catatan: true,
    });
    if (hasError) return;

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        item_code: form.item_code.trim().toUpperCase(),
        dealer_id: Number(form.dealer_id),
        nomor_rangka: form.nomor_rangka.trim().toUpperCase(),
        nomor_mesin: form.nomor_mesin.trim().toUpperCase(),
        ...(form.catatan.trim() ? { catatan: form.catatan.trim() } : {}),
      };
      const res = await createMotorUnit(payload);
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
        <h3>Tambah Unit Motor</h3>
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

      {dealersLoading ? (
        <Loading rows={3} />
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
          <MotorSelect
            id="unit-item-code"
            value={form.item_code}
            error={touched.item_code ? errors.item_code : ''}
            onChange={(itemCode) => {
              setForm((prev) => ({ ...prev, item_code: itemCode }));
              setTouched((prev) => ({ ...prev, item_code: true }));
            }}
            onError={setFormError}
          />

          <div className={`dash-field ${touched.dealer_id && errors.dealer_id ? 'has-error' : ''}`}>
            <label htmlFor="unit-dealer-id">
              Dealer <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              id="unit-dealer-id"
              className={`dash-select full ${touched.dealer_id && errors.dealer_id ? 'dash-input-error' : ''}`}
              value={form.dealer_id}
              onChange={setField('dealer_id')}
            >
              <option value="">-- Pilih Dealer --</option>
              {dealerOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.dealer_name}
                </option>
              ))}
            </select>
            {touched.dealer_id && errors.dealer_id && <p className="dash-field-error">{errors.dealer_id}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px' }}>
            <div className={`dash-field ${touched.nomor_rangka && errors.nomor_rangka ? 'has-error' : ''}`}>
              <label htmlFor="unit-nomor-rangka">
                Nomor Rangka <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="unit-nomor-rangka"
                type="text"
                className={`dash-input ${touched.nomor_rangka && errors.nomor_rangka ? 'dash-input-error' : ''}`}
                value={form.nomor_rangka}
                onChange={setField('nomor_rangka', true)}
                placeholder="Contoh: MH1JM..."
              />
              {touched.nomor_rangka && errors.nomor_rangka && <p className="dash-field-error">{errors.nomor_rangka}</p>}
            </div>

            <div className={`dash-field ${touched.nomor_mesin && errors.nomor_mesin ? 'has-error' : ''}`}>
              <label htmlFor="unit-nomor-mesin">
                Nomor Mesin <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="unit-nomor-mesin"
                type="text"
                className={`dash-input ${touched.nomor_mesin && errors.nomor_mesin ? 'dash-input-error' : ''}`}
                value={form.nomor_mesin}
                onChange={setField('nomor_mesin', true)}
                placeholder="Contoh: JM91E..."
              />
              {touched.nomor_mesin && errors.nomor_mesin && <p className="dash-field-error">{errors.nomor_mesin}</p>}
            </div>
          </div>

          <div className={`dash-field ${touched.catatan && errors.catatan ? 'has-error' : ''}`}>
            <label htmlFor="unit-catatan">Catatan (Opsional)</label>
            <textarea
              id="unit-catatan"
              className={`dash-input ${touched.catatan && errors.catatan ? 'dash-input-error' : ''}`}
              rows={2}
              value={form.catatan}
              onChange={setField('catatan')}
              placeholder="Catatan penerimaan unit..."
            />
            {touched.catatan && errors.catatan && <p className="dash-field-error">{errors.catatan}</p>}
          </div>

          <div className="dash-modal-actions" style={{ marginTop: 18 }}>
            <button type="button" className="dash-btn outline" onClick={onClose} disabled={saving}>
              Batal
            </button>
            <button type="submit" className="dash-btn solid" disabled={saving}>
              {saving ? <Spin /> : 'Simpan Unit'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
