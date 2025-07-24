# Frontend Performance Testing Suite

Kompleksowy zestaw testów wydajności dla aplikacji logistics-dashboard.

## 🚀 Szybki Start

### Wymagania
- Node.js 16+
- Uruchomiona aplikacja na `http://localhost:3000`

### Instalacja zależności
```bash
npm install
```

### Uruchomienie testów

#### 1. Szybki test wydajności
```bash
npm run test:performance:quick
# lub bezpośrednio:
node tests/quick-performance-check.js
```

#### 2. Pełny test wydajności
```bash
npm run test:performance
```

#### 3. Test obciążenia
```bash
npm run test:load
```

#### 4. Standardowe testy jednostkowe
```bash
npm test
```

## 📊 Rodzaje Testów

### 1. Quick Performance Check (`quick-performance-check.js`)
- **Cel**: Szybka ocena wydajności podstawowych stron
- **Czas wykonania**: ~2-3 minuty
- **Sprawdza**:
  - Czas ładowania stron
  - Zużycie pamięci
  - Liczbę węzłów DOM
  - Błędy JavaScript

**Przykład wyniku:**
```
🔍 Checking Dashboard...
   ⏱️  Load time: 1250ms
   🧠 Memory: 8.5MB
   📄 DOM nodes: 847
   ✅ Status: PASS
```

### 2. Performance Tests (`performance.test.js`)
- **Cel**: Szczegółowe testy wydajności z użyciem Puppeteer
- **Sprawdza**:
  - Czas ładowania stron
  - Wydajność renderowania komponentów
  - Zużycie pamięci
  - Wydajność sieci
  - Responsywność interfejsu

### 3. Load Tests (`load-test.js`)
- **Cel**: Test obciążenia z symulacją wielu użytkowników
- **Konfiguracja**:
  - Domyślnie: 10 równoczesnych użytkowników
  - Czas trwania: 60 sekund
  - Można dostosować przez zmienne środowiskowe

**Przykład uruchomienia z parametrami:**
```bash
CONCURRENT_USERS=20 TEST_DURATION=120000 npm run test:load
```

### 4. Component Performance Tests (`component-performance.test.js`)
- **Cel**: Testy wydajności komponentów React
- **Sprawdza**:
  - Czas renderowania komponentów
  - Wydajność re-renderowania
  - Zarządzanie pamięcią
  - Obsługa zdarzeń

### 5. Lighthouse Audit
- **Cel**: Profesjonalna analiza wydajności
- **Metryki**:
  - Performance Score
  - First Contentful Paint (FCP)
  - Largest Contentful Paint (LCP)
  - Cumulative Layout Shift (CLS)

## 🎯 Progi Wydajności

### Czas Ładowania
- ✅ **Dobry**: < 2 sekundy
- ⚠️ **Akceptowalny**: 2-4 sekundy
- ❌ **Słaby**: > 4 sekundy

### Zużycie Pamięci
- ✅ **Dobry**: < 10 MB
- ⚠️ **Akceptowalny**: 10-25 MB
- ❌ **Słaby**: > 25 MB

### Lighthouse Score
- ✅ **Dobry**: > 90
- ⚠️ **Akceptowalny**: 70-90
- ❌ **Słaby**: < 70

### Responsywność
- ✅ **Dobry**: < 100ms
- ⚠️ **Akceptowalny**: 100-300ms
- ❌ **Słaby**: > 300ms

## 📈 Raporty

### Automatyczne Raporty
Po uruchomieniu pełnego testu wydajności generowane są:

1. **JSON Report**: `tests/performance-report.json`
2. **HTML Report**: `tests/performance-report.html`

### Przykład raportu HTML
Raport zawiera:
- Podsumowanie wyników
- Szczegółowe metryki dla każdego testu
- Wykresy wydajności
- Rekomendacje optymalizacji

## 🔧 Konfiguracja

### Zmienne Środowiskowe
```bash
# Test obciążenia
CONCURRENT_USERS=10          # Liczba równoczesnych użytkowników
TEST_DURATION=60000          # Czas trwania testu (ms)
BASE_URL=http://localhost:3000  # URL aplikacji

# Testy wydajności
PERFORMANCE_THRESHOLD=3000   # Próg czasu ładowania (ms)
MEMORY_THRESHOLD=50          # Próg zużycia pamięci (MB)
```

### Dostosowanie testów
Edytuj pliki testowe aby:
- Dodać nowe strony do testowania
- Zmienić progi wydajności
- Dodać nowe metryki
- Dostosować scenariusze użytkownika

## 🚨 Rozwiązywanie Problemów

### Serwer nie odpowiada
```bash
# Sprawdź czy serwer jest uruchomiony
curl http://localhost:3000

# Uruchom serwer deweloperski
npm run dev
```

### Błędy Puppeteer
```bash
# Zainstaluj zależności systemowe (Ubuntu/Debian)
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2

# Lub użyj flagi --no-sandbox
export PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox"
```

### Błędy Lighthouse
```bash
# Zainstaluj Lighthouse globalnie
npm install -g lighthouse

# Lub użyj npx
npx lighthouse http://localhost:3000 --only-categories=performance
```

## 📝 Najlepsze Praktyki

### Przed uruchomieniem testów:
1. Zamknij niepotrzebne aplikacje
2. Uruchom testy na stabilnym połączeniu internetowym
3. Upewnij się, że serwer deweloperski działa stabilnie

### Interpretacja wyników:
1. Uruchom testy kilka razy dla uzyskania średnich wartości
2. Porównuj wyniki przed i po zmianach w kodzie
3. Skup się na trendach, nie pojedynczych pomiarach

### Optymalizacja:
1. Użyj lazy loading dla dużych komponentów
2. Zoptymalizuj obrazy i zasoby statyczne
3. Minimalizuj bundle JavaScript
4. Użyj React.memo dla komponentów, które często się re-renderują

## 🔗 Przydatne Linki

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [React Performance](https://reactjs.org/docs/optimizing-performance.html)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)