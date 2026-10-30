import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUsers, getDealers, getKonsumenTotal, getKonsumenStatusTotals, getUserMenus, getUserPermissions } from '../../api/authServices';
import { readCache, writeCache, toAccess } from './dashboardCache';
import { EMPTY_ACCESS } from './dashboardAccess';

const POLL_MS = 30000;
const NO_STATUS = { pending: null, ditolak: null };

export function useDashboardData(user) {
  const qc = useQueryClient();
  const [cached] = useState(() => readCache(user?.id));
  // Cache sesi jadi data awal, lalu langsung diperbarui
  const seed = (data) => (data === undefined ? {} : { initialData: data, initialDataUpdatedAt: 0 });

  const accessQ = useQuery({
    queryKey: ['access'],
    queryFn: async () => {
      const [menuList, permList] = await Promise.all([getUserMenus(), getUserPermissions()]);
      return toAccess(menuList, permList);
    },
    ...seed(cached?.access),
  });
  const access = accessQ.data ?? EMPTY_ACCESS;

  // Hanya dipanggil bila role berhak (selain itu 403); hak akses gagal dimuat = coba semua
  const allowed = (menu, perm) => !accessQ.isPending && (!accessQ.data || (access.menus.includes(menu) && access.permissions.includes(perm)));
  const usersOn = allowed('users', 'users.lihat');
  const dealersOn = allowed('dealers', 'dealers.lihat');
  const konsumenOn = allowed('konsumens', 'konsumens.lihat');

  const usersQ = useQuery({ queryKey: ['users'], queryFn: () => getUsers(), enabled: usersOn, ...seed(cached?.users) });
  const dealersQ = useQuery({ queryKey: ['dealers'], queryFn: getDealers, enabled: dealersOn, ...seed(cached?.dealers) });
  const totalQ = useQuery({ queryKey: ['konsumenTotal'], queryFn: getKonsumenTotal, enabled: konsumenOn });
  const statusQ = useQuery({ queryKey: ['konsumenStatus'], queryFn: getKonsumenStatusTotals, enabled: konsumenOn, refetchInterval: POLL_MS });
  const pendingUsersQ = useQuery({ queryKey: ['usersPending'], queryFn: () => getUsers('pending'), enabled: usersOn, refetchInterval: POLL_MS });

  // Nama & role dikenali dari konsumen yang diinput sendiri bila daftar user tidak boleh dilihat (ME, Kasir); disimpan di localStorage
  const rows = totalQ.data?.rows;
  const base = user?.name ? { name: user.name, role: user.role ?? null, id_dealer: user.id_dealer ?? null } : null;
  // id_me = penginput (role apa pun yang punya konsumens.tambah); nama & dealer diambil dari relasi `me`
  const mine = rows?.find((k) => k.id_me === user?.id && k.me?.name);
  const selfInfo = mine ? { name: mine.me.name, role: base?.role ?? null, id_dealer: mine.me.id_dealer ?? null } : base;
  const selfName = selfInfo?.name;
  const selfDealer = selfInfo?.id_dealer;
  useEffect(() => {
    if (!mine) return;
    try {
      localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user')), name: selfName, id_dealer: selfDealer }));
    } catch { /* abaikan */ }
  }, [mine, selfName, selfDealer]);

  const users = usersQ.data ?? [];
  const dealers = dealersQ.data ?? [];
  const konsumenStats = {
    total: totalQ.data?.total ?? cached?.konsumenStats?.total ?? 0,
    pending: statusQ.data?.pending ?? cached?.konsumenStats?.pending ?? NO_STATUS.pending,
    ditolak: statusQ.data?.ditolak ?? cached?.konsumenStats?.ditolak ?? NO_STATUS.ditolak,
  };

  const ready = !!accessQ.data && (!usersOn || !!usersQ.data) && (!dealersOn || !!dealersQ.data) && (!konsumenOn || (!!totalQ.data && !!statusQ.data));
  useEffect(() => {
    if (ready) writeCache(user?.id, users, dealers, access, konsumenStats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, usersQ.data, dealersQ.data, accessQ.data, totalQ.data, statusQ.data]);

  const loading = accessQ.isPending || [usersQ, dealersQ, totalQ].some((q) => q.isPending && q.fetchStatus !== 'idle');

  return {
    access, loading, selfInfo,
    allUsers: users, dealers, konsumenStats,
    recentKonsumen: rows ?? null,
    konsumenStatus: statusQ.data, pendingUsers: pendingUsersQ.data,
    watchAcc: usersOn, watchKonsumen: konsumenOn,
    setUsers: (next) => {
      qc.setQueryData(['users'], next);
      qc.setQueryData(['usersPending'], next.filter((u) => u.status === 'pending'));
    },
    setKonsumenStatus: (t) => qc.setQueryData(['konsumenStatus'], t),
    setDealers: (update) => qc.setQueryData(['dealers'], (list) => update(list ?? [])),
    reloadUsers: () => qc.invalidateQueries({ queryKey: ['users'] }),
    refetchAccess: () => accessQ.refetch(),
  };
}
