ALTER TABLE "users" ADD COLUMN "suggested_prompts" jsonb DEFAULT '{
        "suggestedPrompts": {
          "report": [],
          "dashboard": [],
          "visualization": [],
          "help": []
        },
        "updatedAt": null
      }'::jsonb NOT NULL;