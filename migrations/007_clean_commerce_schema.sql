CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  type VARCHAR(50) CHECK (type IN ('text','number','select','boolean','date')),
  options JSONB
);

CREATE TABLE category_attributes (
  category_id UUID REFERENCES categories(id),
  attribute_id UUID REFERENCES attributes(id),
  required BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  PRIMARY KEY (category_id, attribute_id)
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  category_id UUID REFERENCES categories(id),
  status VARCHAR(50) DEFAULT 'draft',
  attributes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
