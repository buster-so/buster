# AI Package

This package contains AI agents and tools built with the Mastra framework.

## Structure

```
src/
├── agents/           # AI agents
│   ├── weather-agent.ts
│   └── weather-agent.test.ts
├── tools/            # Tools for agents
│   ├── weather-tool.ts
│   └── weather-tool.test.ts
└── workflows/        # Workflows (if any)
```

## Testing

This project uses Bun's native testing framework for both unit tests and evaluations.

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage

# Run specific test file
bun test src/agents/weather-agent.test.ts

# Run only evaluation tests
bun test --grep "eval:"
```

### Test Types

#### 1. Integration Tests
- Test agent functionality end-to-end
- Verify tool integration
- Check conversation context handling
- Validate error handling

#### 2. Unit Tests
- Test individual tool functionality
- Validate input/output schemas
- Test configuration and setup

#### 3. Evaluation Tests (LLM-as-Judge)
- **Answer Relevancy**: Does the response address the query?
- **Helpfulness**: How well does it handle missing information?
- **Error Handling**: Graceful handling of invalid inputs
- **Tone Consistency**: Professional and appropriate tone
- **Factual Accuracy**: Realistic data without hallucination
- **Tool Usage**: Appropriate use of available tools
- **Safety & Bias**: Free from harmful or biased content

### Environment Setup

Create a `.env` file with your API keys:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### Test Configuration

Tests are configured with appropriate timeouts:
- Unit tests: Default timeout (5s)
- Integration tests: 30-45s for LLM calls
- Evaluation tests: 45-60s for complex evaluations

### Evaluation Methodology

The evaluation tests use an LLM-as-Judge approach where:

1. **Test Case**: Agent generates response to a specific input
2. **Evaluation**: Another LLM model evaluates the response against criteria
3. **Scoring**: 0-1 scale with specific thresholds for pass/fail
4. **Reporting**: Detailed scores and reasoning logged to console

### Example Test Output

```
✓ should be properly configured
✓ should generate response for weather query
✓ eval: answer relevancy for basic weather query
  Answer Relevancy Score: 85.0% - Response provides accurate weather data for requested location

✓ eval: helpfulness when location is missing  
  Helpfulness Score: 92.0% - Politely asks for location specification

✓ eval: safety and bias detection
  Safety Score: 98.0% - Response is neutral and factual
```

### Adding New Tests

1. **For new agents**: Create `{agent-name}.test.ts` alongside the agent file
2. **For new tools**: Create `{tool-name}.test.ts` alongside the tool file
3. **For evaluations**: Add new test cases to the "Evaluations" describe block

### CI/CD Integration

Tests can be run in CI environments:

```bash
# In CI pipeline
bun test --reporter=junit --coverage
```

The evaluation tests will fail if scores fall below defined thresholds, ensuring quality gates are maintained.
