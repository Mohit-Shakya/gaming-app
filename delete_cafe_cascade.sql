-- SQL function to delete a cafe and all related records
-- This bypasses foreign key constraints by deleting in the correct order

CREATE OR REPLACE FUNCTION delete_cafe_cascade(cafe_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bookings_deleted INT;
  pricing_deleted INT;
  images_deleted INT;
  result JSON;
BEGIN
  -- Delete bookings first
  DELETE FROM bookings WHERE cafe_id = cafe_uuid;
  GET DIAGNOSTICS bookings_deleted = ROW_COUNT;

  -- Delete console pricing
  DELETE FROM console_pricing WHERE cafe_id = cafe_uuid;
  GET DIAGNOSTICS pricing_deleted = ROW_COUNT;

  -- Delete cafe images
  DELETE FROM cafe_images WHERE cafe_id = cafe_uuid;
  GET DIAGNOSTICS images_deleted = ROW_COUNT;

  -- Finally delete the cafe
  DELETE FROM cafes WHERE id = cafe_uuid;

  -- Return summary
  result := json_build_object(
    'success', true,
    'bookings_deleted', bookings_deleted,
    'pricing_deleted', pricing_deleted,
    'images_deleted', images_deleted
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_cafe_cascade(UUID) TO authenticated;

COMMENT ON FUNCTION delete_cafe_cascade IS 'Safely deletes a cafe and all related records in the correct order';
