import { dataLabelFontColorContrast } from './datalabelHelper';
import { determineFontColorContrast } from '@/lib/colors';

// Mock the determineFontColorContrast function
jest.mock('@/lib/colors', () => ({
  determineFontColorContrast: jest.fn()
}));

describe('dataLabelFontColorContrast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call determineFontColorContrast with the background color from context', () => {
    // Mock context
    const context = {
      dataset: {
        backgroundColor: '#FF0000' // Red background
      }
    };

    // Mock return value
    (determineFontColorContrast as jest.Mock).mockReturnValue('#FFFFFF');

    // Call the function
    const result = dataLabelFontColorContrast(context as any);

    // Verify determineFontColorContrast was called with correct color
    expect(determineFontColorContrast).toHaveBeenCalledWith('#FF0000');
    expect(result).toBe('#FFFFFF');
  });

  it('should handle array of background colors', () => {
    // Mock context with array of colors
    const context = {
      dataset: {
        backgroundColor: ['#FF0000', '#00FF00', '#0000FF']
      }
    };

    // Mock return value
    (determineFontColorContrast as jest.Mock).mockReturnValue('#000000');

    // Call the function
    const result = dataLabelFontColorContrast(context as any);

    // Verify determineFontColorContrast was called with first color from array
    expect(determineFontColorContrast).toHaveBeenCalledWith(['#FF0000', '#00FF00', '#0000FF']);
    expect(result).toBe('#000000');
  });

  it('should handle undefined background color', () => {
    // Mock context with undefined background color
    const context = {
      dataset: {
        backgroundColor: undefined
      }
    };

    // Mock return value
    (determineFontColorContrast as jest.Mock).mockReturnValue('#000000');

    // Call the function
    const result = dataLabelFontColorContrast(context as any);

    // Verify determineFontColorContrast was called with undefined
    expect(determineFontColorContrast).toHaveBeenCalledWith(undefined);
    expect(result).toBe('#000000');
  });
});
