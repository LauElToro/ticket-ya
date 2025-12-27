// @ts-ignore - xlsx types may not be perfect
import * as XLSX from 'xlsx';

interface AccountingConfig {
  profitMargin: number;
  fixedCosts: number;
  variableCostsPercent: number;
  taxesPercent: number;
  commissionsPercent: number;
  platformFeePercent: number;
}

interface SalesData {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  ticketsSold: number;
  revenue: number;
  costs?: number;
  profit?: number;
  netProfit?: number;
}

interface MetricsData {
  events: any[];
  monthlySales: any[];
  metaMetrics?: any[];
  googleAdsMetrics?: any[];
}

// Función para calcular valores contables
export const calculateAccounting = (
  revenue: number,
  config: AccountingConfig
) => {
  const variableCosts = (revenue * config.variableCostsPercent) / 100;
  const taxes = (revenue * config.taxesPercent) / 100;
  const commissions = (revenue * config.commissionsPercent) / 100;
  const platformFee = (revenue * config.platformFeePercent) / 100;
  const totalCosts = config.fixedCosts + variableCosts + taxes + commissions + platformFee;
  const grossProfit = revenue - totalCosts;
  const netProfit = grossProfit - (revenue * config.profitMargin) / 100;

  return {
    revenue,
    fixedCosts: config.fixedCosts,
    variableCosts,
    taxes,
    commissions,
    platformFee,
    totalCosts,
    grossProfit,
    profitMargin: config.profitMargin,
    netProfit,
  };
};

// Obtener configuración contable del localStorage
export const getAccountingConfig = (): AccountingConfig => {
  const stored = localStorage.getItem('accounting-config');
  if (stored) {
    return JSON.parse(stored);
  }
  // Valores por defecto
  return {
    profitMargin: 30,
    fixedCosts: 0,
    variableCostsPercent: 15,
    taxesPercent: 21,
    commissionsPercent: 5,
    platformFeePercent: 10,
  };
};

