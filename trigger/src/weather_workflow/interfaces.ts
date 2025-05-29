/**
 * Input payload interface for the weather agent task
 */
export interface WeatherAgentInput {
  /** The location to get weather information for */
  location: string;
  /** Optional conversation context or previous messages */
  context?: string;
  /** Optional user ID for memory/conversation tracking */
  userId?: string;
}

/**
 * Weather workflow result structure
 */
export interface WeatherWorkflowResult {
  /** Activity recommendations based on weather */
  activities: string;
}

/**
 * Output interface for the weather agent task
 */
export interface WeatherAgentOutput {
  /** The weather agent's response message */
  message: string;
  /** The location that was queried */
  location: string;
  /** Whether the weather data was successfully retrieved */
  success: boolean;
  /** Any error message if the request failed */
  error?: string;
  /** Raw weather workflow result if needed for further processing */
  weatherData?: WeatherWorkflowResult;
}
