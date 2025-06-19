'use client';

export const configureMonacoToUseYaml = async (monaco: typeof import('monaco-editor')) => {
  const { configureMonacoYaml } = await import('monaco-yaml');

  configureMonacoYaml(monaco, {
    enableSchemaRequest: true,
    schemas: [
      {
        // If YAML file is opened matching this glob
        fileMatch: ['**/.prettierrc.*'],
        // Then this schema will be downloaded from the internet and used.
        uri: 'https://json.schemastore.org/prettierrc.json'
      },
      {
        // If YAML file is opened matching this glob
        fileMatch: ['**/person.yaml'],
        // The following schema will be applied
        schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The person’s display name'
            },
            age: {
              type: 'integer',
              description: 'How old is the person in years?'
            },
            occupation: {
              enum: ['Delivery person', 'Software engineer', 'Astronaut']
            }
          }
        },
        // And the URI will be linked to as the source.
        uri: 'https://github.com/remcohaszing/monaco-yaml#usage'
      }
    ]
  });
};
