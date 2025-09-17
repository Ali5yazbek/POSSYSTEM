// src/components/ReportsView.jsx
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Hash, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';

const ReportsView = ({ sales, allProducts }) => {
  const { t, i18n } = useTranslation();
  const [expandedRow, setExpandedRow] = useState(null);

  // --------- locale helpers ----------
  const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  const nf = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const cf = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'SAR',
        maximumFractionDigits: 2
      }),
    [locale]
  );
  const df = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
    [locale]
  );
  const formatSar = (v) => cf.format(Number(v || 0));

  // --------- helpers ----------
  const byId = useMemo(() => {
    const map = new Map();
    allProducts.forEach((p) => map.set(p.id, p));
    return map;
  }, [allProducts]);

  const getUnitCost = (product) => {
    if (!product) return 0;
    if (product.is_bundle && Array.isArray(product.items)) {
      return product.items.reduce((sum, bi) => {
        const child = byId.get(bi.id) || byId.get(bi.item_product_id);
        const qty = bi.quantityInBundle ?? bi.quantity ?? 1;
        const childCost = (child?.production_cost ?? 0) * qty;
        return sum + childCost;
      }, 0);
    }
    return product?.production_cost ?? 0;
  };

  const calcSaleCost = (sale) => {
    return sale.items.reduce((acc, it) => {
      const p = byId.get(it.product_id);
      return acc + getUnitCost(p) * it.quantity;
    }, 0);
  };

  const paymentLabel = (p) => {
    const v = (p || '').toLowerCase();
    if (v === 'cash') return t('payment.cash');
    if (v === 'card') return t('payment.card');
    return t('payment.unknown');
  };

  // --------- KPIs ----------
  const kpis = useMemo(() => {
    const revenue = sales.reduce((acc, s) => acc + (s.total ?? 0), 0);
    const cost = sales.reduce((acc, s) => acc + calcSaleCost(s), 0);
    const profit = revenue - cost;
    const tx = sales.length;
    const items = sales.reduce((acc, s) => acc + s.items.reduce((a, i) => a + i.quantity, 0), 0);
    return {
      revenue,
      cost,
      profit,
      marginPct: revenue ? (profit / revenue) * 100 : 0,
      transactions: tx,
      avgSale: tx ? revenue / tx : 0,
      itemsPerSale: tx ? items / tx : 0
    };
  }, [sales, allProducts]);

  // --------- Trend (last 12 months) ----------
  const monthKey = (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
  };

  const last12Keys = useMemo(() => {
    const arr = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      arr.push({ key: monthKey(d), label: d.toLocaleString(locale, { month: 'short' }) });
    }
    return arr;
  }, [locale]);

  const revenueByMonth = useMemo(() => {
    const map = new Map(last12Keys.map((m) => [m.key, 0]));
    sales.forEach((s) => {
      const key = monthKey(s.created_at ?? s.date ?? new Date());
      if (map.has(key)) map.set(key, (map.get(key) || 0) + (s.total ?? 0));
    });
    return last12Keys.map((m) => ({ label: m.label, value: map.get(m.key) || 0 }));
  }, [sales, last12Keys]);

  // --------- Payment methods donut ----------
  const paymentShare = useMemo(() => {
    const m = new Map();
    sales.forEach((s) => m.set(s.payment, (m.get(s.payment) || 0) + (s.total ?? 0)));
    return Array.from(m.entries()).map(([raw, value]) => ({
      label: paymentLabel(raw),
      value
    }));
  }, [sales, i18n.language]);

  // --------- Category revenue donut ----------
  const categoryShare = useMemo(() => {
    const m = new Map();
    sales.forEach((s) => {
      s.items.forEach((it) => {
        const p = byId.get(it.product_id);
        const cat = p?.category || t('common.uncategorized');
        const v = it.quantity * (it.price_at_sale ?? p?.price ?? 0);
        m.set(cat, (m.get(cat) || 0) + v);
      });
    });
    return Array.from(m.entries()).map(([label, value]) => ({ label, value }));
  }, [sales, allProducts, i18n.language, t]);

  // --------- Top products table ----------
  const topProducts = useMemo(() => {
    const m = new Map();
    sales.forEach((s) => {
      s.items.forEach((it) => {
        const key = it.product_id;
        const p = byId.get(key);
        const rev = it.quantity * (it.price_at_sale ?? p?.price ?? 0);
        m.set(key, {
          id: key,
          name: p?.name || `#${key}`,
          revenue: (m.get(key)?.revenue || 0) + rev,
          qty: (m.get(key)?.qty || 0) + it.quantity
        });
      });
    });
    return Array.from(m.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [sales, allProducts]);

  const handleRowClick = (saleId) => {
    setExpandedRow(expandedRow === saleId ? null : saleId);
  };

  const numAlign = i18n.language === 'ar' ? 'text-left' : 'text-right';

  return (
    <div className="p-6 h-full flex flex-col">
      <h2 className="text-3xl font-bold mb-6">{t('reports.salesAnalytics')}</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KPI title={t('reports.revenue')} value={formatSar(kpis.revenue)} icon={<DollarSign />} color="from-emerald-500 to-emerald-600" />
        <KPI title={t('reports.cost')} value={formatSar(kpis.cost)} icon={<DollarSign />} color="from-rose-500 to-rose-600" />
        <KPI title={t('reports.profit')} value={formatSar(kpis.profit)} icon={<DollarSign />} color="from-indigo-500 to-indigo-600" />
        <KPI title={t('reports.margin')} value={`${kpis.marginPct.toFixed(1)}%`} icon={<CreditCard />} color="from-amber-500 to-amber-600" />
        <KPI title={t('reports.transactions')} value={nf.format(kpis.transactions)} icon={<Hash />} color="from-sky-500 to-sky-600" />
        <KPI title={t('reports.itemsPerSale')} value={nf.format(kpis.itemsPerSale.toFixed(2))} icon={<Hash />} color="from-fuchsia-500 to-fuchsia-600" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <KPIWide title={t('reports.avgSaleValue')} value={formatSar(kpis.avgSale)} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Card title={t('reports.revenueTrend')}>
          <BarChart data={revenueByMonth} height={180} formatSarFn={formatSar} />
        </Card>

        <Card title={t('reports.paymentShare')}>
          <DonutChart data={paymentShare} formatSarFn={formatSar} />
        </Card>

        <Card title={t('reports.categoryShare')}>
          <DonutChart data={categoryShare} formatSarFn={formatSar} />
        </Card>
      </div>

      {/* Top Products */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <Card title={t('reports.topProducts')}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700 text-sm text-gray-300">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-2">{t('reports.product')}</th>
                <th className="py-2 pr-2 text-center">{t('reports.qty')}</th>
                <th className={`py-2 pr-2 ${numAlign}`}>{t('reports.revenue')}</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((row, idx) => (
                <tr key={row.id} className="border-b border-gray-800">
                  <td className="py-2 pr-2 text-gray-400">{idx + 1}</td>
                  <td className="py-2 pr-2">{row.name}</td>
                  <td className="py-2 pr-2 text-center">{nf.format(row.qty)}</td>
                  <td className={`py-2 pr-2 ${numAlign}`}>{formatSar(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Quick Summary */}
        <Card title={t('reports.summary')}>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>{t('reports.totalRevenue')}</span><span className="font-semibold">{formatSar(kpis.revenue)}</span></li>
            <li className="flex justify-between"><span>{t('reports.totalCost')}</span><span className="font-semibold">{formatSar(kpis.cost)}</span></li>
            <li className="flex justify-between"><span>{t('reports.grossProfit')}</span><span className="font-semibold">{formatSar(kpis.profit)}</span></li>
            <li className="flex justify-between"><span>{t('reports.grossMargin')}</span><span className="font-semibold">{kpis.marginPct.toFixed(1)}%</span></li>
            <li className="flex justify-between"><span>{t('reports.transactions')}</span><span className="font-semibold">{nf.format(kpis.transactions)}</span></li>
            <li className="flex justify-between"><span>{t('reports.averageSale')}</span><span className="font-semibold">{formatSar(kpis.avgSale)}</span></li>
          </ul>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="flex-1 overflow-y-auto bg-gray-900 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold p-4">{t('reports.recentTransactions')}</h3>
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-gray-900">
            <tr className="border-b border-gray-700">
              <th className="p-4 w-1/12"></th>
              <th className="p-4">{t('reports.transactionId')}</th>
              <th className="p-4">{t('reports.date')}</th>
              <th className="p-4">{t('reports.items')}</th>
              <th className="p-4">{t('reports.payment')}</th>
              <th className={`p-4 ${numAlign}`}>{t('reports.total')}</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => {
              const saleCost = calcSaleCost(sale);
              return (
                <React.Fragment key={sale.id}>
                  <tr onClick={() => handleRowClick(sale.id)} className="border-b border-gray-800 hover:bg-gray-700 cursor-pointer">
                    <td className="p-4 text-center">
                      {expandedRow === sale.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </td>
                    <td className="p-4 font-mono text-sm">{sale.id}</td>
                    <td className="p-4">{sale.created_at ? df.format(new Date(sale.created_at)) : sale.date}</td>
                    <td className="p-4">{nf.format(sale.items.reduce((acc, item) => acc + item.quantity, 0))}</td>
                    <td className="p-4">{paymentLabel(sale.payment)}</td>
                    <td className={`p-4 font-semibold ${numAlign}`}>{formatSar(sale.total ?? 0)}</td>
                  </tr>
                  {expandedRow === sale.id && (
                    <tr className="bg-gray-800/50">
                      <td colSpan="6" className="p-4">
                        <div className="p-4 bg-gray-900 rounded-md">
                          <h4 className="font-bold mb-2">{t('reports.transactionDetails')}</h4>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-700">
                                <th className="p-2 text-left">{t('reports.productName')}</th>
                                <th className="p-2 text-center">{t('reports.quantity')}</th>
                                <th className={`p-2 ${numAlign}`}>{t('reports.priceAtSale')}</th>
                                <th className={`p-2 ${numAlign}`}>{t('reports.subtotal')}</th>
                                <th className={`p-2 ${numAlign}`}>{t('reports.cost')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sale.items.map((item) => {
                                const p = byId.get(item.product_id);
                                const lineRev = item.quantity * (item.price_at_sale ?? p?.price ?? 0);
                                const lineCost = getUnitCost(p) * item.quantity;
                                return (
                                  <tr key={item.id}>
                                    <td className="p-2">{p ? p.name : t('reports.unknownProduct')}</td>
                                    <td className="p-2 text-center">{nf.format(item.quantity)}</td>
                                    <td className={`p-2 ${numAlign}`}>{formatSar(item.price_at_sale ?? 0)}</td>
                                    <td className={`p-2 ${numAlign}`}>{formatSar(lineRev)}</td>
                                    <td className={`p-2 ${numAlign} text-gray-300`}>{formatSar(lineCost)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                            <div className="flex justify-between bg-gray-800 rounded px-3 py-2">
                              <span>{t('reports.saleTotal')}</span>
                              <span className="font-semibold">{formatSar(sale.total ?? 0)}</span>
                            </div>
                            <div className="flex justify-between bg-gray-800 rounded px-3 py-2">
                              <span>{t('reports.saleCost')}</span>
                              <span className="font-semibold">{formatSar(saleCost)}</span>
                            </div>
                            <div className="flex justify-between bg-gray-800 rounded px-3 py-2">
                              <span>{t('reports.profit')}</span>
                              <span className="font-semibold">{formatSar((sale.total ?? 0) - saleCost)}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ------------------ small UI bits ------------------ */
const KPI = ({ title, value, icon, color }) => (
  <div className={`bg-gradient-to-br ${color} p-4 rounded-lg shadow-lg flex items-center justify-between`}>
    <div>
      <p className="text-xs text-white/80">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
    <div className="text-white/60">{icon}</div>
  </div>
);

const KPIWide = ({ title, value }) => (
  <div className="bg-gray-900 p-4 rounded-lg shadow-lg flex items-center justify-between">
    <p className="text-sm text-white/80">{title}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

const Card = ({ title, children }) => (
  <div className="bg-gray-900 p-4 rounded-lg shadow-lg">
    <h4 className="font-bold mb-3">{title}</h4>
    {children}
  </div>
);

/* ------------------ Charts (no libs) ------------------ */
const BarChart = ({ data, height = 160, formatSarFn }) => {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ height }} className="flex items-end gap-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center">
          <div
            className="w-full bg-indigo-500/80 rounded-t"
            style={{ height: `${(d.value / max) * (height - 30)}px` }}
            title={`${d.label}: ${formatSarFn ? formatSarFn(d.value) : d.value}`}
          />
          <span className="mt-2 text-xs text-gray-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

const DonutChart = ({ data, formatSarFn }) => {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const r = 52;
  const c = 2 * Math.PI * r;
  let acc = 0;

  const palette = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#14B8A6', '#EAB308', '#F97316', '#A3E635'];

  return (
    <div className="flex gap-4 items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} stroke="#1F2937" strokeWidth="20" fill="none" />
        {data.map((seg, idx) => {
          const ratio = seg.value / total;
          const dash = ratio * c;
          const dasharray = `${dash} ${c - dash}`;
          const dashoffset = (c * (1 - acc)) % c;
          acc += ratio;
          return (
            <circle
              key={idx}
              cx="70"
              cy="70"
              r={r}
              stroke={palette[idx % palette.length]}
              strokeWidth="20"
              fill="none"
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              transform="rotate(-90 70 70)"
            />
          );
        })}
        <text x="70" y="74" textAnchor="middle" className="fill-white" fontSize="12" fontWeight="600">
          {formatSarFn ? formatSarFn(total) : total}
        </text>
      </svg>
      <div className="flex-1">
        <ul className="space-y-1 text-sm">
          {data
            .slice()
            .sort((a, b) => b.value - a.value)
            .map((seg, idx) => (
              <li key={idx} className="flex justify-between items-center">
                <span className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded mr-2" style={{ background: palette[idx % palette.length] }} />
                  {seg.label}
                </span>
                <span className="text-gray-300">{((seg.value / total) * 100).toFixed(1)}%</span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default ReportsView;
