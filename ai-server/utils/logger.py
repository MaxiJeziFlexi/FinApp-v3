import logging

logger = logging.getLogger("app_logger")
logger.setLevel(logging.INFO)

# Dodaj konsolowy handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

# Dodaj formatowanie
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
console_handler.setFormatter(formatter)

logger.addHandler(console_handler)

# Dodaj logowanie do pliku
file_handler = logging.FileHandler("app.log")
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)