-- =========================================================
-- Amazon Duaa: Customer Order Tracking Function (RPC)
-- =========================================================

-- Function allowing customers to query order history without an account,
-- matching on order_number or normalized phone number.
CREATE OR REPLACE FUNCTION public.track_customer_order(
  p_order_number TEXT DEFAULT '',
  p_phone TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  clean_phone TEXT;
  clean_order TEXT;
BEGIN
  clean_order := lower(trim(coalesce(p_order_number, '')));
  clean_phone := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');

  IF clean_order = '' AND clean_phone = '' THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', o.id,
      'order_number', o.order_number,
      'customer_name', o.customer_name,
      'customer_phone', o.customer_phone,
      'city', o.city,
      'address', o.address,
      'notes', o.notes,
      'subtotal', o.subtotal,
      'discount_amount', o.discount_amount,
      'delivery_fee', o.delivery_fee,
      'total_amount', o.total_amount,
      'status', o.status,
      'items', o.items,
      'created_at', o.created_at,
      'whatsapp_sent', o.whatsapp_sent
    )
    ORDER BY o.created_at DESC
  ) INTO result
  FROM public.orders o
  WHERE (
    (clean_order <> '' AND lower(o.order_number) LIKE '%' || clean_order || '%')
    OR
    (clean_phone <> '' AND regexp_replace(o.customer_phone, '[^0-9]', '', 'g') LIKE '%' || right(clean_phone, 7) || '%')
  );

  RETURN coalesce(result, '[]'::jsonb);
END;
$$;

-- Grant execution to public/anon and authenticated users
REVOKE ALL ON FUNCTION public.track_customer_order(TEXT, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.track_customer_order(TEXT, TEXT) TO anon, authenticated;
