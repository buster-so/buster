import { createPlatePlugin, Key } from 'platejs/react';

// Example: A simplified plugin with both transforms and API
export const MyTestPlugin = createPlatePlugin({
  key: 'doc'
})
  // Define editor.tf.doc.format()
  .extendTransforms(({ editor, type }) => ({
    format: () => {
      console.log('format', editor, type);
      editor.tf.normalize({ force: true });
    }
  }))
  // Define editor.api.doc.format()
  .extendApi(({ editor, type }) => ({
    save: async () => {
      console.log('save', editor, type);
      // Save the document
      // await fetch(...);
    }
  }))
  .extend({
    // Or .configure() if extending an existing plugin
    shortcuts: {
      // This will call editor.tf.doc.format()
      format: {
        keys: [[Key.Mod, Key.Shift, 'f']] // e.g., Cmd/Ctrl + Shift + F
      },
      // This will call editor.api.doc.save()
      save: {
        keys: [[Key.Mod, 's']] // e.g., Cmd/Ctrl + S
      }
    }
  });
