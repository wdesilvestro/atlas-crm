-- ============================================================================
-- Migration: Allow all authenticated users to view and manage all records
-- ============================================================================
-- This migration removes user-specific RLS restrictions and allows all
-- authenticated users to view and manage all records in the CRM system.
-- ============================================================================

-- ============================================================================
-- PERSON TABLE POLICIES
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own person records" ON person;
DROP POLICY IF EXISTS "Users can create person records" ON person;
DROP POLICY IF EXISTS "Users can update their own person records" ON person;
DROP POLICY IF EXISTS "Users can delete their own person records" ON person;

-- Create permissive policies for all authenticated users
CREATE POLICY "Authenticated users can view all person records" ON person
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create person records" ON person
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all person records" ON person
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all person records" ON person
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- PERSON_EMAIL TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view emails for their person records" ON person_email;
DROP POLICY IF EXISTS "Users can create emails for their person records" ON person_email;
DROP POLICY IF EXISTS "Users can update emails for their person records" ON person_email;
DROP POLICY IF EXISTS "Users can delete emails for their person records" ON person_email;

CREATE POLICY "Authenticated users can view all person emails" ON person_email
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create person emails" ON person_email
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update person emails" ON person_email
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete person emails" ON person_email
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- PERSON_PHONE TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view phones for their person records" ON person_phone;
DROP POLICY IF EXISTS "Users can create phones for their person records" ON person_phone;
DROP POLICY IF EXISTS "Users can update phones for their person records" ON person_phone;
DROP POLICY IF EXISTS "Users can delete phones for their person records" ON person_phone;

CREATE POLICY "Authenticated users can view all person phones" ON person_phone
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create person phones" ON person_phone
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update person phones" ON person_phone
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete person phones" ON person_phone
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- ORGANIZATION TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own organization records" ON organization;
DROP POLICY IF EXISTS "Users can create organization records" ON organization;
DROP POLICY IF EXISTS "Users can update their own organization records" ON organization;
DROP POLICY IF EXISTS "Users can delete their own organization records" ON organization;

CREATE POLICY "Authenticated users can view all organization records" ON organization
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create organization records" ON organization
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all organization records" ON organization
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all organization records" ON organization
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- PERSON_ACTION TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view actions for their persons" ON person_action;
DROP POLICY IF EXISTS "Users can create actions for their persons" ON person_action;
DROP POLICY IF EXISTS "Users can update actions for their persons" ON person_action;
DROP POLICY IF EXISTS "Users can delete actions for their persons" ON person_action;

CREATE POLICY "Authenticated users can view all person actions" ON person_action
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create person actions" ON person_action
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update person actions" ON person_action
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete person actions" ON person_action
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- TODOS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own todos or assigned todos" ON todos;
DROP POLICY IF EXISTS "Users can create todos for their own records" ON todos;
DROP POLICY IF EXISTS "Users can update their own todos or assigned todos" ON todos;
DROP POLICY IF EXISTS "Users can delete todos they created" ON todos;

CREATE POLICY "Authenticated users can view all todos" ON todos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create todos" ON todos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all todos" ON todos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all todos" ON todos
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- TAG TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own tags" ON tag;
DROP POLICY IF EXISTS "Users can create tags" ON tag;
DROP POLICY IF EXISTS "Users can update their own tags" ON tag;
DROP POLICY IF EXISTS "Users can delete their own tags" ON tag;

CREATE POLICY "Authenticated users can view all tags" ON tag
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create tags" ON tag
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all tags" ON tag
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all tags" ON tag
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- PERSON_TAG TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view person tags for their persons" ON person_tag;
DROP POLICY IF EXISTS "Users can add tags to their persons" ON person_tag;
DROP POLICY IF EXISTS "Users can remove tags from their persons" ON person_tag;

CREATE POLICY "Authenticated users can view all person tags" ON person_tag
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create person tags" ON person_tag
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete person tags" ON person_tag
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- ORGANIZATION_TAG TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view organization tags for their organizations" ON organization_tag;
DROP POLICY IF EXISTS "Users can add tags to their organizations" ON organization_tag;
DROP POLICY IF EXISTS "Users can remove tags from their organizations" ON organization_tag;

CREATE POLICY "Authenticated users can view all organization tags" ON organization_tag
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create organization tags" ON organization_tag
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete organization tags" ON organization_tag
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- NOTES
-- ============================================================================
-- After this migration, all authenticated users will be able to:
-- 1. View all person and organization records
-- 2. Create, update, and delete any person or organization record
-- 3. View and manage all actions, todos, and tags
-- 4. The user_id columns remain in place for audit/tracking purposes
-- 5. Only authenticated users can access data (anonymous users cannot)
-- ============================================================================
