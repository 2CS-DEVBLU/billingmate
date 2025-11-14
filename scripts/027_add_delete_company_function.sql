-- Create a function to delete a company and all related data
-- This function runs with elevated privileges and bypasses RLS

CREATE OR REPLACE FUNCTION delete_company_cascade(p_company_id UUID)
RETURNS JSON AS $$
DECLARE
  v_deleted_counts JSON;
  v_company_name TEXT;
  v_invitations_count INT;
  v_alerts_count INT;
  v_anomalies_count INT;
  v_sync_logs_count INT;
  v_resource_costs_count INT;
  v_billing_count INT;
  v_recommendations_count INT;
  v_cost_data_count INT;
  v_cloud_accounts_count INT;
  v_integrations_count INT;
  v_subscriptions_count INT;
  v_profiles_count INT;
  v_company_count INT;
BEGIN
  -- Get company name for logging
  SELECT name INTO v_company_name FROM companies WHERE id = p_company_id;
  
  IF v_company_name IS NULL THEN
    RETURN json_build_object('error', 'Company not found');
  END IF;

  -- Delete in order respecting foreign keys
  
  -- 1. Delete user invitations
  DELETE FROM user_invitations WHERE company_id = p_company_id;
  GET DIAGNOSTICS v_invitations_count = ROW_COUNT;
  
  -- 2. Delete alerts
  DELETE FROM alerts WHERE company_id = p_company_id;
  GET DIAGNOSTICS v_alerts_count = ROW_COUNT;
  
  -- 3. Delete cost anomalies
  DELETE FROM cost_anomalies WHERE company_id = p_company_id;
  GET DIAGNOSTICS v_anomalies_count = ROW_COUNT;
  
  -- 4. Delete sync logs
  DELETE FROM sync_logs WHERE company_id = p_company_id;
  GET DIAGNOSTICS v_sync_logs_count = ROW_COUNT;
  
  -- 5. Delete resource costs (via billing history)
  DELETE FROM resource_costs 
  WHERE billing_history_id IN (
    SELECT id FROM billing_history WHERE company_id = p_company_id
  );
  GET DIAGNOSTICS v_resource_costs_count = ROW_COUNT;
  
  -- 6. Delete billing history
  DELETE FROM billing_history WHERE company_id = p_company_id;
  GET DIAGNOSTICS v_billing_count = ROW_COUNT;
  
  -- 7. Delete recommendations (via cloud accounts)
  DELETE FROM recommendations 
  WHERE cloud_account_id IN (
    SELECT id FROM cloud_accounts WHERE company_id = p_company_id
  );
  GET DIAGNOSTICS v_recommendations_count = ROW_COUNT;
  
  -- 8. Delete cost data (via cloud accounts)
  DELETE FROM cost_data 
  WHERE cloud_account_id IN (
    SELECT id FROM cloud_accounts WHERE company_id = p_company_id
  );
  GET DIAGNOSTICS v_cost_data_count = ROW_COUNT;
  
  -- 9. Delete cloud accounts
  DELETE FROM cloud_accounts WHERE company_id = p_company_id;
  GET DIAGNOSTICS v_cloud_accounts_count = ROW_COUNT;
  
  -- 10. Delete cloud integrations
  DELETE FROM cloud_integrations WHERE company_id = p_company_id;
  GET DIAGNOSTICS v_integrations_count = ROW_COUNT;
  
  -- 11. Delete subscriptions
  DELETE FROM subscriptions WHERE company_id = p_company_id;
  GET DIAGNOSTICS v_subscriptions_count = ROW_COUNT;
  
  -- 12. Delete profiles
  DELETE FROM profiles WHERE company_id = p_company_id;
  GET DIAGNOSTICS v_profiles_count = ROW_COUNT;
  
  -- 13. Delete the company itself
  -- Fixed syntax error - use ROW_COUNT instead of FOUND
  DELETE FROM companies WHERE id = p_company_id;
  GET DIAGNOSTICS v_company_count = ROW_COUNT;
  
  -- Build response
  v_deleted_counts := json_build_object(
    'success', true,
    'company_name', v_company_name,
    'deleted', json_build_object(
      'invitations', v_invitations_count,
      'alerts', v_alerts_count,
      'anomalies', v_anomalies_count,
      'sync_logs', v_sync_logs_count,
      'resource_costs', v_resource_costs_count,
      'billing_history', v_billing_count,
      'recommendations', v_recommendations_count,
      'cost_data', v_cost_data_count,
      'cloud_accounts', v_cloud_accounts_count,
      'integrations', v_integrations_count,
      'subscriptions', v_subscriptions_count,
      'profiles', v_profiles_count,
      'company', v_company_count
    )
  );
  
  RETURN v_deleted_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (admin check will be done in the API)
GRANT EXECUTE ON FUNCTION delete_company_cascade(UUID) TO authenticated;
