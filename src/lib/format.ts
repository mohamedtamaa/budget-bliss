export const fmtMoney = (n: number, currency = "EGP") => {
  const num = Number(n) || 0;
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(num);
};

export const fmtNumber = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(n) || 0);