// Exportar ventas a Excel (contable)
export const exportSalesToExcel = (
  salesData: SalesData[],
  config: AccountingConfig = getAccountingConfig()
) => {
  const workbook = XLSX.utils.book_new();

  // Hoja 1: Resumen General
  const summaryData = [
    ['REPORTE DE VENTAS - CONTABILIDAD'],
    ['Fecha de generación:', new Date().toLocaleDateString('es-AR')],
    [''],
    ['CONFIGURACIÓN CONTABLE'],
    ['% Ganancia Deseada:', `${config.profitMargin}%`],
    ['Costos Fijos:', `$${new Intl.NumberFormat('es-AR').format(config.fixedCosts)}`],
    ['% Costos Variables:', `${config.variableCostsPercent}%`],
    ['% Impuestos:', `${config.taxesPercent}%`],
    ['% Comisiones:', `${config.commissionsPercent}%`],
    ['% Comisión Plataforma:', `${config.platformFeePercent}%`],
    [''],
    ['RESUMEN GENERAL'],
  ];

  let totalRevenue = 0;
  let totalCosts = 0;
  let totalGrossProfit = 0;
  let totalNetProfit = 0;

  salesData.forEach((sale) => {
    const accounting = calculateAccounting(sale.revenue, config);
    totalRevenue += accounting.revenue;
    totalCosts += accounting.totalCosts;
    totalGrossProfit += accounting.grossProfit;
    totalNetProfit += accounting.netProfit;
  });

  summaryData.push(
    ['Total Ingresos Brutos:', `$${new Intl.NumberFormat('es-AR').format(totalRevenue)}`],
    ['Total Costos:', `$${new Intl.NumberFormat('es-AR').format(totalCosts)}`],
    ['Total Ganancia Bruta:', `$${new Intl.NumberFormat('es-AR').format(totalGrossProfit)}`],
    ['Total Ganancia Neta:', `$${new Intl.NumberFormat('es-AR').format(totalNetProfit)}`],
    [''],
    ['DETALLE POR EVENTO']
  );

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  // Hoja 2: Detalle de Ventas
  const detailHeaders = [
    'Evento',
    'Fecha',
    'Entradas Vendidas',
    'Ingresos Brutos',
    'Costos Fijos',
    'Costos Variables',
    'Impuestos',
    'Comisiones',
    'Comisión Plataforma',
    'Total Costos',
    'Ganancia Bruta',
    '% Ganancia',
    'Ganancia Neta',
  ];

  const detailData = salesData.map((sale) => {
    const accounting = calculateAccounting(sale.revenue, config);
    return [
      sale.eventTitle,
      sale.eventDate,
      sale.ticketsSold,
      accounting.revenue,
      accounting.fixedCosts,
      accounting.variableCosts,
      accounting.taxes,
      accounting.commissions,
      accounting.platformFee,
      accounting.totalCosts,
      accounting.grossProfit,
      `${accounting.profitMargin}%`,
      accounting.netProfit,
    ];
  });

  const detailSheet = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailData]);
  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detalle Ventas');

  // Descargar archivo
  const fileName = `ventas-contable-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// Exportar todas las métricas a Excel
export const exportAllMetricsToExcel = (
  metricsData: MetricsData,
  config: AccountingConfig = getAccountingConfig()
) => {
  const workbook = XLSX.utils.book_new();

  // Hoja 1: Resumen General
  const summaryData = [
    ['REPORTE COMPLETO DE MÉTRICAS'],
    ['Fecha de generación:', new Date().toLocaleDateString('es-AR')],
    [''],
    ['RESUMEN GENERAL'],
  ];

  const totalEvents = metricsData.events.length;
  const totalTickets = metricsData.events.reduce((sum, e) => sum + (e._count?.tickets || 0), 0);
  const totalRevenue = metricsData.events.reduce((sum, e) => sum + (e.revenue || 0), 0);

  summaryData.push(
    ['Total Eventos:', totalEvents],
    ['Total Entradas Vendidas:', totalTickets],
    ['Total Ingresos:', `$${new Intl.NumberFormat('es-AR').format(totalRevenue)}`],
    ['']
  );

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  // Hoja 2: Eventos
  const eventsHeaders = [
    'ID',
    'Título',
    'Fecha',
    'Ciudad',
    'Categoría',
    'Entradas Vendidas',
    'Ingresos',
    'Meta Pixel ID',
    'Google Ads ID',
  ];

  const eventsData = metricsData.events.map((event) => [
    event.id,
    event.title,
    new Date(event.date).toLocaleDateString('es-AR'),
    event.city,
    event.category,
    event._count?.tickets || 0,
    event.revenue || 0,
    event.metaPixelId || 'N/A',
    event.googleAdsId || 'N/A',
  ]);

  const eventsSheet = XLSX.utils.aoa_to_sheet([eventsHeaders, ...eventsData]);
  XLSX.utils.book_append_sheet(workbook, eventsSheet, 'Eventos');

  // Hoja 3: Ventas Mensuales
  if (metricsData.monthlySales.length > 0) {
    const monthlyHeaders = ['Mes', 'Ingresos'];
    const monthlyData = metricsData.monthlySales.map((sale) => [
      sale.month,
      sale.amount,
    ]);

    const monthlySheet = XLSX.utils.aoa_to_sheet([monthlyHeaders, ...monthlyData]);
    XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Ventas Mensuales');
  }

  // Hoja 4: Métricas Meta Pixel
  if (metricsData.metaMetrics && metricsData.metaMetrics.length > 0) {
    const metaHeaders = ['Evento', 'Impresiones', 'Clics', 'Conversiones', 'Gasto'];
    const metaData = metricsData.metaMetrics.map((metric) => [
      metric.eventTitle || 'N/A',
      metric.impressions || 0,
      metric.clicks || 0,
      metric.conversions || 0,
      metric.spend || 0,
    ]);

    const metaSheet = XLSX.utils.aoa_to_sheet([metaHeaders, ...metaData]);
    XLSX.utils.book_append_sheet(workbook, metaSheet, 'Meta Pixel');
  }

  // Hoja 5: Métricas Google Ads
  if (metricsData.googleAdsMetrics && metricsData.googleAdsMetrics.length > 0) {
    const adsHeaders = ['Evento', 'Impresiones', 'Clics', 'Conversiones', 'Gasto', 'CTR', 'CPC'];
    const adsData = metricsData.googleAdsMetrics.map((metric) => [
      metric.eventTitle || 'N/A',
      metric.impressions || 0,
      metric.clicks || 0,
      metric.conversions || 0,
      metric.spend || 0,
      metric.ctr || 0,
      metric.cpc || 0,
    ]);

    const adsSheet = XLSX.utils.aoa_to_sheet([adsHeaders, ...adsData]);
    XLSX.utils.book_append_sheet(workbook, adsSheet, 'Google Ads');
  }

  // Descargar archivo
  const fileName = `metricas-completas-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

