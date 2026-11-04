// Toggle geser untuk status aktif/nonaktif di tabel. Klik hanya memanggil onToggle (konfirmasi/simpan ditangani pemanggil);
// tampilan mengikuti `checked` dari data, jadi baru bergeser setelah data berubah.
function Switch({ checked, label, onToggle, disabled, ...rest }) {
  return (
    <span className="dash-switch-cell">
      <button type="button" role="switch" aria-checked={checked} aria-label={label} title={label} className="dash-switch-btn" disabled={disabled} onClick={onToggle} {...rest} />
      <span className={`dash-status ${checked ? 'aktif' : 'nonaktif'}`}>{checked ? 'Aktif' : 'Nonaktif'}</span>
    </span>
  );
}

export default Switch;
