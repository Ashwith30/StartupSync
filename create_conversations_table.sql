CREATE TABLE conversations (
  id VARCHAR(255) PRIMARY KEY,
  content TEXT NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  timestamp DATETIME NOT NULL,
  domain VARCHAR(255)
);
