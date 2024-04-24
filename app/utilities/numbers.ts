const currencyFormatter = Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
});

export const formatCurrency = (num: number) => currencyFormatter.format(num);
