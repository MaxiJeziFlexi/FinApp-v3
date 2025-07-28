# Decision Tree API Integration with tree_model.py

## Overview

The `api/decision_tree.py` has been successfully integrated with `ai/tree_model.py` to provide a robust, question-based financial advisory system. The integration allows the frontend to interact with a sophisticated decision tree that guides users through personalized financial planning.

## Key Components

### 1. Core Integration
- **Main Module**: `ai/tree_model.py` contains the `FinancialDecisionTree` class
- **API Layer**: `api/decision_tree.py` provides REST endpoints that use the tree model
- **Models**: Pydantic models for request/response handling (`DecisionTreeRequest`, `DecisionTreeResponse`, `FinancialRecommendation`)

### 2. Available Endpoints

#### POST `/api/decision-tree`
Main endpoint for processing decision tree steps.

**Request Format:**
```json
{
  "user_id": 1,
  "current_node_id": "root",
  "answer": "emergency_fund",
  "context": {},
  "goal_type": "emergency_fund",
  "advisor_id": "financial_advisor"
}
```

**Response Format:**
```json
{
  "node": {
    "id": "ef_timeframe",
    "type": "question",
    "question": "W jakim czasie chcesz zgromadzić fundusz awaryjny?",
    "options": [
      {"id": "short", "label": "W ciągu 6 miesięcy"},
      {"id": "medium", "label": "W ciągu roku"},
      {"id": "long", "label": "W ciągu 1-2 lat"}
    ]
  },
  "progress": 0.25,
  "completed": false,
  "advisor_type": "financial"
}
```

#### POST `/api/decision-tree/question`
Dedicated endpoint for getting next questions in the decision tree.

#### POST `/api/decision-tree/report`
Generates comprehensive reports based on user's decision path.

#### POST `/api/decision-tree/reset`
Resets the decision tree for a user.

#### GET `/api/decision-tree/recommendations/{user_id}`
Retrieves saved recommendations for a user.

### 3. Decision Tree Structure

The tree model supports multiple financial goals:

- **Emergency Fund** (`emergency_fund`)
- **Debt Reduction** (`debt_reduction`)
- **Home Purchase** (`home_purchase`)
- **Retirement Planning** (`retirement`)
- **Education Funding** (`education`)
- **Vacation Planning** (`vacation`)
- **Other Goals** (`other`)

Each path includes 3-4 questions leading to personalized recommendations.

### 4. How Questions Work

1. **Start**: User begins at the "root" node
2. **Question**: System presents a question with multiple choice options
3. **Answer**: User selects an option (e.g., "emergency_fund")
4. **Navigation**: System moves to the next relevant node (e.g., "ef_timeframe")
5. **Progression**: Process continues until reaching a recommendation node
6. **Recommendations**: System generates personalized financial advice

### 5. Example Flow

```
Root Question: "Jaki jest Twój główny cel finansowy?"
├── emergency_fund → ef_timeframe → ef_amount → ef_savings_method → ef_recommendation
├── debt_reduction → debt_type → debt_total_amount → debt_strategy → debt_recommendation
├── home_purchase → home_timeframe → home_down_payment → home_budget → home_recommendation
└── retirement → retirement_age → retirement_current_age → retirement_vehicle → retirement_recommendation
```

### 6. Integration Features

#### Automatic Context Management
- User journey tracking
- Answer storage
- Progress calculation
- Advisor type determination

#### Flexible Frontend Support
- Multiple request formats supported
- Backward compatibility with existing APIs
- Error handling with fallback responses

#### Comprehensive Recommendations
- Context-aware advice generation
- Multiple recommendation types per goal
- Actionable steps and resources
- Risk assessment and time estimates

### 7. Usage Examples

#### Starting a Decision Tree Session
```python
request = {
    "user_id": 1,
    "current_node_id": "root",
    "answer": None,
    "context": {}
}
```

#### Answering a Question
```python
request = {
    "user_id": 1,
    "current_node_id": "root",
    "answer": "emergency_fund",
    "context": {"advisor_type": "financial"}
}
```

#### Getting Recommendations
When the tree reaches a recommendation node, the response includes:
```json
{
  "recommendations": [
    {
      "id": "ef_base",
      "title": "Plan budowy funduszu awaryjnego",
      "description": "Strategia budowy funduszu awaryjnego...",
      "advisor_type": "financial",
      "impact": "high",
      "action_items": ["Określ miesięczne wydatki...", "Wybierz bezpieczne instrumenty..."]
    }
  ],
  "completed": true
}
```

### 8. Testing

The integration has been tested with `test_decision_tree.py` which verifies:
- ✅ Module imports work correctly
- ✅ Tree initialization succeeds
- ✅ Root node processing works
- ✅ Question answering functions properly
- ✅ API endpoints respond correctly
- ✅ Progress tracking works
- ✅ Recommendation generation succeeds

### 9. Benefits

1. **Structured Guidance**: Users get step-by-step financial planning assistance
2. **Personalized Advice**: Recommendations are tailored to user's specific situation
3. **Progress Tracking**: Users can see how far they are in the process
4. **Comprehensive Coverage**: Supports all major financial planning scenarios
5. **Scalable Architecture**: Easy to add new question paths and recommendation types

### 10. Next Steps

The decision tree is now fully functional and ready for frontend integration. The system can:
- Handle complex financial planning scenarios
- Generate personalized recommendations
- Track user progress through decision paths
- Provide comprehensive reports and analysis

The frontend can now use these endpoints to create an interactive financial advisory experience that guides users through structured decision-making processes.