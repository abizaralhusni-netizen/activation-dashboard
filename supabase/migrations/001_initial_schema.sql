-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZndya2NqbnRibHJmaWR3cHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0ODE3ODAsImV4cCI6MjA3OTA1Nzc4MH0.ue-9QEBK9H0uhYBcpMsHPMOXHTXE_hlu6CAdl1l-gnA';

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dashboard data table
CREATE TABLE IF NOT EXISTS dashboard_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cluster VARCHAR(10) NOT NULL,
    asc_name VARCHAR(255) NOT NULL,
    target INTEGER DEFAULT 0,
    sgs INTEGER DEFAULT 0,
    sds INTEGER DEFAULT 0,
    retail INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,
    agh VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation detail tables
CREATE TABLE IF NOT EXISTS sgs_activations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sub_cluster VARCHAR(10) NOT NULL,
    nik VARCHAR(50) NOT NULL,
    nama VARCHAR(255) NOT NULL,
    customer_mdn TEXT[],
    total INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sds_activations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sub_cluster VARCHAR(10) NOT NULL,
    nik VARCHAR(50) NOT NULL,
    nama VARCHAR(255) NOT NULL,
    customer_mdn TEXT[],
    total INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retail_activations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sub_cluster VARCHAR(10) NOT NULL,
    nik VARCHAR(50) NOT NULL,
    nama VARCHAR(255) NOT NULL,
    customer_mdn TEXT[],
    performed_user_login_id VARCHAR(100),
    performed_user_name VARCHAR(255),
    total INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Uploaded files tracking
CREATE TABLE IF NOT EXISTS uploaded_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_size INTEGER,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES users(id)
);

-- Insert default admin user
INSERT INTO users (username, password_hash, role) 
VALUES ('admin', '$2b$10$8J8HqL7r8Qd8Q8Q8Q8Q8Qe8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert sample dashboard data
INSERT INTO dashboard_data (cluster, asc_name, target, sgs, sds, retail, total, agh) VALUES
('1.3', 'DHORA ABSIANITY PERMATA', 430, 9, 37, 2, 48, '11.16%'),
('1.4', 'MUHAMMAD YAZID ULWAN', 370, 75, 22, 1, 98, '26.49%')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE sgs_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sds_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access" ON dashboard_data FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON sgs_activations FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON sds_activations FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON retail_activations FOR SELECT USING (true);