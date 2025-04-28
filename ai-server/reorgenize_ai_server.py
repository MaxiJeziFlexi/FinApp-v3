#!/usr/bin/env python3
"""
Skrypt do reorganizacji struktury projektu AI doradcy finansowego.
Zmienia organizację plików bezpośrednio w folderze AI-server.
"""

import os
import shutil
import sys
from pathlib import Path
import tempfile

# Ścieżka do katalogu projektu
PROJECT_DIR = Path('/Users/maksbraziewicz/Desktop/Implement SI/logistics-dashboard/ai-server')

# Definicja nowej struktury katalogów
DIRECTORY_STRUCTURE = [
    'api',
    'core',
    'ai',
    'data',
    'utils',
    'tests',
    'models',
    'frontend/src/components',
    'frontend/src/services',
    'frontend/src/utils',
    'frontend/public',
    'data/synthetic',
    'data/production',
    'scripts',
    'docs',
]

# Mapowanie plików do nowych lokalizacji
FILE_MAPPING = {
    # API
    'auth.py': 'api/auth.py',
    'ai_asystent.py': 'api/ai_asystent.py',
    'analysis.py': 'api/analysis.py',
    'chat.py': 'api/chat.py',
    'logs.py': 'api/logs.py',
    'retrain.py': 'api/retrain.py',
    'router.py': 'api/router.py',
    
    # Core
    'database.py': 'core/database.py',
    'models.py': 'core/models.py',
    'schemas.py': 'core/schemas.py',
    'services.py': 'core/services.py',
    
    # AI
    'tree_model.py': 'ai/tree_model.py',
    'investment_security.py': 'ai/investment_security.py',
    
    # Data
    'data_etl.py': 'data/etl.py',
    'merge_data.py': 'data/merge_data.py',
    'etl_from_excel.py': 'data/etl_from_excel.py',
    'import_merged_financial_data.py': 'data/import_data.py',
    
    # Utils
    'logger.py': 'utils/logger.py',
    'helpers.py': 'utils/helpers.py',
    
    # Tests
    'test_services.py': 'tests/test_services.py',
    'test_chat.py': 'tests/test_chat.py',
    'test_endpoints.py': 'tests/test_api.py',
    'conftest.py': 'tests/conftest.py',
    
    # Models
    'financial_model_v2.pth': 'models/financial_model_v2.pth',
    'liquidity_model.joblib': 'models/liquidity_model.joblib',
    
    # Frontend
    'ai.js': 'frontend/src/ai.js',
    'chatLogic.js': 'frontend/src/chatLogic.js',
    'index.js': 'frontend/src/index.js',
    'askAI.js': 'frontend/src/services/askAI.js',
    'stockAnalysisModel.js': 'frontend/src/services/stockAnalysisModel.js',
    'newsAnalysisModel.js': 'frontend/src/services/newsAnalysisModel.js',
    'tsconfig.json': 'frontend/tsconfig.json',
    
    # Data - Synthetic
    'synthetic_demographics.csv': 'data/synthetic/synthetic_demographics.csv',
    'synthetic_expert_analyses.csv': 'data/synthetic/synthetic_expert_analyses.csv',
    'synthetic_financial_situations.csv': 'data/synthetic/synthetic_financial_situations.csv',
    'synthetic_legal_settings.csv': 'data/synthetic/synthetic_legal_settings.csv',
    'synthetic_market_data.csv': 'data/synthetic/synthetic_market_data.csv',
    
    # Scripts
    'generate_synthetic_data.py': 'scripts/generate_synthetic_data.py',
    'reset_test_database.py ': 'scripts/reset_test_database.py',
    'start_server.sh': 'scripts/start_server.sh',
    'load_synthetic_data.py': 'scripts/load_synthetic_data.py',
    
    # Docs
    'financial_analysis_report.txt': 'docs/financial_analysis_report.txt',
    'commendy.txt': 'docs/commendy.txt',
}

# Pliki do zignorowania w .gitignore
GITIGNORE_CONTENT = """
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
*.egg-info/
.installed.cfg
*.egg

# Logs
*.log
logs/
app.log

# Database
*.db
*.sqlite3

# Environment variables
.env
.venv
env/
venv/
ENV/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Node.js
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log

# Build
/build
/dist

# Models
*.pth
*.joblib
*.h5
"""

