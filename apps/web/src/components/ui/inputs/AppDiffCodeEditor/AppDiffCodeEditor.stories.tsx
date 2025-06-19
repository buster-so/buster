import type { Meta, StoryObj } from '@storybook/react';
import { AppDiffCodeEditor } from './AppDiffCodeEditor';

const meta: Meta<typeof AppDiffCodeEditor> = {
  title: 'UI/Inputs/AppDiffCodeEditor',
  component: AppDiffCodeEditor,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    viewMode: {
      control: 'radio',
      options: ['side-by-side', 'inline'],
      defaultValue: 'side-by-side',
      description: 'Controls whether the diff is displayed side-by-side or inline'
    }
  },
  decorators: [
    (Story) => (
      <div className="min-h-[500px] min-w-[80vw]">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof AppDiffCodeEditor>;

const originalYaml = `# Original YAML configuration
server:
  port: 8080
  host: localhost
database:
  url: jdbc:mysql://localhost:3306/mydb
  username: admin
  password: secret
logging:
  level: INFO
  path: /var/logs`;

const modifiedYaml = `# Updated YAML configuration
server:
  port: 9090
  host: localhost
  timeout: 30s
database:
  url: jdbc:mysql://localhost:3306/mydb
  username: admin
  password: secret
  pool:
    maxConnections: 20
    minIdle: 5
logging:
  level: DEBUG
  path: /var/logs/app`;

const originalSql = `-- Original SQL query
SELECT 
  customers.id,
  customers.name,
  orders.order_date
FROM customers
JOIN orders ON customers.id = orders.customer_id
WHERE orders.status = 'completed'
ORDER BY orders.order_date DESC;`;

const modifiedSql = `-- Updated SQL query
SELECT 
  customers.id,
  customers.name,
  customers.email,
  orders.order_date,
  orders.total_amount
FROM customers
JOIN orders ON customers.id = orders.customer_id
LEFT JOIN order_items ON orders.id = order_items.order_id
WHERE orders.status = 'completed'
  AND orders.total_amount > 100
GROUP BY customers.id
ORDER BY orders.order_date DESC
LIMIT 100;`;

export const Default: Story = {
  args: {
    original: originalYaml,
    modified: modifiedYaml,
    height: '300px',
    language: 'yaml',
    variant: 'bordered',
    viewMode: 'side-by-side'
  }
};

export const InlineView: Story = {
  args: {
    original: originalYaml,
    modified: modifiedYaml,
    height: '300px',
    language: 'yaml',
    variant: 'bordered',
    viewMode: 'inline'
  }
};

export const SQL: Story = {
  args: {
    original: originalSql,
    modified: modifiedSql,
    height: '300px',
    language: 'sql',
    variant: 'bordered',
    viewMode: 'side-by-side'
  }
};

export const SQLInline: Story = {
  args: {
    original: originalSql,
    modified: modifiedSql,
    height: '300px',
    language: 'sql',
    variant: 'bordered',
    viewMode: 'inline'
  }
};

export const ReadOnly: Story = {
  args: {
    original: originalYaml,
    modified: modifiedYaml,
    height: '300px',
    language: 'yaml',
    readOnly: true,
    variant: 'bordered',
    readOnlyMessage: 'This is a read-only view',
    viewMode: 'side-by-side'
  }
};

export const TallerView: Story = {
  args: {
    original: `-- Original complex SQL query (Legacy version)
/*
 * This query fetches customer order analytics with detailed breakdowns
 * For reporting dashboard version 1.0
 * Created: 2022-01-15
 * Author: Database Team
 */
WITH customer_segments AS (
  SELECT
    customer_id,
    CASE
      WHEN lifetime_value > 10000 THEN 'premium'
      WHEN lifetime_value > 5000 THEN 'gold'
      WHEN lifetime_value > 1000 THEN 'silver'
      ELSE 'bronze'
    END AS segment,
    signup_date,
    last_order_date,
    DATEDIFF(last_order_date, signup_date) AS customer_age_days
  FROM customer_metrics
  WHERE is_active = 1
    AND region_code IN ('US', 'CA', 'MX')
    AND signup_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 2 YEAR)
),

order_summary AS (
  SELECT
    o.order_id,
    o.customer_id,
    o.order_date,
    o.total_amount,
    o.status,
    o.payment_method,
    o.shipping_method,
    COUNT(oi.item_id) AS total_items,
    SUM(oi.quantity * oi.unit_price) AS items_subtotal,
    SUM(oi.discount_amount) AS total_discount,
    (o.total_amount - SUM(oi.quantity * oi.unit_price) + SUM(oi.discount_amount)) AS shipping_cost
  FROM orders o
  JOIN order_items oi ON o.order_id = oi.order_id
  WHERE o.order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
    AND o.status != 'cancelled'
  GROUP BY o.order_id, o.customer_id, o.order_date, o.total_amount, o.status, o.payment_method, o.shipping_method
),

product_categories AS (
  SELECT
    oi.order_id,
    p.category_id,
    c.category_name,
    COUNT(oi.item_id) AS items_count,
    SUM(oi.quantity) AS total_quantity,
    SUM(oi.quantity * oi.unit_price) AS category_subtotal
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  JOIN categories c ON p.category_id = c.category_id
  GROUP BY oi.order_id, p.category_id, c.category_name
)

SELECT
  cs.customer_id,
  c.first_name,
  c.last_name,
  c.email,
  c.city,
  c.state,
  c.country,
  cs.segment,
  cs.customer_age_days,
  COUNT(os.order_id) AS total_orders,
  SUM(os.total_amount) AS total_spent,
  AVG(os.total_amount) AS average_order_value,
  MAX(os.order_date) AS last_order_date,
  MIN(os.order_date) AS first_order_date,
  SUM(CASE WHEN os.payment_method = 'credit_card' THEN 1 ELSE 0 END) AS credit_card_orders,
  SUM(CASE WHEN os.payment_method = 'paypal' THEN 1 ELSE 0 END) AS paypal_orders,
  SUM(CASE WHEN os.shipping_method = 'express' THEN 1 ELSE 0 END) AS express_shipping_count,
  STRING_AGG(DISTINCT pc.category_name, ', ') AS purchased_categories,
  AVG(os.total_items) AS avg_items_per_order,
  SUM(os.total_discount) / SUM(os.items_subtotal) AS discount_ratio
FROM customer_segments cs
JOIN customers c ON cs.customer_id = c.customer_id
JOIN order_summary os ON cs.customer_id = os.customer_id
LEFT JOIN product_categories pc ON os.order_id = pc.order_id
WHERE cs.segment IN ('premium', 'gold')
  AND os.total_amount > 50
GROUP BY 
  cs.customer_id,
  c.first_name,
  c.last_name,
  c.email,
  c.city,
  c.state,
  c.country,
  cs.segment,
  cs.customer_age_days
HAVING COUNT(os.order_id) >= 3
ORDER BY total_spent DESC, last_order_date DESC
LIMIT 500;`,
    modified: `-- Updated complex SQL query (New optimization)
/*
 * This query fetches customer order analytics with detailed breakdowns
 * For reporting dashboard version 2.0
 * Created: 2023-03-20
 * Author: Database Team
 * Changes: Added customer retention metrics, product affinity analysis,
 *          and performance optimizations for large datasets
 */
WITH customer_segments AS (
  SELECT
    customer_id,
    CASE
      WHEN lifetime_value > 15000 THEN 'elite'
      WHEN lifetime_value > 10000 THEN 'premium'
      WHEN lifetime_value > 5000 THEN 'gold'
      WHEN lifetime_value > 1000 THEN 'silver'
      ELSE 'bronze'
    END AS segment,
    signup_date,
    last_order_date,
    DATEDIFF(last_order_date, signup_date) AS customer_age_days,
    lifetime_order_count,
    lifetime_value,
    NTILE(10) OVER (ORDER BY lifetime_value DESC) AS value_decile,
    DATEDIFF(CURRENT_DATE(), last_order_date) AS days_since_last_order
  FROM customer_metrics
  WHERE is_active = 1
    AND region_code IN ('US', 'CA', 'MX', 'UK', 'FR', 'DE')
    AND signup_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
),

retention_metrics AS (
  SELECT
    customer_id,
    COUNT(DISTINCT DATE_FORMAT(order_date, '%Y-%m')) AS active_months,
    COUNT(DISTINCT CASE WHEN order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY) THEN order_id END) AS orders_last_30_days,
    COUNT(DISTINCT CASE WHEN order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY) THEN order_id END) AS orders_last_90_days,
    COUNT(DISTINCT CASE WHEN order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 365 DAY) THEN order_id END) AS orders_last_year,
    MAX(CASE WHEN order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY) THEN total_amount ELSE 0 END) AS max_order_value_90_days
  FROM orders
  WHERE order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
    AND status NOT IN ('cancelled', 'refunded')
  GROUP BY customer_id
),

order_summary AS (
  SELECT
    o.order_id,
    o.customer_id,
    o.order_date,
    o.total_amount,
    o.status,
    o.payment_method,
    o.shipping_method,
    o.device_type,
    o.source_channel,
    o.promo_code_id,
    COUNT(oi.item_id) AS total_items,
    SUM(oi.quantity * oi.unit_price) AS items_subtotal,
    SUM(oi.discount_amount) AS total_discount,
    (o.total_amount - SUM(oi.quantity * oi.unit_price) + SUM(oi.discount_amount)) AS shipping_cost,
    LAG(o.order_date) OVER (PARTITION BY o.customer_id ORDER BY o.order_date) AS previous_order_date,
    DATEDIFF(o.order_date, LAG(o.order_date) OVER (PARTITION BY o.customer_id ORDER BY o.order_date)) AS days_since_previous_order
  FROM orders o
  JOIN order_items oi ON o.order_id = oi.order_id
  WHERE o.order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 180 DAY)
    AND o.status NOT IN ('cancelled', 'refunded')
  GROUP BY 
    o.order_id, 
    o.customer_id, 
    o.order_date, 
    o.total_amount, 
    o.status, 
    o.payment_method, 
    o.shipping_method,
    o.device_type,
    o.source_channel,
    o.promo_code_id
),

product_categories AS (
  SELECT
    oi.order_id,
    oi.customer_id,
    p.category_id,
    c.category_name,
    p.brand_id,
    b.brand_name,
    COUNT(oi.item_id) AS items_count,
    SUM(oi.quantity) AS total_quantity,
    SUM(oi.quantity * oi.unit_price) AS category_subtotal,
    ROW_NUMBER() OVER (PARTITION BY oi.customer_id ORDER BY SUM(oi.quantity * oi.unit_price) DESC) AS category_rank
  FROM order_items oi
  JOIN products p ON oi.product_id = p.product_id
  JOIN categories c ON p.category_id = c.category_id
  JOIN brands b ON p.brand_id = b.brand_id
  GROUP BY oi.order_id, oi.customer_id, p.category_id, c.category_name, p.brand_id, b.brand_name
)

SELECT
  cs.customer_id,
  c.first_name,
  c.last_name,
  c.email,
  c.city,
  c.state,
  c.country,
  c.phone,
  cs.segment,
  cs.value_decile,
  cs.customer_age_days,
  cs.days_since_last_order,
  rm.active_months,
  rm.orders_last_30_days,
  rm.orders_last_90_days,
  rm.orders_last_year,
  rm.max_order_value_90_days,
  COUNT(os.order_id) AS total_orders,
  SUM(os.total_amount) AS total_spent,
  AVG(os.total_amount) AS average_order_value,
  MAX(os.total_amount) AS max_order_value,
  MIN(os.total_amount) AS min_order_value,
  STDDEV(os.total_amount) AS order_value_stddev,
  MAX(os.order_date) AS last_order_date,
  MIN(os.order_date) AS first_order_date,
  AVG(os.days_since_previous_order) AS avg_days_between_orders,
  SUM(CASE WHEN os.payment_method = 'credit_card' THEN 1 ELSE 0 END) AS credit_card_orders,
  SUM(CASE WHEN os.payment_method = 'paypal' THEN 1 ELSE 0 END) AS paypal_orders,
  SUM(CASE WHEN os.payment_method = 'apple_pay' THEN 1 ELSE 0 END) AS apple_pay_orders,
  SUM(CASE WHEN os.payment_method = 'google_pay' THEN 1 ELSE 0 END) AS google_pay_orders,
  SUM(CASE WHEN os.shipping_method = 'express' THEN 1 ELSE 0 END) AS express_shipping_count,
  SUM(CASE WHEN os.shipping_method = 'standard' THEN 1 ELSE 0 END) AS standard_shipping_count,
  SUM(CASE WHEN os.device_type = 'mobile' THEN 1 ELSE 0 END) AS mobile_orders,
  SUM(CASE WHEN os.device_type = 'desktop' THEN 1 ELSE 0 END) AS desktop_orders,
  SUM(CASE WHEN os.device_type = 'tablet' THEN 1 ELSE 0 END) AS tablet_orders,
  STRING_AGG(DISTINCT os.source_channel, ', ' ORDER BY os.source_channel) AS order_sources,
  STRING_AGG(DISTINCT pc.category_name, ', ' ORDER BY pc.category_name) AS purchased_categories,
  MAX(CASE WHEN pc.category_rank = 1 THEN pc.category_name END) AS top_category,
  MAX(CASE WHEN pc.category_rank = 1 THEN pc.category_subtotal END) AS top_category_spent,
  AVG(os.total_items) AS avg_items_per_order,
  SUM(os.total_items) AS total_items_purchased,
  SUM(os.total_discount) / SUM(os.items_subtotal) AS discount_ratio,
  SUM(CASE WHEN os.promo_code_id IS NOT NULL THEN 1 ELSE 0 END) AS orders_with_promo
FROM customer_segments cs
JOIN customers c ON cs.customer_id = c.customer_id
JOIN retention_metrics rm ON cs.customer_id = rm.customer_id
JOIN order_summary os ON cs.customer_id = os.customer_id
LEFT JOIN product_categories pc ON os.order_id = pc.order_id AND pc.customer_id = cs.customer_id
WHERE cs.segment IN ('elite', 'premium', 'gold')
  AND os.total_amount > 75
  AND rm.orders_last_year >= 2
GROUP BY 
  cs.customer_id,
  c.first_name,
  c.last_name,
  c.email,
  c.city,
  c.state,
  c.country,
  c.phone,
  cs.segment,
  cs.value_decile,
  cs.customer_age_days,
  cs.days_since_last_order,
  rm.active_months,
  rm.orders_last_30_days,
  rm.orders_last_90_days,
  rm.orders_last_year,
  rm.max_order_value_90_days
HAVING COUNT(os.order_id) >= 3
ORDER BY total_spent DESC, last_order_date DESC
LIMIT 1000;`,
    height: '600px',
    language: 'sql',
    variant: 'bordered',
    viewMode: 'side-by-side'
  }
};

export const EmptyEditor: Story = {
  args: {
    height: '300px',
    language: 'yaml',
    variant: 'bordered',
    viewMode: 'side-by-side'
  }
};
