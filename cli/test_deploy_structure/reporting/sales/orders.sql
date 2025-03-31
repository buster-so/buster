SELECT o.*, c.customer_name, p.product_name 
FROM sales.orders o
JOIN core.customers c ON o.customer_id = c.id
JOIN core.products p ON o.product_id = p.id