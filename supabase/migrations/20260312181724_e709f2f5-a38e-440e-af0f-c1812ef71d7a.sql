-- Remove duplicate adhesions, keeping only the first one per helloasso_order_id
DELETE FROM public.adhesions
WHERE id NOT IN (
  SELECT DISTINCT ON (helloasso_order_id) id
  FROM public.adhesions
  WHERE helloasso_order_id IS NOT NULL AND helloasso_order_id <> ''
  ORDER BY helloasso_order_id, created_at ASC
)
AND helloasso_order_id IS NOT NULL
AND helloasso_order_id <> ''
AND id IN (
  SELECT a.id FROM public.adhesions a
  WHERE a.helloasso_order_id IN (
    SELECT helloasso_order_id FROM public.adhesions
    WHERE helloasso_order_id IS NOT NULL AND helloasso_order_id <> ''
    GROUP BY helloasso_order_id HAVING count(*) > 1
  )
  AND a.id NOT IN (
    SELECT DISTINCT ON (helloasso_order_id) id
    FROM public.adhesions
    WHERE helloasso_order_id IS NOT NULL AND helloasso_order_id <> ''
    ORDER BY helloasso_order_id, created_at ASC
  )
);