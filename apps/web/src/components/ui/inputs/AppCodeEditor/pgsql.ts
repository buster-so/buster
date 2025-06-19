import {
  conf as pgConf,
  language as pgLanguage
} from 'monaco-sql-languages/esm/languages/pgsql/pgsql.js';

export const pgLanguageDefinition = {
  id: 'pgsql',
  extensions: ['.pgsql'],
  aliases: ['PgSQL', 'postgresql', 'PostgreSQL'],
  loader: async () => ({
    conf: pgConf,
    language: pgLanguage
  })
};
