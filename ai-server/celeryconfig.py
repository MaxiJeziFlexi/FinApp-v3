from celery.schedules import crontab

beat_schedule = {
    'daily-fine-tuning': {
        'task': 'tasks.fine_tuning_task',
        'schedule': crontab(hour=3, minute=0),
        'args': (0, [], [])  # Uwaga: W tym przypadku należy zaimplementować iterację po użytkownikach
    },
}

broker_url = 'redis://localhost:6379/0'
result_backend = 'redis://localhost:6379/0'
