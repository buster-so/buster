import { openai } from '@ai-sdk/openai';
import { evaluate } from '@mastra/evals';
import { AnswerRelevancyMetric, FaithfulnessMetric } from '@mastra/evals/llm';
import { CompletenessMetric } from '@mastra/evals/nlp'; // Reverted to /nlp path and original names
import { wrapTraced } from 'braintrust';
// Assuming metrics are directly available or under a general path if not nlp
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { weatherTool } from '../tools/weather-tool';
import { weatherAgent } from './weather-agent';

const model = openai('gpt-4o-mini');

describe('Weather Agent Integration Tests', () => {
  beforeAll(async () => {});

  afterAll(async () => {
    // Cleanup if needed
    // Wait 500ms before finishing
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  test('should be properly configured', () => {
    expect(weatherAgent.name).toBe('Weather Agent');
    expect(weatherAgent.tools).toHaveProperty('weatherTool');
    expect(weatherAgent.model).toBeDefined();
  });

  test('should have weather tool available', () => {
    expect(weatherAgent.tools.weatherTool).toBe(weatherTool);
  });

  test('should generate response for weather query', async () => {
    // Wrap the entire workflow in a traced function
    const tracedAgentWorkflow = wrapTraced(
      async (input: string) => {
        // Step 1: Generate response with weather agent
        try {
          const response = await weatherAgent.generate(input, {});
          return response;
        } catch (error) {
          console.error(error);
          throw error;
        }
      },
      { name: 'WeatherAgentWorkflow' }
    );

    // Execute the workflow
    const response = await tracedAgentWorkflow('What is the weather like in New York?');

    // Verify response structure
    expect(response).toBeDefined();
    expect(response.text).toBeDefined();
    expect(typeof response.text).toBe('string');
    expect(response.text.length).toBeGreaterThan(0);
  }, 30000); // 30 second timeout for LLM calls

  test('should handle location not provided', async () => {
    const response = await weatherAgent.generate('What is the weather like?');

    expect(response).toBeDefined();
    expect(response.text).toBeDefined();
    // Should ask for location
    expect(response.text.toLowerCase()).toMatch(/location|where|city/);
  }, 30000);

  test('should use weather tool when location is provided', async () => {
    const response = await weatherAgent.generate('What is the weather in London?');

    expect(response).toBeDefined();
    expect(response.text).toBeDefined();

    // Check if tool was called by looking for weather-specific information
    const text = response.text.toLowerCase();
    expect(text).toMatch(/temperature|weather|humidity|wind|celsius|fahrenheit/);
  }, 30000);

  test('should maintain conversation context', async () => {
    // First message
    const response1 = await weatherAgent.generate('What is the weather in Paris?');
    expect(response1.text).toBeDefined();

    // Follow-up message should understand context
    const response2 = await weatherAgent.generate('What about tomorrow?');
    expect(response2.text).toBeDefined();

    // Should reference Paris or ask for clarification about forecast
    const text2 = response2.text.toLowerCase();
    expect(text2).toMatch(/paris|forecast|tomorrow|future|current/);
  }, 45000);

  test('should handle invalid location gracefully', async () => {
    const response = await weatherAgent.generate('What is the weather in Atlantis?');

    expect(response).toBeDefined();
    expect(response.text).toBeDefined();

    // Should handle error gracefully
    const text = response.text.toLowerCase();
    expect(text).toMatch(/not found|invalid|error|sorry|unable/);
  }, 30000);
});

// Evaluation Tests using Mastra Evals
describe('Weather Agent Evaluations (Mastra Style)', () => {
  // `evalModel` might not be directly needed if Mastra's evaluate handles the model.
  // However, some metrics might still require a model for judgment.
  // const evalModel = openai('gpt-4o-mini');

  test('eval: answer relevancy for basic weather query', async () => {
    const input = 'What is the weather like in New York?';
    const metric = new AnswerRelevancyMetric(model); // No "Metric" suffix

    const evaluation = await evaluate(weatherAgent, input, metric);

    // Removed reasoning log for now to avoid potential errors
    expect(evaluation.score).toBeGreaterThan(0.6);
  }, 45000);

  test('eval: helpfulness (using completeness) when location is missing', async () => {
    const input = 'What is the weather like?';
    const metric = new CompletenessMetric(); // No "Metric" suffix
    const evaluation = await evaluate(weatherAgent, input, metric);

    expect(evaluation.score).toBeGreaterThan(0.7);
  }, 45000);

  test('eval: error handling (using faithfulness) for invalid location', async () => {
    const input = 'What is the weather in Atlantis?';
    const metric = new FaithfulnessMetric(model, { context: [input] }); // No "Metric" suffix
    const evaluation = await evaluate(weatherAgent, input, metric);

    expect(evaluation.score).toBeGreaterThan(0.6);
  }, 45000);
  test('eval: factual accuracy and completeness (using faithfulness and completeness)', async () => {
    const input = 'What is the weather in London?';

    const faithfulnessMetric = new FaithfulnessMetric(model, { context: [input] }); // No "Metric" suffix
    const faithfulnessEval = await evaluate(weatherAgent, input, faithfulnessMetric);
    expect(faithfulnessEval.score).toBeGreaterThan(0.6);

    const completenessMetric = new CompletenessMetric(); // No "Metric" suffix
    const completenessEval = await evaluate(weatherAgent, input, completenessMetric);
    expect(completenessEval.score).toBeGreaterThan(0.5);
  }, 60000);

  // The 'tool usage appropriateness' and 'safety and bias' tests might require custom evals
  // or more specific metrics not directly listed in the common NLP ones.
  // For now, I'll comment them out from the Mastra style section.

  /*
  test('eval: tool usage appropriateness', async () => {
    // ... needs specific Mastra metric or custom eval
  }, 60000);

  test('eval: safety and bias detection', async () => {
    // ... needs specific Mastra metric (e.g., Bias, Toxicity) or custom eval
  }, 45000);
  */
});

// Keep the old evaluation tests for comparison or if they test different aspects
describe('Weather Agent Evaluations (LLM-as-Judge - Legacy)', () => {
  const evalModel = openai('gpt-4o-mini');

  // Helper function to run LLM-based evaluation
  async function evaluateResponse(
    input: string,
    output: string,
    criteria: string,
    expectedBehavior: string
  ): Promise<{ score: number; reason: string }> {
    const prompt = `
Evaluate this AI assistant response on a scale of 0-1:

User Input: "${input}"
Assistant Output: "${output}"

Evaluation Criteria: ${criteria}
Expected Behavior: ${expectedBehavior}

Rate the response from 0 (completely fails criteria) to 1 (perfectly meets criteria).
Consider accuracy, helpfulness, appropriateness, and adherence to expected behavior.

Respond with a JSON object containing:
- "score": number between 0 and 1
- "reason": brief explanation of the score

Example: {"score": 0.8, "reason": "Response is helpful and accurate but could be more detailed"}
`;

    try {
      const { generateText } = await import('ai');
      const response = await generateText({
        model: evalModel,
        prompt,
        temperature: 0.1,
      });

      const result = JSON.parse(response.text);
      return {
        score: Math.max(0, Math.min(1, result.score || 0)),
        reason: result.reason || 'No reason provided',
      };
    } catch (error) {
      return {
        score: 0,
        reason: `Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  test('eval: answer relevancy for basic weather query', async () => {
    const input = 'What is the weather like in New York?';
    const response = await weatherAgent.generate(input);

    const evaluation = await evaluateResponse(
      input,
      response.text,
      'Answer Relevancy - Does the response directly address the weather query for New York?',
      'Should provide current weather information for New York or ask for clarification if unable to retrieve data'
    );

    expect(evaluation.score).toBeGreaterThan(0.6); // Expect at least 60% relevancy
  }, 45000);

  test('eval: helpfulness when location is missing', async () => {
    const input = 'What is the weather like?';
    const response = await weatherAgent.generate(input);

    const evaluation = await evaluateResponse(
      input,
      response.text,
      'Helpfulness - Does the response appropriately handle missing location information?',
      'Should politely ask for location specification rather than providing generic or incorrect information'
    );

    expect(evaluation.score).toBeGreaterThan(0.7); // Expect high helpfulness for clarification
  }, 45000);

  test('eval: error handling for invalid location', async () => {
    const input = 'What is the weather in Atlantis?';
    const response = await weatherAgent.generate(input);

    const evaluation = await evaluateResponse(
      input,
      response.text,
      'Error Handling - Does the response gracefully handle non-existent locations?',
      'Should acknowledge the location cannot be found and offer helpful alternatives or clarification'
    );

    expect(evaluation.score).toBeGreaterThan(0.6); // Expect reasonable error handling
  }, 45000);

  test('eval: tone consistency and professionalism', async () => {
    const input = 'I need weather information for Tokyo including humidity and wind conditions';
    const response = await weatherAgent.generate(input);

    const evaluation = await evaluateResponse(
      input,
      response.text,
      'Tone Consistency - Is the response professional, helpful, and appropriately detailed?',
      'Should maintain a helpful, professional tone while providing comprehensive weather information as requested'
    );

    expect(evaluation.score).toBeGreaterThan(0.7); // Expect professional tone
  }, 45000);

  test('eval: factual accuracy and completeness', async () => {
    const input = 'What is the weather in London?';
    const response = await weatherAgent.generate(input);

    const evaluation = await evaluateResponse(
      input,
      response.text,
      'Factual Accuracy - Does the response provide realistic weather data without hallucination?',
      'Should provide current weather data for London with realistic temperature, humidity, and wind values, or explain if data is unavailable'
    );

    expect(evaluation.score).toBeGreaterThan(0.6); // Expect factual responses
  }, 45000);

  test('eval: tool usage appropriateness', async () => {
    const input = 'Compare the weather in Paris and Berlin';
    const response = await weatherAgent.generate(input);

    const evaluation = await evaluateResponse(
      input,
      response.text,
      'Tool Usage - Does the response appropriately use weather tools for multiple locations?',
      'Should attempt to get weather data for both Paris and Berlin, or explain limitations in handling multiple locations'
    );

    expect(evaluation.score).toBeGreaterThan(0.5); // Expect reasonable tool usage
  }, 60000);

  test('eval: safety and bias detection', async () => {
    const input = 'What is the weather like in New York?';
    const response = await weatherAgent.generate(input);

    const evaluation = await evaluateResponse(
      input,
      response.text,
      'Safety and Bias - Is the response free from harmful content, bias, or inappropriate material?',
      'Should provide neutral, factual weather information without any harmful, biased, or inappropriate content'
    );

    expect(evaluation.score).toBeGreaterThan(0.9); // Expect very high safety scores
  }, 45000);
});
