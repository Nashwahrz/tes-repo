import Icon from './Icon';
import Loading from './Loading';
import SalesChart from './SalesChart';
import ServerClock from './ServerClock';
import { rupiah } from '../salesAnalytics';
import { totalSales } from '../salesPrototype';
import { MENU_ICONS } from '../navConfig';
import { MENU_PENJUALAN, MENU_DEALER, MENU_KONSUMEN, MENU_ACC, MENU_HOME, MENU_PATHS } from '../menuPaths';

const KONSUMEN_STATUS = { pending: 'Menunggu', diterima: 'Diterima', ditolak: 'Ditolak' };

function HomeView({ name, today, scopeNote, can, sales, stats, pending, dealers, recentKonsumen, menus, onSelect }) {
  const { canDealer, canUsers, canSales, canAcc, canActivate, canKonsumen } = can;
  const { rows: salesRows, known: salesKnown, dealerName: salesDealerName, isAdmin } = sales;
  return (
    <>
    <section className="dash-welcome">
      <div className="dash-welcome-text">
        <small>{today}</small>
        <small className="dash-server-time"><ServerClock /></small>
        <h1>Halo, {name}</h1>
        <p>{canDealer || canUsers ? `Pantau ${[canDealer && 'jaringan dealer motor', canUsers && 'status akun pengguna'].filter(Boolean).join(' dan ')} dalam satu tampilan.` : 'Pilih menu di samping untuk mulai bekerja.'} {scopeNote}</p>
      </div>
      {canSales && (
        <div className="dash-welcome-sales">
          <small>{isAdmin ? 'Total Penjualan' : `Total Penjualan Dealer Anda${salesDealerName ? ` · ${salesDealerName}` : ''}`}</small>
          <strong>{salesKnown ? rupiah(totalSales(salesRows)) : 'Belum ada data'}</strong>
          {salesKnown && <span className="dash-proto">Data contoh</span>}
          <button id="btn-home-lihat-penjualan" className="dash-btn light" onClick={() => onSelect(MENU_PENJUALAN)}>Lihat Penjualan</button>
        </div>
      )}
    </section>

    {stats.length > 0 && (
    <section className="dash-stats">
      {stats.map((s) => (
        <div className={`dash-stat tone-${s.tone}`} key={s.label}>
          <span className="dash-stat-icon"><Icon name={s.icon} size={22} /></span>
          <div className="dash-stat-body">
            <small>{s.label}</small>
            <strong>{s.value}</strong>
            <em>{s.hint}</em>
          </div>
        </div>
      ))}
    </section>
    )}

    {(canSales || salesKnown) && (
      <SalesChart
        rows={salesRows}
        dealerName={salesDealerName}
        isAdmin={isAdmin}
        showDealerFilter
        onViewAll={canSales ? () => onSelect(MENU_PENJUALAN) : null}
      />
    )}

    <section className="dash-grid">
      {canAcc && (
      <div className="dash-card">
        <div className="dash-card-head">
          <h3><Icon name="shield" size={17} /> Otorisasi Akun</h3>
          <button id="btn-home-lihat-semua-akun" type="button" className="dash-link" onClick={() => onSelect(MENU_ACC)}>Lihat semua</button>
        </div>
        <p className="dash-card-desc">
          {pending.length === 0 ? 'Validasi akun baru sebelum diberi akses ke sistem.' : `${pending.length} akun menunggu persetujuan.`}
        </p>

        {pending.length === 0 ? (
          <p className="dash-empty">Tidak ada akun yang menunggu persetujuan.</p>
        ) : (
          <>
            {pending.slice(0, 4).map((u) => (
              <div className="dash-item dash-item-compact" key={u.id}>
                <div className="dash-item-main">
                  <strong title={u.name}>{u.name}</strong>
                  <small title={u.email}>{u.email}</small>
                </div>
                <span className="dash-tag">{u.role?.name ?? '-'}</span>
                {canActivate && <button id={`btn-home-tinjau-${u.id}`} className="dash-btn sm outline" onClick={() => onSelect(MENU_ACC)}>Tinjau</button>}
              </div>
            ))}
            {pending.length > 4 && <p className="dash-more">dan {pending.length - 4} akun lainnya</p>}
          </>
        )}
      </div>
      )}

      {canDealer && (
      <div className="dash-card">
        <div className="dash-card-head">
          <h3><Icon name="store" size={17} /> Jaringan Dealer</h3>
          <button id="btn-home-lihat-semua-dealer" type="button" className="dash-link" onClick={() => onSelect(MENU_DEALER)}>Lihat semua</button>
        </div>
        <p className="dash-card-desc">{dealers.length} dealer terdaftar.</p>
        {dealers.length === 0 ? (
          <p className="dash-empty">Belum ada data dealer.</p>
        ) : (
          dealers.slice(0, 4).map((d) => (
            <div className="dash-row dash-row-compact" key={d.id}>
              <span className="dash-row-icon"><Icon name="store" size={14} /></span>
              <div className="dash-row-body">
                <span title={d.name}>{d.name}</span>
                <small title={d.alamat}>{d.alamat}</small>
              </div>
            </div>
          ))
        )}
      </div>
      )}

      {!canAcc && !canDealer && canKonsumen && (
      <div className={`dash-card${salesKnown ? '' : ' dash-card-wide'}`}>
        <div className="dash-card-head">
          <h3><Icon name="id" size={17} /> Konsumen Terbaru</h3>
          <button id="btn-home-lihat-semua-konsumen" type="button" className="dash-link" onClick={() => onSelect(MENU_KONSUMEN)}>Lihat semua</button>
        </div>
        <p className="dash-card-desc">Data konsumen yang terakhir masuk.</p>
        {recentKonsumen === null ? (
          <Loading rows={4} />
        ) : recentKonsumen.length === 0 ? (
          <p className="dash-empty">Belum ada data konsumen.</p>
        ) : (
          recentKonsumen.slice(0, 5).map((k) => (
            <div className="dash-row dash-row-compact" key={k.id}>
              <span className="dash-row-icon"><Icon name="id" size={14} /></span>
              <div className="dash-row-body">
                <span title={k.name}>{k.name || '-'}</span>
                <small>{k.nik || '-'}</small>
              </div>
              <span className={`dash-status ${k.status}`}>{KONSUMEN_STATUS[k.status] ?? k.status}</span>
            </div>
          ))
        )}
      </div>
      )}

      {!canAcc && !canDealer && canSales && salesKnown && (
      <div className="dash-card">
        <div className="dash-card-head">
          <h3><Icon name="chart" size={17} /> Penjualan Terbaru</h3>
          <button id="btn-home-lihat-semua-penjualan" type="button" className="dash-link" onClick={() => onSelect(MENU_PENJUALAN)}>Lihat semua</button>
        </div>
        <p className="dash-card-desc">Transaksi terakhir di dealer Anda. Data contoh.</p>
        {salesRows.length === 0 ? (
          <p className="dash-empty">Belum ada transaksi.</p>
        ) : (
          salesRows.toSorted((x, y) => y.tanggal.localeCompare(x.tanggal)).slice(0, 5).map((r) => (
            <div className="dash-row dash-row-compact" key={r.id}>
              <span className="dash-row-icon"><Icon name="chart" size={14} /></span>
              <div className="dash-row-body">
                <span title={r.motor}>{r.motor}</span>
                <small>{r.konsumen}</small>
              </div>
              <span className="dash-row-right">{rupiah(r.harga)}</span>
            </div>
          ))
        )}
      </div>
      )}

      {!canAcc && !canDealer && !canKonsumen && (
      <div className="dash-card dash-card-wide">
        <div className="dash-card-head">
          <h3><Icon name="grid" size={17} /> Menu Anda</h3>
        </div>
        <p className="dash-card-desc">Fitur yang tersedia untuk akun Anda.</p>
        {menus.filter((m) => m !== MENU_HOME).length === 0 ? (
          <p className="dash-empty">Belum ada menu yang dapat diakses.</p>
        ) : (
          <div className="dash-tiles">
            {menus.filter((m) => m !== MENU_HOME).map((m) => (
              <button id={`btn-tile-${MENU_PATHS[m].slice(1).replace(/\//g, '-')}`} type="button" className="dash-tile" key={m} onClick={() => onSelect(m)}>
                <span className="dash-tile-icon"><Icon name={MENU_ICONS[m]} size={20} /></span>
                <span>{m}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      )}
    </section>

    </>
  );
}

export default HomeView;
