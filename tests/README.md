# BeerFinder Testing

This directory contains tests for the BeerFinder application.

## What is Testing?

Testing is the process of checking if your code works correctly. Think of it like quality control in a factory - before products are shipped, they're tested to make sure they work as expected. Similarly, we test our code to ensure it behaves correctly before users use it.

## Types of Tests

### 1. Unit Tests
Test individual pieces of code (like a single function) in isolation. Think of it like testing each ingredient before cooking.

### 2. Integration Tests
Test how different parts of the application work together. Like testing if all ingredients work well together in a recipe.

### 3. End-to-End (E2E) Tests
Test the entire application flow from a user's perspective. Like testing the entire meal from ordering to eating.

## Test Structure

```
tests/
├── backend/          # Backend (Django) tests
│   ├── test_poi_api.py
│   └── test_item_api.py
├── frontend/         # Frontend (React) tests
│   ├── MapComponent.test.tsx
│   └── poiService.test.ts
├── integration/      # Integration tests
│   └── test_api_integration.py
└── README.md        # This file
```

## Running Tests

### Backend Tests

**Using Docker:**
```bash
docker-compose exec backend python manage.py test
```

**Locally:**
```bash
cd backend
python manage.py test
```

**Run specific test file:**
```bash
python manage.py test tests.backend.test_poi_api
```

**Run specific test:**
```bash
python manage.py test tests.backend.test_poi_api.POIAPITestCase.test_create_poi
```

### Frontend Tests

**Using Docker:**
```bash
docker-compose exec frontend npm test
```

**Locally:**
```bash
cd frontend
npm test
```

**Run tests in watch mode:**
```bash
npm test -- --watch
```

**Run tests with coverage:**
```bash
npm test -- --coverage
```

### Integration Tests

```bash
docker-compose exec backend python manage.py test tests.integration
```

## Writing Tests

### Backend Test Example

```python
from django.test import TestCase
from rest_framework.test import APIClient
from api.models import POI

class POITestCase(TestCase):
    def setUp(self):
        """Set up test data before each test"""
        self.client = APIClient()
        
    def test_create_poi(self):
        """Test creating a new POI"""
        data = {
            'name': 'Test POI',
            'latitude': 51.505,
            'longitude': -0.09
        }
        response = self.client.post('/api/v1/pois/', data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(POI.objects.count(), 1)
```

### Frontend Test Example

```typescript
import { render, screen } from '@testing-library/react';
import MapComponent from './MapComponent';

describe('MapComponent', () => {
  it('renders correctly', () => {
    render(<MapComponent />);
    expect(screen.getByText('BeerFinder')).toBeInTheDocument();
  });
});
```

## Test Coverage

Test coverage measures how much of your code is tested. Aim for:
- **80%+ coverage** for critical code
- **60%+ coverage** for general code

**Check backend coverage:**
```bash
pip install coverage
coverage run --source='.' manage.py test
coverage report
coverage html  # Generates HTML report
```

**Check frontend coverage:**
```bash
npm test -- --coverage
```

## Common Testing Patterns

### Testing API Endpoints

1. **Create** - Test POST requests
2. **Read** - Test GET requests
3. **Update** - Test PATCH/PUT requests
4. **Delete** - Test DELETE requests

### Testing Components

1. **Rendering** - Does it render without errors?
2. **User Interactions** - Do buttons/clicks work?
3. **State Changes** - Does the UI update correctly?
4. **API Calls** - Are API requests made correctly?

## Test Data

### Fixtures
Pre-defined test data stored in files. Useful for complex test scenarios.

**Create fixture:**
```bash
python manage.py dumpdata api.POI --indent 2 > tests/fixtures/pois.json
```

**Load fixture:**
```python
class MyTestCase(TestCase):
    fixtures = ['pois.json']
```

### Factories
Code that generates test data automatically. More flexible than fixtures.

**Example using factory_boy:**
```python
import factory
from api.models import POI

class POIFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = POI
    
    name = factory.Sequence(lambda n: f"POI {n}")
    location = factory.LazyFunction(lambda: Point(-0.09, 51.505))
```

## Mocking

Mocking means creating fake versions of external dependencies (like APIs or databases) for testing.

**Example:**
```python
from unittest.mock import patch

@patch('api.services.external_api')
def test_with_mock(mock_api):
    mock_api.get_data.return_value = {'test': 'data'}
    # Your test code here
```

## Continuous Integration (CI)

CI automatically runs tests when code is pushed to the repository. This ensures code quality before it's merged.

**Example CI configuration (.github/workflows/test.yml):**
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run backend tests
        run: docker-compose exec backend python manage.py test
      - name: Run frontend tests
        run: docker-compose exec frontend npm test
```

## Best Practices

1. **Write tests before fixing bugs** - Helps prevent regressions
2. **Keep tests simple** - One test, one thing
3. **Use descriptive names** - `test_create_poi_with_valid_data` not `test1`
4. **Test edge cases** - What happens with invalid data?
5. **Keep tests fast** - Slow tests discourage running them
6. **Clean up after tests** - Don't leave test data in the database
7. **Test behavior, not implementation** - Test what the code does, not how

## Troubleshooting

### Tests failing unexpectedly
- Check if database is set up correctly
- Verify test data is correct
- Check for timing issues (use `waitFor` in frontend tests)

### Tests are slow
- Use test database (Django does this automatically)
- Mock external API calls
- Run tests in parallel when possible

### Can't import modules
- Check PYTHONPATH
- Verify virtual environment is activated
- Check import paths are correct

## Next Steps

1. Write tests for new features
2. Aim for good test coverage
3. Set up CI/CD pipeline
4. Add performance tests
5. Add security tests
