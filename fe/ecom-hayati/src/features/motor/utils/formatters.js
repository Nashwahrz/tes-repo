export const formatRp = (val) =>
  `Rp ${new Intl.NumberFormat('id-ID').format(Number(val) || 0)}`;

export const formatThousands = (digits) => {
  if (digits === '' || digits == null) return '';
  return new Intl.NumberFormat('id-ID').format(Number(digits));
};
