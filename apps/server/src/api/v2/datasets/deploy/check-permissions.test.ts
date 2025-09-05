import { describe, expect, it } from 'vitest';
import { canUserDeployDatasets, getPermissionError } from './check-permissions';

describe('check-permissions', () => {
  describe('canUserDeployDatasets', () => {
    it('should allow workspace_admin to deploy', () => {
      expect(canUserDeployDatasets('workspace_admin')).toBe(true);
    });

    it('should allow data_admin to deploy', () => {
      expect(canUserDeployDatasets('data_admin')).toBe(true);
    });

    it('should deny regular user to deploy', () => {
      expect(canUserDeployDatasets('user')).toBe(false);
    });

    it('should deny viewer to deploy', () => {
      expect(canUserDeployDatasets('viewer')).toBe(false);
    });
  });

  describe('getPermissionError', () => {
    it('should return correct error message', () => {
      const error = getPermissionError();
      expect(error).toBe(
        'Insufficient permissions. Must be workspace_admin or data_admin to deploy datasets.'
      );
    });
  });
});
