SELECT d.*, o.order_date, a.timestamp as api_time
FROM dashboards.dashboard_data d
JOIN sales.orders o ON d.order_id = o.id
JOIN external.api_imports a ON d.api_id = a.id