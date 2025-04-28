# Architektura systemu
psql -U postgres -d finapp -c "\dt"
uvicorn main:app --host 127.0.0.1 --port 8000      --reload
psql -U postgres -d finapp
## Przegląd

System AI doradcy finansowego składa się z następujących komponentów:

1. **Backend** - API REST zbudowane na FastAPI
2. **Frontend** - Aplikacja webowa
3. **Modele AI** - Modele uczenia maszynowego do analizy finansowej
4. **Baza danych** - PostgreSQL do przechowywania danych

## Przepływ danych

1. Użytkownik wprowadza dane finansowe przez frontend
2. Backend przetwarza dane i przekazuje je do modeli AI
3. Modele AI generują analizę i rekomendacje
4. Backend zapisuje wyniki w bazie danych
5. Frontend wyświetla wyniki użytkownikowi

## Komponenty

### Backend

- **API** - Endpointy REST
- **Core** - Logika biznesowa
- **AI** - Modele uczenia maszynowego
- **Data** - Procesy ETL
- **Utils** - Narzędzia pomocnicze

### Frontend

- **Components** - Komponenty React
- **Services** - Usługi API
- **Utils** - Narzędzia pomocnicze

### Baza danych

- **Tabele** - financial_analyses, chat_interactions, ai_questions, merged_financial_data
