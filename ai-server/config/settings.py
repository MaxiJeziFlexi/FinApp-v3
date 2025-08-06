"""
Flask Configuration Settings
Different configurations for different environments
"""

import os
from datetime import timedelta

class Config:
    """Base configuration class"""
    
    # Basic Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Database settings
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_RECORD_QUERIES = True
    
    # JWT settings
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # CORS settings
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
    
    # AI/ML service settings
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    SENTIMENT_API_URL = os.environ.get('SENTIMENT_API_URL', 'http://localhost:8000')
    
    # File upload settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads')
    
    # Pagination settings
    ITEMS_PER_PAGE = 20
    MAX_ITEMS_PER_PAGE = 100

class DevelopmentConfig(Config):
    """Development configuration"""
    
    DEBUG = True
    ENV = 'development'
    
    # Development database (SQLite)
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or \
        f'sqlite:///{os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dev_database.db")}'
    
    # More permissive CORS for development
    CORS_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000']
    
    # Development-specific settings
    SQLALCHEMY_ECHO = True  # Log SQL queries
    WTF_CSRF_ENABLED = False  # Disable CSRF for development

class ProductionConfig(Config):
    """Production configuration"""
    
    DEBUG = False
    ENV = 'production'
    
    # Production database (PostgreSQL recommended)
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        f'sqlite:///{os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app.db")}'
    
    # Security settings for production
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Production CORS settings (update with your production domain)
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'https://yourdomain.com').split(',')

class TestingConfig(Config):
    """Testing configuration"""
    
    TESTING = True
    ENV = 'testing'
    
    # In-memory database for testing
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
    # Disable CSRF for testing
    WTF_CSRF_ENABLED = False
    
    # Testing-specific settings
    PRESERVE_CONTEXT_ON_EXCEPTION = False

# Configuration mapping
config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config(config_name=None):
    """Get configuration class by name"""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    return config_map.get(config_name, config_map['default'])