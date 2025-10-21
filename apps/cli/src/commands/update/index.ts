// Export update command components

export { getVersion } from '../../version';
export { createUpdateCommand } from './command';
export {
  getDirectUpdateInstructions,
  getHomebrewUpdateInstructions,
  isInstalledViaHomebrew,
} from './homebrew-detection';
export { UpdateCommand } from './update';
export { getBinaryFileName, getBinaryInfo, updateHandler } from './update-handler';
export { type UpdateOptions, UpdateOptionsSchema, type UpdateResult } from './update-schemas';
