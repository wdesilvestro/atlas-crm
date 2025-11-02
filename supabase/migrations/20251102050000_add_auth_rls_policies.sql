-- Add user_id column to person table for ownership tracking
ALTER TABLE person ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT gen_random_uuid();

-- Drop old permissive policies
DROP POLICY "Allow all operations on person" ON person;
DROP POLICY "Allow all operations on person_email" ON person_email;
DROP POLICY "Allow all operations on person_phone" ON person_phone;

-- Create auth-based RLS policies for person table
CREATE POLICY "Users can view their own person records" ON person
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create person records" ON person
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own person records" ON person
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own person records" ON person
  FOR DELETE USING (auth.uid() = user_id);

-- Create auth-based RLS policies for person_email table
CREATE POLICY "Users can view emails for their person records" ON person_email
  FOR SELECT USING (person_id IN (SELECT id FROM person WHERE user_id = auth.uid()));

CREATE POLICY "Users can create emails for their person records" ON person_email
  FOR INSERT WITH CHECK (person_id IN (SELECT id FROM person WHERE user_id = auth.uid()));

CREATE POLICY "Users can update emails for their person records" ON person_email
  FOR UPDATE USING (person_id IN (SELECT id FROM person WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete emails for their person records" ON person_email
  FOR DELETE USING (person_id IN (SELECT id FROM person WHERE user_id = auth.uid()));

-- Create auth-based RLS policies for person_phone table
CREATE POLICY "Users can view phones for their person records" ON person_phone
  FOR SELECT USING (person_id IN (SELECT id FROM person WHERE user_id = auth.uid()));

CREATE POLICY "Users can create phones for their person records" ON person_phone
  FOR INSERT WITH CHECK (person_id IN (SELECT id FROM person WHERE user_id = auth.uid()));

CREATE POLICY "Users can update phones for their person records" ON person_phone
  FOR UPDATE USING (person_id IN (SELECT id FROM person WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete phones for their person records" ON person_phone
  FOR DELETE USING (person_id IN (SELECT id FROM person WHERE user_id = auth.uid()));
