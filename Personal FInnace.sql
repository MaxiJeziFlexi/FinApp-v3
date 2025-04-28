CREATE TABLE profile (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    bio TEXT,
    profile_picture_url VARCHAR(255),
    settings JSON
);
