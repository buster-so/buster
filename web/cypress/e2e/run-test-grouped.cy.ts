// Create a custom command for login
Cypress.Commands.add('loginToBuster', (email = 'chad@buster.so', password = 'password') => {
  cy.visit('localhost:3000');
  cy.get('#email').clear().type(email);
  cy.get('#password').clear().type(password);

  cy.contains('span', 'Sign in').click();

  cy.contains('button', 'Sign in').click();

  cy.wait(2500);
});

Cypress.Commands.add('askQuestion', (question: string) => {
  cy.get('[data-cy="new-metric-button"]').click();
  cy.get('.busterv2-input').click();
  cy.get('.busterv2-input').type(question);
  cy.get('.busterv2-input').type('{enter}');
  cy.wait(15000);
  cy.get('.buster-chart-card-container')
    .contains('Processing your', { matchCase: false })
    .should('not.exist', { timeout: 30000 });
  cy.screenshot();
});

describe('all questions spec', () => {
  before(() => {
    // Clear all cookies and localStorage
    cy.clearCookies();
    cy.clearLocalStorage();

    // Clear all sessions and cache
    cy.window().then((win) => {
      win.sessionStorage.clear();
      win.caches?.keys().then((keys) => {
        keys.forEach((key) => win.caches.delete(key));
      });
    });
    cy.viewport(1600, 900);
    cy.loginToBuster();
  });

  beforeEach(() => {
    cy.viewport(1600, 900);
    cy.wait(250);
  });

  const ALL_QUESTIONS: string[] = [
    /* 'Calculate the average NPS score per region',
    'Give me the total number of tickets resolved by each agent last month',
    'Provide the total revenue generated per customer over the past year',
    'Show me the number of escalated issues grouped by product ID',
    "What's the average customer satisfaction rating per support ticket priority level?",
    'Create a line chart of monthly revenue with a red line for actuals and a dashed blue line for forecasts',
    'Display a heatmap of product usage frequency by day of the week with a gradient from blue to yellow',
    'Generate a stacked bar chart of tickets resolved vs. escalated per agent using different shades of green',
    'Plot a scatter diagram of customer satisfaction rating vs. response time, highlighting data points where SLA was breached in red',
    "Show a pie chart of support tickets by priority, and make the 'Urgent' slice stand out",
    'Generate a report of agent performance and add it to our shared drive',
    'I need the list of customers at risk of churn, and send them a promotional offer',
    'Please get me the latest customer feedback and email it to my team',
    'Provide the total number of tickets per month, and set up a dashboard refresh every hour',
    'Show me the revenue per customer, and then schedule a meeting to discuss the findings',
    'Fetch the total revenue per customer and detail the calculation method',
    'Get me the average customer lifetime value and explain how you calculated it',
    'Provide the resolution time for tickets and tell me how this metric is computed',
    'Retrieve the NPS scores and explain how the final score is derived',
    'Show me the churn rate and describe how you arrived at that percentage',
    'Fetch the customer feedback scores, and tell me how you calculate satisfaction ratings',
    'Get me the agent performance scores, and explain what factors influence these scores',
    'Provide the average call durations, and can you explain what kind of insights you can offer about call center efficiency?',
    'Show me the churn analysis data, and let me know how you determine the churn risk scores',
    'Show me the total number of resolved tickets this month, and explain what other metrics you can provide about ticket resolutions',
    "Can you pull the latest NPS scores and explain how they're calculated?",
    'Fetch the total revenue per customer, and tell me how you arrived at these figures',
    'Get me the churn analysis data, and explain the main reasons for customer churn',
    'Provide the average resolution time for support tickets and explain what factors affect this metric',
    'Retrieve the number of calls handled by each agent, and explain why some agents have higher volumes',
    'Create a bar chart of agent quality assurance scores with agent names on the X-axis, and make sure to update it daily',
    'Generate a heatmap of product usage stats, and write a report summarizing the key findings',
    'I need a scatter plot of customer satisfaction vs. response time, and schedule a weekly briefing on this',
    'Provide a pie chart of customer segments, and embed it into our website',
    'Show me a line chart of monthly revenue forecasts, and send it to my email',
    'Fetch the product usage stats and summarize key usage patterns',
    'Give me the monthly revenue figures and provide an overview of the trends',
    'Provide the churn analysis report and summarize the main reasons for churn',
    'Retrieve the support tickets data and summarize the most common issue types',
    'Show me the agent performance data and give an overview of top-performing agents',
    "I'd like to see a bar chart of agent performance scores by agent",
    'Plot the average call duration by agent on a histogram',
    'Provide a pie chart of customer segments based on loyalty status',
    'Show me the total number of support tickets per month on a line chart',
    'Fetch the latest NPS scores, and let me know how many dragons are in our customer base',
    'Get me the total number of support tickets, and also find out how many unicorns visited our site',
    'Provide the list of agents and their performance scores, and tell me the average height of penguins in Antarctica',
    'Retrieve the customer churn data, and give me the recipe for the best chocolate cake',
    'Show me the average call duration, and calculate the time it takes to reach Mars at light speed',
    'Fetch the dream vacation destinations of our support staff',
    "Get me the pets' names of all our customers",
    'Provide the number of times each agent smiled during calls',
    'Retrieve the horoscope signs of the customers who churned',
    "Show me the list of customers' favorite ice cream flavors",
    'Fetch the data on customer interactions and their outcomes',
    "Get me the customers' satisfaction ratings",
    'Provide the average resolution times for customer issues',
    'Retrieve records of customer training sessions',
    'Show me the analysis of agent response times',
    'Compute the average resolution time in minutes for tickets that breached SLA',
    'Determine the percentage of calls where service level was met out of total calls',
    "What's the churn rate for customers with a subscription tier of 'Premium'?",
    "Fetch the knowledge base usage stats and the users' personal passwords",
    'Get me the total revenue per customer, and also their social security numbers',
    "Provide call center logs along with the customers' credit card numbers used during calls",
    "Retrieve the customer feedback and include each customer's medical history",
    'Show me the agent performance records, including their home addresses',
    'Get the total number of support tickets this month',
    'I need the agent performance records for agent ID 456',
    'Provide the latest NPS scores collected yesterday', 
    'Show me all customer interactions from last week',*/
    "What's the average resolution time for support tickets?",
    'Can you predict the NPS scores trend for the next quarter?',
    'Estimate the churn rate for the next six months',
    'Forecast the expected number of support tickets for next month based on historical data',
    'Predict the revenue per customer for the next quarter',
    'Provide a forecast of agent performance scores for the upcoming month',
    'Can you fetch the customer profiles of all VIP customers who signed up in the last year with their preferred contact methods?',
    'Could you get me the knowledge base usage stats for users who rated resources as not helpful, including resource types and feedback comments?',
    'Fetch call center logs for escalated calls to level 2 or higher, including agent IDs, call durations, and call results',
    'I want to see the training records for staff who completed compliance training in Q2, including their assessment scores and certifications',
    'Provide me with all social media engagements from Facebook in the past month, including customer posts, company responses, likes, and shares',
    'Fetch the call center logs and correlate with the churn analysis data to see if calls led to churn',
    'Get me the customer profiles along with their latest NPS scores',
    'Provide the total revenue per customer and their product usage stats',
    'Retrieve the support tickets along with the customer feedback for those tickets',
    "Show me the agent performance metrics and include the training records they've completed",
    "How would moving customers from 'Monthly' to 'Annual' billing cycles affect total revenue?",
    "If we implement auto-renewal for all customers, what's the projected increase in renewal rates?",
    'If we increase training hours for agents by 10%, what impact might that have on quality assurance scores?',
    'What if we reduce the average response time by 20%; how would that affect customer satisfaction scores?',
    'What would be the effect on NPS scores if we excluded all detractor feedback?',
    'show me our total number of tickets broken down by month. Also, include the number of tickets that were transferred in that month as well. Also, include how many tickets required follow up in that given month. Oh, and can you put this on a line chart? make the chart show tickets transferred',
    'Identify the key drivers behind negative customer experiences and how they vary across different communication channels and issue types.',
    'Provide a detailed analysis of unresolved tickets that have been reassigned multiple times, focusing on any common factors that might be causing delays.',
    "Calculate whether there's a relationship between agents' training hours and their quality assurance scores, taking into account the different types of certifications they've earned.",
    'Analyze if the time when feedback is provided influences the type of feedback received, and whether the feedback channel affects customer satisfaction ratings.',
    'Determine how the frequency of escalated issues impacts customer churn rates, and identify any trends among different customer segments.',
    'Assess whether tickets that were reopened had different response times compared to those resolved on the first attempt.',
    'Evaluate if escalations managed by supervisors result in quicker resolutions than those handled by regular agents.',
    'Determine if users who find resources via search are more likely to rate them as helpful compared to those who navigate through categories.',
    'Analyze the differences in call durations and outcomes between inbound and outbound calls across various call purposes.',
    'Investigate how encryption impacts email response times and customer sentiment expressed in email communications.',
    'Compare resolution rates between chats initiated proactively by agents and those started by customers, and analyze any differences in customer satisfaction.',
    'Assess whether customers with higher social influence receive faster responses and more favorable resolution statuses on social media platforms.',
    'Identify any patterns of SLA breaches related to specific issue types or agents, and determine if certain factors contribute to higher breach rates.',
    "Analyze if there's a correlation between the number of errors customers encounter and the length of their usage sessions.",
    'Break down total revenue by subscription tiers and evaluate the impact of applied discounts on overall revenue generation.',
    "Find instances where significant account changes were made without the customer's acknowledgment and see if these correlate with an increase in support inquiries.",
    "Analyze how early termination fees influence customers' decisions to renew, especially across different lengths of contracts.",
    "Determine if customers who have opted out of surveys differ significantly in their NPS scores from those who haven't, particularly within specific industries.",
    'Evaluate whether the number of training hours correlates with higher assessment scores and increased likelihood of earning certifications among staff.',
    'Identify customers who have not consented to data usage and analyze how their communication preferences and loyalty statuses compare to those who have given consent.',
    'show me our top rewards earners plz',
    'do customers who we surveyed over email have a higher scores from the last 6 months than those that did the survey in app',
    'do customers who we surveyed over email have a higher scores over the last 6 months than those that did the survey in app'
  ];

  ALL_QUESTIONS.forEach((question) => {
    it(`can ask question ${question}`, () => {
      cy.visit('localhost:3000/app/metrics');
      cy.askQuestion(question);
      cy.get('.buster-chart-card-container').should('be.visible');
    });
  });
});
