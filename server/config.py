import os

from dotenv import load_dotenv
from cachelib.redis import RedisCache
from cachelib.simple import SimpleCache

load_dotenv()


SESSION_CAHCE_MAP = {
    'redis': RedisCache(
            host=os.environ.get("REDIS_HOST", "localhost"),
            port=6379,
            default_timeout=86400,
    ),
    'simple': SimpleCache()
}

session_cache_key = os.environ.get('SESSION_CACHE', 'redis')

class ApplicationConfig:
    MONGODB_SETTINGS = {
        'db': os.environ.get('MONGODB_NAME', 'db'),
        'host': os.environ.get('MONGODB_HOST', 'localhost'),
        'port': 27017,
        'uuidRepresentation': 'standard',
    }

    if (os.environ.get('MONGODB_CLIENT_CLASS') == 'mongomock'):
        import mongomock
        MONGODB_SETTINGS['mongo_client_class'] = mongomock.MongoClient

    SECRET_KEY = os.getenv('SECRET_KEY', 'dev')

    SESSION_PERMANENT = False
    SESSION_TYPE = 'cachelib'
    SESSION_CACHELIB = SESSION_CAHCE_MAP[session_cache_key]