# Zawartość plików dokumentacji
DOCS_CONTENT = {
    'README.md': """# AI Doradca Finansowy

System AI doradcy finansowego, który łączy prawo podatkowe, rachunkowość oraz doradztwo finansowe i inwestycyjne.

## Funkcje

- Analiza finansowa
- Doradztwo inwestycyjne
- Planowanie podatkowe
- Czat z asystentem AI

## Instalacja

```bash
# Klonowanie repozytorium
git clone <repo-url>
cd ai-server

# Instalacja zależności backendu
pip install -r requirements.txt

# Instalacja zależności frontendu
cd frontend
npm install
```

## Uruchamianie

```bash
# Backend
python main.py

# Frontend
cd frontend
npm start
```

## Dokumentacja

Pełna dokumentacja znajduje się w katalogu `docs/`.
""",
    
    'docs/ARCHITECTURE.md': """# Architektura systemu

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
""",
}

def create_directory_structure():
    """Tworzy strukturę katalogów."""
    print("Tworzenie struktury katalogów...")
    
    # Utwórz strukturę katalogów
    for directory in DIRECTORY_STRUCTURE:
        dir_path = PROJECT_DIR / directory
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"  Utworzono katalog: {directory}")
    
    print("Struktura katalogów utworzona pomyślnie.")

def move_files():
    """Przenosi pliki do nowej struktury."""
    print("\nPrzenoszenie plików...")
    
    # Tworzymy tymczasowy katalog do przechowywania kopii plików
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Najpierw kopiujemy pliki do tymczasowego katalogu
        for source_file, target_path in FILE_MAPPING.items():
            source_path = PROJECT_DIR / source_file
            temp_file_path = temp_path / source_file
            
            if source_path.exists():
                shutil.copy2(source_path, temp_file_path)
                print(f"  Skopiowano do temp: {source_file}")
            else:
                print(f"  UWAGA: Plik źródłowy nie istnieje: {source_file}")
        
        # Teraz przenosimy pliki z tymczasowego katalogu do docelowych lokalizacji
        for source_file, target_path in FILE_MAPPING.items():
            temp_file_path = temp_path / source_file
            target_file_path = PROJECT_DIR / target_path
            
            if temp_file_path.exists():
                # Upewnij się, że katalog docelowy istnieje
                target_file_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Przenieś plik
                shutil.copy2(temp_file_path, target_file_path)
                print(f"  Przeniesiono: {source_file} -> {target_path}")
            
    print("Pliki przeniesione pomyślnie.")

def create_gitignore():
    """Tworzy plik .gitignore."""
    print("\nTworzenie pliku .gitignore...")
    
    with open(PROJECT_DIR / '.gitignore', 'w') as f:
        f.write(GITIGNORE_CONTENT)
    
    print("Plik .gitignore utworzony pomyślnie.")

def create_documentation():
    """Tworzy pliki dokumentacji."""
    print("\nTworzenie dokumentacji...")
    
    for doc_file, content in DOCS_CONTENT.items():
        doc_path = PROJECT_DIR / doc_file
        
        # Upewnij się, że katalog docelowy istnieje
        doc_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(doc_path, 'w') as f:
            f.write(content)
        
        print(f"  Utworzono plik dokumentacji: {doc_file}")
    
    print("Dokumentacja utworzona pomyślnie.")

def create_init_files():
    """Tworzy pliki __init__.py w katalogach Pythona."""
    print("\nTworzenie plików __init__.py...")
    
    python_dirs = [
        'api',
        'core',
        'ai',
        'data',
        'utils',
        'tests',
    ]
    
    for directory in python_dirs:
        init_file = PROJECT_DIR / directory / '__init__.py'
        with open(init_file, 'w') as f:
            f.write('# Inicjalizacja pakietu\n')
        
        print(f"  Utworzono plik: {directory}/__init__.py")
    
    print("Pliki __init__.py utworzone pomyślnie.")

