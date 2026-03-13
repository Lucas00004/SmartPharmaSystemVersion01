const db = require('../config/db');

const getRiskLevel = (daysLeft) => {
  if (daysLeft < 0) return 'EXPIRED';
  if (daysLeft <= 30) return 'HIGH';
  if (daysLeft <= 90) return 'MEDIUM';
  return 'LOW';
};

const dashboardController = {
  summary: async (req, res) => {
    try {
      const [weeklyRevenueRows] = await db.query(
        `
        SELECT COALESCE(SUM(hi.quantity * COALESCE(p.selling_price, hi.purchase_price, 0)), 0) AS weekly_revenue
        FROM history_import hi
        LEFT JOIN product p ON p.product_id = hi.product_id
        WHERE YEARWEEK(hi.created_at, 1) = YEARWEEK(CURDATE(), 1)
        `
      );

      const [expiringRows] = await db.query(
        `
        SELECT COUNT(*) AS expiring_products
        FROM product
        WHERE status = 1
          AND quantity > 0
          AND expiry_date IS NOT NULL
          AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        `
      );

      const [newOrdersRows] = await db.query(
        `
        SELECT COUNT(*) AS new_orders
        FROM history_import
        WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)
        `
      );

      const [monthlyImportRows] = await db.query(
        `
        SELECT COALESCE(SUM(quantity), 0) AS monthly_import
        FROM history_import
        WHERE YEAR(created_at) = YEAR(CURDATE())
          AND MONTH(created_at) = MONTH(CURDATE())
        `
      );

      const [weeklySeriesRows] = await db.query(
        `
        SELECT DATE(created_at) AS day, COALESCE(SUM(quantity), 0) AS qty
        FROM history_import
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
        `
      );

      const [alertsRows] = await db.query(
        `
        SELECT product_id, product_name, expiry_date, DATEDIFF(expiry_date, CURDATE()) AS days_left
        FROM product
        WHERE status = 1
          AND quantity > 0
          AND expiry_date IS NOT NULL
          AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
        ORDER BY expiry_date ASC
        LIMIT 10
        `
      );

      const byDay = new Map();
      weeklySeriesRows.forEach((row) => {
        const key = new Date(row.day).toISOString().slice(0, 10);
        byDay.set(key, Number(row.qty) || 0);
      });

      const chartLabels = [];
      const chartValues = [];
      for (let i = 6; i >= 0; i -= 1) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        chartLabels.push(d.toLocaleDateString('vi-VN', { weekday: 'short' }));
        chartValues.push(byDay.get(key) || 0);
      }

      const expiryAlerts = alertsRows.map((row) => {
        const daysLeft = Number(row.days_left);
        return {
          product_id: row.product_id,
          product_name: row.product_name,
          expiry_date: row.expiry_date,
          days_left: daysLeft,
          risk_level: getRiskLevel(daysLeft),
        };
      });

      return res.status(200).json({
        stats: {
          weekly_revenue: Number(weeklyRevenueRows?.[0]?.weekly_revenue || 0),
          expiring_products: Number(expiringRows?.[0]?.expiring_products || 0),
          new_orders: Number(newOrdersRows?.[0]?.new_orders || 0),
          monthly_import: Number(monthlyImportRows?.[0]?.monthly_import || 0),
        },
        chart: {
          labels: chartLabels,
          values: chartValues,
          label: 'Số lượng phát sinh theo ngày',
        },
        expiry_alerts: expiryAlerts,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
};

module.exports = dashboardController;
