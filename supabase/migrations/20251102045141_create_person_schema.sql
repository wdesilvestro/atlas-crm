-- Create person table
CREATE TABLE person (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  linkedin_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email addresses table
CREATE TABLE person_email (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(person_id, email)
);

-- Create phone numbers table
CREATE TABLE person_phone (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(person_id, phone_number)
);

-- Enable RLS on all tables
ALTER TABLE person ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_phone ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now - adjust based on auth)
CREATE POLICY "Allow all operations on person" ON person FOR ALL USING (true);
CREATE POLICY "Allow all operations on person_email" ON person_email FOR ALL USING (true);
CREATE POLICY "Allow all operations on person_phone" ON person_phone FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_person_email_person_id ON person_email(person_id);
CREATE INDEX idx_person_phone_person_id ON person_phone(person_id);