def create_requirements_file():
    """Tworzy plik requirements.txt."""
    print("\nTworzenie pliku requirements.txt...")
    
    requirements = """
fastapi==0.95.0
uvicorn==0.21.1
pydantic==1.10.7
python-dotenv==1.0.0
psycopg2-binary==2.9.6
torch==2.0.0
numpy==1.24.2
pandas==2.0.0
scikit-learn==1.2.2
joblib==1.2.0
pytest==7.3.1
pytest-cov==4.1.0
alembic==1.10.3
openai==0.27.4
"""
    
    with open(PROJECT_DIR / 'requirements.txt', 'w') as f:
        f.write(requirements.strip())
    
    print("Plik requirements.txt utworzony pomyślnie.")

def update_imports():
    """Tworzy plik z instrukcjami aktualizacji importów."""
    print("\nTworzenie pliku z instrukcjami aktualizacji importów...")
    
    content = """# Instrukcje aktualizacji importów

Po reorganizacji struktury projektu, należy zaktualizować importy w plikach Python.

## Przykłady aktualizacji importów

### Przed reorganizacją:
```python
from auth import authenticate_user
from database import get_db_connection
from models import FinancialModel
```

### Po reorganizacji:
```python
from api.auth import authenticate_user
from core.database import get_db_connection
from core.models import FinancialModel
```

## Pliki wymagające aktualizacji importów

- `main.py` - Aktualizacja importów routerów
- `api/*.py` - Aktualizacja importów z core, ai, data, utils
- `ai/*.py` - Aktualizacja importów z core, utils
- `data/*.py` - Aktualizacja importów z core, utils
- `tests/*.py` - Aktualizacja importów z api, core, ai, data, utils

## Przykład aktualizacji main.py

### Przed:
```python
from routers.auth import router as auth_router
from routers.ai_asystent import router as ai_asystent_router
from routers.retrain import router as retrain_router
from analyze.analysis import router as analysis_router
from routers.logs import router as logs_router
from analyze.chat import router as chat_router
from database import get_db_connection
```

### Po:
```python
from api.auth import router as auth_router
from api.ai_asystent import router as ai_asystent_router
from api.retrain import router as retrain_router
from api.analysis import router as analysis_router
from api.logs import router as logs_router
from api.chat import router as chat_router
from core.database import get_db_connection
```

## Aktualizacja ścieżek do modeli AI

Należy również zaktualizować ścieżki do modeli AI w kodzie:

### Przed:
```python
model.load_state_dict(torch.load("financial_model_v2.pth"))
```

### Po:
```python
model.load_state_dict(torch.load("models/financial_model_v2.pth"))
```

## Aktualizacja ścieżek do danych

Należy również zaktualizować ścieżki do danych w kodzie:

### Przed:
```python
df = pd.read_csv("synthetic_demographics.csv")
```

### Po:
```python
df = pd.read_csv("data/synthetic/synthetic_demographics.csv")
```
"""
    
    with open(PROJECT_DIR / 'UPDATE_IMPORTS.md', 'w') as f:
        f.write(content)
    
    print("Plik z instrukcjami aktualizacji importów utworzony pomyślnie.")

def main():
    """Główna funkcja skryptu."""
    print("=== Reorganizacja projektu AI doradcy finansowego ===\n")
    
    # Sprawdź, czy katalog projektu istnieje
    if not PROJECT_DIR.exists():
        print(f"BŁĄD: Katalog projektu nie istnieje: {PROJECT_DIR}")
        sys.exit(1)
    
    # Utwórz strukturę katalogów
    create_directory_structure()
    
    # Przenieś pliki
    move_files()
    
    # Utwórz plik .gitignore
    create_gitignore()
    
    # Utwórz dokumentację
    create_documentation()
    
    # Utwórz pliki __init__.py
    create_init_files()
    
    # Utwórz plik requirements.txt
    create_requirements_file()
    
    # Utwórz plik z instrukcjami aktualizacji importów
    update_imports()
    
    print("\n=== Reorganizacja zakończona pomyślnie ===")
    print("\nKroki do wykonania po reorganizacji:")
    print("1. Zaktualizuj importy w plikach, aby odzwierciedlały nową strukturę (patrz UPDATE_IMPORTS.md)")
    print("2. Zaktualizuj ścieżki do modeli AI w kodzie")
    print("3. Zaktualizuj ścieżki do danych w kodzie")
    print("4. Przetestuj działanie aplikacji w nowej strukturze")
    print("5. Usuń oryginalne pliki, które zostały przeniesione do nowych lokalizacji")

if __name__ == "__main__":
    main()
