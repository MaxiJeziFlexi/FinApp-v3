#!/bin/bash

# Ustawienia
PORT=4001
PROJECT_DIR="/Users/maksbraziewicz/Desktop/Implement SI/logistics-dashboard/ai-server"

# Przejdź do katalogu projektu
cd "$PROJECT_DIR" || { echo "Nie udało się wejść do katalogu projektu"; exit 1; }

echo "Sprawdzanie procesów na porcie $PORT..."
PID=$(lsof -t -i:$PORT)

if [ -n "$PID" ]; then
  echo "Znaleziono proces (PID: $PID) na porcie $PORT. Zabijanie procesu..."
  kill -9 $PID
  echo "Proces został zakończony."
else
  echo "Brak procesów na porcie $PORT."
fi

echo "Uruchamianie skryptu ETL..."
python etl_from_excel.py

if [ $? -ne 0 ]; then
    echo "Skrypt ETL zakończył się błędem. Przerywam uruchomienie serwera."
    exit 1
fi

echo "Uruchamianie serwera jako 'finapp'..."
# Zakładamy, że serwer uruchamiany jest przez npm, np. 'npm run finapp'
npm run finapp
    