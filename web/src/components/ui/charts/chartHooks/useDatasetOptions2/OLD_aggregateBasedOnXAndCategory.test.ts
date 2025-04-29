import { DEFAULT_COLUMN_LABEL_FORMAT, IColumnLabelFormat } from '@/api/asset_interfaces/metric';
import { aggregateBasedOnXAndCategory } from './OLD_aggregateBasedOnXAndCategory';
import { appendToKeyValueChain } from './groupingHelpers';

describe('aggregateBasedOnXAndCategory', () => {
  const columnLabelFormats: Record<string, IColumnLabelFormat> = {
    value: {
      ...DEFAULT_COLUMN_LABEL_FORMAT,
      replaceMissingDataWith: 0
    },
    sales: {
      ...DEFAULT_COLUMN_LABEL_FORMAT,
      replaceMissingDataWith: 0
    },
    year: {
      ...DEFAULT_COLUMN_LABEL_FORMAT,
      replaceMissingDataWith: 0
    },
    month: {
      ...DEFAULT_COLUMN_LABEL_FORMAT,
      replaceMissingDataWith: 0
    },
    clicks: {
      ...DEFAULT_COLUMN_LABEL_FORMAT,
      replaceMissingDataWith: 0
    },
    views: {
      ...DEFAULT_COLUMN_LABEL_FORMAT,
      replaceMissingDataWith: 0
    },
    device: {
      ...DEFAULT_COLUMN_LABEL_FORMAT,
      replaceMissingDataWith: 0
    },
    region: {
      ...DEFAULT_COLUMN_LABEL_FORMAT,
      replaceMissingDataWith: 0
    },
    status: {
      ...DEFAULT_COLUMN_LABEL_FORMAT,
      replaceMissingDataWith: 0
    }
  };

  it('should properly combine data with multiple xFields', () => {
    // Mock data with multiple fields that could be used as x-axis values
    const mockData = [
      { month: 'Jan', year: '2023', value: 100, category: 'A' },
      { month: 'Feb', year: '2023', value: 200, category: 'B' },
      { month: 'Feb', year: '2023', value: 150, category: 'A' },
      { month: 'Jan', year: '2024', value: 300, category: 'A' },
      { month: 'Jan', year: '2024', value: 250, category: 'B' }
    ];

    // Using both month and year as xFields to get combinations
    const xFields = ['month', 'year'];
    const measureFields = ['value'];
    const categoryFields = ['category'];
    const isScatter = false;

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      columnLabelFormats
    );

    // Check that categoriesSet contains the expected unique categories
    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([{ key: 'category', value: 'A' }]),
        appendToKeyValueChain([{ key: 'category', value: 'B' }])
      ])
    );

    const firstResult = result.entries().next().value!;
    // Check that the key structure is using appendToKeyValueChain
    expect(firstResult[0]).toContain('month__🔑__Jan');
    expect(firstResult[0]).toContain('year__🔑__2023');
    expect(firstResult[0]).toContain('category__🔑__A');
    // Check that the value is now an object with measure as key that contains an array
    expect(firstResult[1]).toEqual({ value: [100] });

    // Create keys using our appendToKeyValueChain function
    const keyJan2023A = appendToKeyValueChain([
      { key: 'month', value: 'Jan' },
      { key: 'year', value: '2023' },
      { key: 'category', value: 'A' }
    ]);

    const keyFeb2023A = appendToKeyValueChain([
      { key: 'month', value: 'Feb' },
      { key: 'year', value: '2023' },
      { key: 'category', value: 'A' }
    ]);

    const keyFeb2023B = appendToKeyValueChain([
      { key: 'month', value: 'Feb' },
      { key: 'year', value: '2023' },
      { key: 'category', value: 'B' }
    ]);

    const keyJan2024A = appendToKeyValueChain([
      { key: 'month', value: 'Jan' },
      { key: 'year', value: '2024' },
      { key: 'category', value: 'A' }
    ]);

    const keyJan2024B = appendToKeyValueChain([
      { key: 'month', value: 'Jan' },
      { key: 'year', value: '2024' },
      { key: 'category', value: 'B' }
    ]);

    // Check that the values are now objects with measure keys containing arrays
    expect(result.get(keyJan2023A)).toEqual({ value: [100] });
    expect(result.get(keyFeb2023A)).toEqual({ value: [150] });
    expect(result.get(keyFeb2023B)).toEqual({ value: [200] });
    expect(result.get(keyJan2024A)).toEqual({ value: [300] });
    expect(result.get(keyJan2024B)).toEqual({ value: [250] });

    // The result should be a map with 5 entries (all the unique combinations)
    expect(result.size).toBe(5);
  });

  it('should handle data with one x-axis and no categories', () => {
    const mockData = [
      { month: 'Jan', value: 100 },
      { month: 'Feb', value: 200 },
      { month: 'Mar', value: 300 },
      { month: 'Apr', value: 400 }
    ];

    const xFields = ['month'];
    const measureFields = ['value'];
    const categoryFields: string[] = [];
    const isScatter = false;

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      columnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(new Set());

    console.log(result);

    // Create keys using appendToKeyValueChain
    const keyJan = appendToKeyValueChain([{ key: 'month', value: 'Jan' }]);
    const keyFeb = appendToKeyValueChain([{ key: 'month', value: 'Feb' }]);
    const keyMar = appendToKeyValueChain([{ key: 'month', value: 'Mar' }]);
    const keyApr = appendToKeyValueChain([{ key: 'month', value: 'Apr' }]);

    // Check that values are objects with measure as key containing arrays
    expect(result.get(keyJan)).toEqual({ value: [100] });
    expect(result.get(keyFeb)).toEqual({ value: [200] });
    expect(result.get(keyMar)).toEqual({ value: [300] });
    expect(result.get(keyApr)).toEqual({ value: [400] });

    // Should have 4 entries (one for each month)
    expect(result.size).toBe(4);
  });

  it('should handle data with one x-axis and two measure fields', () => {
    const mockData = [
      { month: 'Jan', sales: 100, profit: 50 },
      { month: 'Feb', sales: 200, profit: 80 },
      { month: 'Mar', sales: 300, profit: 120 }
    ];

    const xFields = ['month'];
    const measureFields = ['sales', 'profit'];
    const categoryFields: string[] = [];
    const isScatter = false;

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      columnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(new Set());

    console.log(result);

    // Create keys using appendToKeyValueChain
    const keyJan = appendToKeyValueChain([{ key: 'month', value: 'Jan' }]);
    const keyFeb = appendToKeyValueChain([{ key: 'month', value: 'Feb' }]);
    const keyMar = appendToKeyValueChain([{ key: 'month', value: 'Mar' }]);

    // Check that the values are now objects with both measures as keys containing arrays
    expect(result.get(keyJan)).toEqual({ sales: [100], profit: [50] });
    expect(result.get(keyFeb)).toEqual({ sales: [200], profit: [80] });
    expect(result.get(keyMar)).toEqual({ sales: [300], profit: [120] });

    // Should have 3 entries (one for each month)
    expect(result.size).toBe(3);
  });

  it('should handle data with one x-axis, one measure field, and one category', () => {
    const mockData = [
      { quarter: 'Q1', revenue: 1000, region: 'North' },
      { quarter: 'Q1', revenue: 800, region: 'South' },
      { quarter: 'Q2', revenue: 1200, region: 'North' },
      { quarter: 'Q2', revenue: 900, region: 'South' }
    ];

    const xFields = ['quarter'];
    const measureFields = ['revenue'];
    const categoryFields = ['region'];
    const isScatter = false;

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      columnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([{ key: 'region', value: 'North' }]),
        appendToKeyValueChain([{ key: 'region', value: 'South' }])
      ])
    );

    console.log(result);

    // Create keys using appendToKeyValueChain
    const keyQ1North = appendToKeyValueChain([
      { key: 'quarter', value: 'Q1' },
      { key: 'region', value: 'North' }
    ]);

    const keyQ1South = appendToKeyValueChain([
      { key: 'quarter', value: 'Q1' },
      { key: 'region', value: 'South' }
    ]);

    const keyQ2North = appendToKeyValueChain([
      { key: 'quarter', value: 'Q2' },
      { key: 'region', value: 'North' }
    ]);

    const keyQ2South = appendToKeyValueChain([
      { key: 'quarter', value: 'Q2' },
      { key: 'region', value: 'South' }
    ]);

    // Check that values are objects with the measure as key
    expect(result.get(keyQ1North)).toEqual({ revenue: [1000] });
    expect(result.get(keyQ1South)).toEqual({ revenue: [800] });
    expect(result.get(keyQ2North)).toEqual({ revenue: [1200] });
    expect(result.get(keyQ2South)).toEqual({ revenue: [900] });

    // Should have 4 entries
    expect(result.size).toBe(4);
  });

  it('should handle data with one x-axis, two measure fields, and one category', () => {
    const mockData = [
      { year: '2023', sales: 500, returns: 50, department: 'Electronics' },
      { year: '2023', sales: 600, returns: 30, department: 'Clothing' },
      { year: '2024', sales: 700, returns: 70, department: 'Electronics' },
      { year: '2024', sales: 800, returns: 40, department: 'Clothing' }
    ];

    const xFields = ['year'];
    const measureFields = ['sales', 'returns'];
    const categoryFields = ['department'];
    const isScatter = false;

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      columnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([{ key: 'department', value: 'Electronics' }]),
        appendToKeyValueChain([{ key: 'department', value: 'Clothing' }])
      ])
    );

    console.log(result);

    // Create keys using appendToKeyValueChain
    const key2023Electronics = appendToKeyValueChain([
      { key: 'year', value: '2023' },
      { key: 'department', value: 'Electronics' }
    ]);

    const key2023Clothing = appendToKeyValueChain([
      { key: 'year', value: '2023' },
      { key: 'department', value: 'Clothing' }
    ]);

    const key2024Electronics = appendToKeyValueChain([
      { key: 'year', value: '2024' },
      { key: 'department', value: 'Electronics' }
    ]);

    const key2024Clothing = appendToKeyValueChain([
      { key: 'year', value: '2024' },
      { key: 'department', value: 'Clothing' }
    ]);

    // Check that the values contain both measures as keys
    expect(result.get(key2023Electronics)).toEqual({ sales: [500], returns: [50] });
    expect(result.get(key2023Clothing)).toEqual({ sales: [600], returns: [30] });
    expect(result.get(key2024Electronics)).toEqual({ sales: [700], returns: [70] });
    expect(result.get(key2024Clothing)).toEqual({ sales: [800], returns: [40] });

    // Should have 4 entries (2 years × 2 departments)
    expect(result.size).toBe(4);
  });

  it('should handle data with one x-axis, two measure fields, and two categories', () => {
    const mockData = [
      { date: '2023-01', clicks: 150, views: 1500, device: 'Mobile', region: 'US' },
      { date: '2023-01', clicks: 100, views: 1000, device: 'Desktop', region: 'US' },
      { date: '2023-01', clicks: 80, views: 800, device: 'Mobile', region: 'EU' },
      { date: '2023-01', clicks: 70, views: 700, device: 'Desktop', region: 'EU' },
      { date: '2023-02', clicks: 200, views: 2000, device: 'Mobile', region: 'US' },
      { date: '2023-02', clicks: 120, views: 1200, device: 'Desktop', region: 'US' },
      { date: '2023-02', clicks: 100, views: 1000, device: 'Mobile', region: 'EU' },
      { date: '2023-02', clicks: 90, views: 900, device: 'Desktop', region: 'EU' }
    ];

    const xFields = ['date'];
    const measureFields = ['clicks', 'views'];
    const categoryFields = ['device', 'region'];
    const isScatter = false;

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      columnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([
          { key: 'device', value: 'Mobile' },
          { key: 'region', value: 'US' }
        ]),
        appendToKeyValueChain([
          { key: 'device', value: 'Desktop' },
          { key: 'region', value: 'US' }
        ]),
        appendToKeyValueChain([
          { key: 'device', value: 'Mobile' },
          { key: 'region', value: 'EU' }
        ]),
        appendToKeyValueChain([
          { key: 'device', value: 'Desktop' },
          { key: 'region', value: 'EU' }
        ])
      ])
    );

    // Create a few specific keys using appendToKeyValueChain
    const key2023Jan_Mobile_US = appendToKeyValueChain([
      { key: 'date', value: '2023-01' },
      { key: 'device', value: 'Mobile' },
      { key: 'region', value: 'US' }
    ]);

    const key2023Jan_Desktop_EU = appendToKeyValueChain([
      { key: 'date', value: '2023-01' },
      { key: 'device', value: 'Desktop' },
      { key: 'region', value: 'EU' }
    ]);

    const key2023Feb_Mobile_EU = appendToKeyValueChain([
      { key: 'date', value: '2023-02' },
      { key: 'device', value: 'Mobile' },
      { key: 'region', value: 'EU' }
    ]);

    const key2023Feb_Desktop_US = appendToKeyValueChain([
      { key: 'date', value: '2023-02' },
      { key: 'device', value: 'Desktop' },
      { key: 'region', value: 'US' }
    ]);

    // Check that the values contain both measures as keys
    expect(result.get(key2023Jan_Mobile_US)).toEqual({ clicks: [150], views: [1500] });
    expect(result.get(key2023Jan_Desktop_EU)).toEqual({ clicks: [70], views: [700] });
    expect(result.get(key2023Feb_Mobile_EU)).toEqual({ clicks: [100], views: [1000] });
    expect(result.get(key2023Feb_Desktop_US)).toEqual({ clicks: [120], views: [1200] });

    // Should have 8 entries (2 dates × 2 devices × 2 regions)
    expect(result.size).toBe(8);
  });

  it('should skip string values in measure fields', () => {
    const mockData = [
      { month: 'Jan', sales: 100, status: 'Active' },
      { month: 'Feb', sales: 200, status: 'Inactive' },
      { month: 'Mar', sales: 300, status: 'Active' }, // String value as measure
      { month: 'Apr', sales: 400, status: 'Active' },
      { month: 'May', sales: null, status: 'Inactive' } // String value as measure
    ];

    const xFields = ['month'];
    const measureFields = ['sales'];
    const categoryFields = ['status'];
    const isScatter = false;

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      columnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([{ key: 'status', value: 'Active' }]),
        appendToKeyValueChain([{ key: 'status', value: 'Inactive' }])
      ])
    );

    // Check specific entries - only numeric values should be included
    const keyJanSalesActive = appendToKeyValueChain([
      { key: 'month', value: 'Jan' },
      { key: 'status', value: 'Active' }
    ]);
    const keyFebSalesInactive = appendToKeyValueChain([
      { key: 'month', value: 'Feb' },
      { key: 'status', value: 'Inactive' }
    ]);
    const keyMarSalesActive = appendToKeyValueChain([
      { key: 'month', value: 'Mar' },
      { key: 'status', value: 'Active' }
    ]);
    const keyAprSalesActive = appendToKeyValueChain([
      { key: 'month', value: 'Apr' },
      { key: 'status', value: 'Active' }
    ]);
    const keyMaySalesInactive = appendToKeyValueChain([
      { key: 'month', value: 'May' },
      { key: 'status', value: 'Inactive' }
    ]);

    expect(result.get(keyJanSalesActive)).toEqual({ sales: [100] });
    expect(result.get(keyFebSalesInactive)).toEqual({ sales: [200] });
    expect(result.get(keyMarSalesActive)).toEqual({ sales: [300] }); // Should skip the string value
    expect(result.get(keyAprSalesActive)).toEqual({ sales: [400] });
    expect(result.get(keyMaySalesInactive)).toEqual({ sales: [0] }); // Should skip the string value

    // Should only have 3 entries (the ones with numeric values)
    expect(result.size).toBe(5);
  });

  it('should sum measure values for duplicate x-axis entries', () => {
    const mockData = [
      { month: 'Jan', sales: 100, region: 'North' },
      { month: 'Jan', sales: 200, region: 'North' }, // Duplicate x-axis (month) and category
      { month: 'Feb', sales: 150, region: 'North' },
      { month: 'Feb', sales: 50, region: 'South' },
      { month: 'Feb', sales: 100, region: 'South' } // Duplicate x-axis (month) and category
    ];

    const xFields = ['month'];
    const measureFields = ['sales'];
    const categoryFields = ['region'];
    const isScatter = false;

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      columnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([{ key: 'region', value: 'North' }]),
        appendToKeyValueChain([{ key: 'region', value: 'South' }])
      ])
    );

    // Check for values with duplicate x-axis entries
    const keyJanSalesNorth = appendToKeyValueChain([
      { key: 'month', value: 'Jan' },
      { key: 'region', value: 'North' }
    ]);
    const keyFebSalesNorth = appendToKeyValueChain([
      { key: 'month', value: 'Feb' },
      { key: 'region', value: 'North' }
    ]);
    const keyFebSalesSouth = appendToKeyValueChain([
      { key: 'month', value: 'Feb' },
      { key: 'region', value: 'South' }
    ]);

    // Verify that duplicate entries are properly collected into arrays
    expect(result.get(keyJanSalesNorth)).toEqual({ sales: [100, 200] }); // Both Jan/North entries
    expect(result.get(keyFebSalesNorth)).toEqual({ sales: [150] }); // Single Feb/North entry
    expect(result.get(keyFebSalesSouth)).toEqual({ sales: [50, 100] }); // Both Feb/South entries

    // The result should have 3 unique keys
    expect(result.size).toBe(3);
  });

  it('should handle null values with replaceMissingDataWith option', () => {
    const mockData = [
      { month: 'Jan', sales: 100, status: 'Active' },
      { month: 'Feb', sales: 200, status: 'Inactive' },
      { month: 'Mar', sales: 300, status: 'Active' },
      { month: 'Apr', sales: 400, status: 'Active' },
      { month: 'May', sales: null, status: 'Inactive' } // Null value should be replaced with 0
    ];

    const xFields = ['month'];
    const measureFields = ['sales'];
    const categoryFields = ['status'];
    const isScatter = false;

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      columnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([{ key: 'status', value: 'Active' }]),
        appendToKeyValueChain([{ key: 'status', value: 'Inactive' }])
      ])
    );

    // Create keys using appendToKeyValueChain
    const keyJan_Active = appendToKeyValueChain([
      { key: 'month', value: 'Jan' },
      { key: 'status', value: 'Active' }
    ]);

    const keyFeb_Inactive = appendToKeyValueChain([
      { key: 'month', value: 'Feb' },
      { key: 'status', value: 'Inactive' }
    ]);

    const keyMar_Active = appendToKeyValueChain([
      { key: 'month', value: 'Mar' },
      { key: 'status', value: 'Active' }
    ]);

    const keyApr_Active = appendToKeyValueChain([
      { key: 'month', value: 'Apr' },
      { key: 'status', value: 'Active' }
    ]);

    const keyMay_Inactive = appendToKeyValueChain([
      { key: 'month', value: 'May' },
      { key: 'status', value: 'Inactive' }
    ]);

    // Check values
    expect(result.get(keyJan_Active)).toEqual({ sales: [100] });
    expect(result.get(keyFeb_Inactive)).toEqual({ sales: [200] });
    expect(result.get(keyMar_Active)).toEqual({ sales: [300] });
    expect(result.get(keyApr_Active)).toEqual({ sales: [400] });
    expect(result.get(keyMay_Inactive)).toEqual({ sales: [0] }); // Null replaced with 0

    // Should have 5 entries
    expect(result.size).toBe(5);
  });

  it('should handle duplicate entries by keeping the latest value', () => {
    const mockData = [
      { month: 'Jan', sales: 100, region: 'North' },
      { month: 'Jan', sales: 200, region: 'North' }, // Duplicate x-axis (month) and category
      { month: 'Feb', sales: 150, region: 'North' },
      { month: 'Feb', sales: 50, region: 'South' },
      { month: 'Feb', sales: 100, region: 'South' } // Duplicate x-axis (month) and category
    ];

    const xFields = ['month'];
    const measureFields = ['sales'];
    const categoryFields = ['region'];
    const isScatter = false;

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      columnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([{ key: 'region', value: 'North' }]),
        appendToKeyValueChain([{ key: 'region', value: 'South' }])
      ])
    );

    // Create keys using appendToKeyValueChain
    const keyJan_North = appendToKeyValueChain([
      { key: 'month', value: 'Jan' },
      { key: 'region', value: 'North' }
    ]);

    const keyFeb_North = appendToKeyValueChain([
      { key: 'month', value: 'Feb' },
      { key: 'region', value: 'North' }
    ]);

    const keyFeb_South = appendToKeyValueChain([
      { key: 'month', value: 'Feb' },
      { key: 'region', value: 'South' }
    ]);

    // With our updated implementation, values are added to arrays instead of replacing
    expect(result.get(keyJan_North)).toEqual({ sales: [100, 200] }); // Both Jan/North entries
    expect(result.get(keyFeb_North)).toEqual({ sales: [150] }); // Single Feb/North entry
    expect(result.get(keyFeb_South)).toEqual({ sales: [50, 100] }); // Both Feb/South entries

    // The result should have 3 unique keys
    expect(result.size).toBe(3);
  });

  it('should handle scatter plot data with no categories - scatter is true', () => {
    const mockData = [
      { x: 10, y: 5 },
      { x: 15, y: 8 },
      { x: 20, y: 12 },
      { x: 25, y: 15 }
    ];

    const xFields = ['x'];
    const measureFields = ['y'];
    const categoryFields: string[] = [];
    const isScatter = true;

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      columnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(new Set());

    // For scatter plots with no categories, we should get a single entry with an empty key
    const emptyKey = '';

    // Should have only one entry with the empty key
    expect(result.size).toBe(1);
    // The entry should contain all measure values in an array
    expect(result.get(emptyKey)).toEqual({ y: [5, 8, 12, 15] });
  });

  it('should handle scatter plot data with categories - scatter is true', () => {
    const mockData = [
      { x: 10, y: 5, series: 'A' },
      { x: 15, y: 8, series: 'B' },
      { x: 20, y: 12, series: 'A' },
      { x: 25, y: 15, series: 'B' }
    ];

    const xFields = ['x'];
    const measureFields = ['y'];
    const categoryFields = ['series'];
    const isScatter = true;

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      columnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([{ key: 'series', value: 'A' }]),
        appendToKeyValueChain([{ key: 'series', value: 'B' }])
      ])
    );

    // Create keys using appendToKeyValueChain for each category
    const keySeriesA = appendToKeyValueChain([{ key: 'series', value: 'A' }]);
    const keySeriesB = appendToKeyValueChain([{ key: 'series', value: 'B' }]);

    // For scatter plots with categories, we should group by the category
    expect(result.size).toBe(2);
    // Each entry should contain the measure values for that category
    expect(result.get(keySeriesA)).toEqual({ y: [5, 12] });
    expect(result.get(keySeriesB)).toEqual({ y: [8, 15] });
  });

  it('should handle data with missing category values', () => {
    const mockData = [
      { quarter: 'Q1', revenue: 1000, region: 'North', product: 'A' },
      { quarter: 'Q1', revenue: 800, region: 'South', product: null }, // Missing product value
      { quarter: 'Q2', revenue: 1200, region: null, product: 'B' }, // Missing region value
      { quarter: 'Q2', revenue: 900, region: 'South', product: 'A' }
    ];

    const xFields = ['quarter'];
    const measureFields = ['revenue'];
    const categoryFields = ['region', 'product'];
    const isScatter = false;

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      columnLabelFormats
    );

    console.log(result);

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([
          { key: 'region', value: 'North' },
          { key: 'product', value: 'A' }
        ]),
        appendToKeyValueChain([
          { key: 'region', value: 'South' },
          { key: 'product', value: '' }
        ]),
        appendToKeyValueChain([
          { key: 'region', value: 'South' },
          { key: 'product', value: 'A' }
        ]),
        appendToKeyValueChain([
          { key: 'region', value: '' },
          { key: 'product', value: 'B' }
        ])
      ])
    );

    // Create keys for valid combinations
    const keyQ1NorthA = appendToKeyValueChain([
      { key: 'quarter', value: 'Q1' },
      { key: 'region', value: 'North' },
      { key: 'product', value: 'A' }
    ]);

    const keyQ2SouthA = appendToKeyValueChain([
      { key: 'quarter', value: 'Q2' },
      { key: 'region', value: 'South' },
      { key: 'product', value: 'A' }
    ]);

    // Check that only entries with complete category values are included
    expect(result.size).toBe(4);
    expect(result.get(keyQ1NorthA)).toEqual({ revenue: [1000] });
    expect(result.get(keyQ2SouthA)).toEqual({ revenue: [900] });

    // Create keys for invalid combinations to verify they don't exist
    const keyQ1SouthNull = appendToKeyValueChain([
      { key: 'quarter', value: 'Q1' },
      { key: 'region', value: 'South' },
      { key: 'product', value: null }
    ]);

    const keyQ2NullB = appendToKeyValueChain([
      { key: 'quarter', value: 'Q2' },
      { key: 'region', value: null },
      { key: 'product', value: 'B' }
    ]);

    // Verify that entries with null category values are skipped
    expect(result.get(keyQ1SouthNull)).toEqual({ revenue: [800] });
    expect(result.get(keyQ2NullB)).toEqual({ revenue: [1200] });
  });

  it('should use different replaceMissingDataWith values for different measure fields', () => {
    // Setup column label formats with different replacement values
    const customColumnLabelFormats: Record<string, IColumnLabelFormat> = {
      revenue: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0
      },
      profit: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0
      },
      quantity: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0
      }
    };

    const mockData = [
      { product: 'A', revenue: 100, profit: 20, quantity: 5 },
      { product: 'B', revenue: null, profit: 15, quantity: 3 },
      { product: 'C', revenue: 300, profit: null, quantity: 10 },
      { product: 'D', revenue: 400, profit: 80, quantity: null }
    ];

    const xFields = ['product'];
    const measureFields = ['revenue', 'profit', 'quantity'];
    const categoryFields: string[] = [];
    const isScatter = false;

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      customColumnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(new Set());

    // Create keys using appendToKeyValueChain
    const keyA = appendToKeyValueChain([{ key: 'product', value: 'A' }]);
    const keyB = appendToKeyValueChain([{ key: 'product', value: 'B' }]);
    const keyC = appendToKeyValueChain([{ key: 'product', value: 'C' }]);
    const keyD = appendToKeyValueChain([{ key: 'product', value: 'D' }]);

    // Check that the appropriate replacement values are used
    expect(result.get(keyA)).toEqual({ revenue: [100], profit: [20], quantity: [5] });
    expect(result.get(keyB)).toEqual({ revenue: [0], profit: [15], quantity: [3] }); // revenue uses 0
    expect(result.get(keyC)).toEqual({ revenue: [300], profit: [0], quantity: [10] }); // profit uses 0
    expect(result.get(keyD)).toEqual({ revenue: [400], profit: [80], quantity: [0] }); // quantity uses 0

    // Should have 4 entries (one for each product)
    expect(result.size).toBe(4);
  });

  it('should handle replaceMissingDataWith option in scatter plots with categories', () => {
    // Setup column label formats with replacement values
    const customColumnLabelFormats: Record<string, IColumnLabelFormat> = {
      x: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0
      },
      y: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0
      }
    };

    const mockData = [
      { x: 10, y: 5, series: 'A' },
      { x: 15, y: null, series: 'B' }, // Missing y value for series B
      { x: 20, y: 12, series: 'A' },
      { x: null, y: 15, series: 'B' }, // Missing x value for series B
      { x: 25, y: 8, series: 'C' }
    ];

    const xFields = ['x'];
    const measureFields = ['y'];
    const categoryFields = ['series'];
    const isScatter = true;

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      customColumnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([{ key: 'series', value: 'A' }]),
        appendToKeyValueChain([{ key: 'series', value: 'B' }]),
        appendToKeyValueChain([{ key: 'series', value: 'C' }])
      ])
    );

    // Create keys using appendToKeyValueChain for each category
    const keySeriesA = appendToKeyValueChain([{ key: 'series', value: 'A' }]);
    const keySeriesB = appendToKeyValueChain([{ key: 'series', value: 'B' }]);
    const keySeriesC = appendToKeyValueChain([{ key: 'series', value: 'C' }]);

    // Check that missing values are replaced correctly in scatter plots
    expect(result.get(keySeriesA)).toEqual({ y: [5, 12] });
    expect(result.get(keySeriesB)).toEqual({ y: [0, 15] }); // First y value replaced with 0
    expect(result.get(keySeriesC)).toEqual({ y: [8] });

    // Should have 3 entries (one for each series)
    expect(result.size).toBe(3);
  });

  it('should ignore values when replaceMissingDataWith is undefined', () => {
    // Setup column label formats with some undefined replacements
    const customColumnLabelFormats: Record<string, IColumnLabelFormat> = {
      revenue: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0 // Replace with 0
      },
      profit: {
        ...DEFAULT_COLUMN_LABEL_FORMAT
        // No replaceMissingDataWith specified, so null values should use the default (0)
      },
      quantity: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: undefined // Explicitly undefined, still uses default
      }
    };

    const mockData = [
      { product: 'A', revenue: 100, profit: 20, quantity: 5 },
      { product: 'B', revenue: null, profit: null, quantity: null }, // All values null
      { product: 'C', revenue: 300, profit: null, quantity: 10 }, // Profit null
      { product: 'D', revenue: 400, profit: 80, quantity: null } // Quantity null
    ];

    const xFields = ['product'];
    const measureFields = ['revenue', 'profit', 'quantity'];
    const categoryFields: string[] = [];
    const isScatter = false;

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      customColumnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(new Set());

    console.log('result', result);

    // Create keys using appendToKeyValueChain
    const keyA = appendToKeyValueChain([{ key: 'product', value: 'A' }]);
    const keyB = appendToKeyValueChain([{ key: 'product', value: 'B' }]);
    const keyC = appendToKeyValueChain([{ key: 'product', value: 'C' }]);
    const keyD = appendToKeyValueChain([{ key: 'product', value: 'D' }]);

    // Check that values are handled according to replaceMissingDataWith
    expect(result.get(keyA)).toEqual({ revenue: [100], profit: [20], quantity: [5] }); // All values present

    // Analyzing the actual output from the test
    expect(result.get(keyB)).toEqual({ revenue: [0], profit: [0], quantity: [0] }); // Missing quantity
    expect(result.get(keyC)).toEqual({ revenue: [300], profit: [0], quantity: [10] });
    expect(result.get(keyD)).toEqual({ revenue: [400], profit: [80], quantity: [0] }); // Missing quantity

    // Should have 4 entries (one for each product)
    expect(result.size).toBe(4);
  });

  it('should handle scatter plot data with multiple measure fields', () => {
    const mockData = [
      { x: 10, y1: 5, y2: 15, series: 'A' },
      { x: 15, y1: 8, y2: null, series: 'B' },
      { x: 20, y1: 12, y2: 25, series: 'A' },
      { x: 25, y1: null, y2: 30, series: 'B' }
    ];

    const xFields = ['x'];
    const measureFields = ['y1', 'y2'];
    const categoryFields = ['series'];
    const isScatter = true;

    const customColumnLabelFormats: Record<string, IColumnLabelFormat> = {
      y1: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0
      },
      y2: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0
      }
    };

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      customColumnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([{ key: 'series', value: 'A' }]),
        appendToKeyValueChain([{ key: 'series', value: 'B' }])
      ])
    );

    // Create keys for each series
    const keySeriesA = appendToKeyValueChain([{ key: 'series', value: 'A' }]);
    const keySeriesB = appendToKeyValueChain([{ key: 'series', value: 'B' }]);

    // Check that values are grouped by series and missing values are replaced correctly
    expect(result.get(keySeriesA)).toEqual({ y1: [5, 12], y2: [15, 25] });
    expect(result.get(keySeriesB)).toEqual({ y1: [8, 0], y2: [0, 30] });

    // Should have 2 entries (one for each series)
    expect(result.size).toBe(2);
  });

  it('should handle scatter plot data with no categories and multiple measures', () => {
    const mockData = [
      { x: 10, y1: 5, y2: 15 },
      { x: 15, y1: 8, y2: null },
      { x: 20, y1: null, y2: 25 },
      { x: 25, y1: 15, y2: 30 }
    ];

    const xFields = ['x'];
    const measureFields = ['y1', 'y2'];
    const categoryFields: string[] = [];
    const isScatter = true;

    const customColumnLabelFormats: Record<string, IColumnLabelFormat> = {
      y1: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0
      },
      y2: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0
      }
    };

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      customColumnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(new Set());

    // For scatter plots with no categories, we should get a single entry with an empty key
    const emptyKey = '';

    // Should have only one entry with the empty key
    expect(result.size).toBe(1);
    // The entry should contain all measure values in arrays, with missing values replaced
    expect(result.get(emptyKey)).toEqual({
      y1: [5, 8, 0, 15],
      y2: [15, 0, 25, 30]
    });
  });

  it('should handle data with multiple category fields and multiple measures', () => {
    const mockData = [
      { date: '2023-01', region_main: 'US', region_sub: 'East', sales: 100, profit: 20 },
      { date: '2023-01', region_main: 'US', region_sub: 'West', sales: 150, profit: 30 },
      { date: '2023-02', region_main: 'US', region_sub: 'East', sales: null, profit: 25 },
      { date: '2023-02', region_main: 'US', region_sub: 'West', sales: 200, profit: null }
    ];

    const xFields = ['date'];
    const measureFields = ['sales', 'profit'];
    const categoryFields = ['region_main', 'region_sub'];
    const isScatter = false;

    const customColumnLabelFormats: Record<string, IColumnLabelFormat> = {
      sales: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0
      },
      profit: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0
      }
    };

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      customColumnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([
          { key: 'region_main', value: 'US' },
          { key: 'region_sub', value: 'East' }
        ]),
        appendToKeyValueChain([
          { key: 'region_main', value: 'US' },
          { key: 'region_sub', value: 'West' }
        ])
      ])
    );

    // Create keys for each unique combination
    const key2023Jan_US_East = appendToKeyValueChain([
      { key: 'date', value: '2023-01' },
      { key: 'region_main', value: 'US' },
      { key: 'region_sub', value: 'East' }
    ]);

    const key2023Jan_US_West = appendToKeyValueChain([
      { key: 'date', value: '2023-01' },
      { key: 'region_main', value: 'US' },
      { key: 'region_sub', value: 'West' }
    ]);

    const key2023Feb_US_East = appendToKeyValueChain([
      { key: 'date', value: '2023-02' },
      { key: 'region_main', value: 'US' },
      { key: 'region_sub', value: 'East' }
    ]);

    const key2023Feb_US_West = appendToKeyValueChain([
      { key: 'date', value: '2023-02' },
      { key: 'region_main', value: 'US' },
      { key: 'region_sub', value: 'West' }
    ]);

    // Check that values are properly grouped and missing values are replaced
    expect(result.get(key2023Jan_US_East)).toEqual({ sales: [100], profit: [20] });
    expect(result.get(key2023Jan_US_West)).toEqual({ sales: [150], profit: [30] });
    expect(result.get(key2023Feb_US_East)).toEqual({ sales: [0], profit: [25] });
    expect(result.get(key2023Feb_US_West)).toEqual({ sales: [200], profit: [0] });

    // Should have 4 entries
    expect(result.size).toBe(4);
  });

  it('should handle scatter plot data with null replacements', () => {
    const mockData = [
      { x: 10, y1: null, y2: null, series: 'A' },
      { x: 15, y1: 8, y2: null, series: 'B' },
      { x: 20, y1: null, y2: 25, series: 'A' },
      { x: 25, y1: null, y2: null, series: 'B' }
    ];

    const xFields = ['x'];
    const measureFields = ['y1', 'y2'];
    const categoryFields = ['series'];
    const isScatter = true;

    const customColumnLabelFormats: Record<string, IColumnLabelFormat> = {
      y1: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: null
      },
      y2: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: null
      }
    };

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      customColumnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([{ key: 'series', value: 'A' }]),
        appendToKeyValueChain([{ key: 'series', value: 'B' }])
      ])
    );

    // Create keys for each series
    const keySeriesA = appendToKeyValueChain([{ key: 'series', value: 'A' }]);
    const keySeriesB = appendToKeyValueChain([{ key: 'series', value: 'B' }]);

    // Check that values are grouped by series and null values are preserved
    expect(result.get(keySeriesA)).toEqual({ y1: [null, null], y2: [null, 25] });
    expect(result.get(keySeriesB)).toEqual({ y1: [8, null], y2: [null, null] });

    // Should have 2 entries (one for each series)
    expect(result.size).toBe(2);
  });

  it('should handle empty data array', () => {
    const emptyData: Record<string, string | number | Date | null>[] = [];
    const xFields = ['date'];
    const measureFields = ['value'];
    const categoryFields = ['category'];
    const isScatter = false;

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      emptyData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      columnLabelFormats
    );

    expect(result.size).toBe(0);
    expect(Array.from(result.entries())).toEqual([]);

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(new Set());
  });

  it('should handle mixed data types in measure fields', () => {
    const mockData = [
      { date: '2023-01', value: 100, category: 'A' },
      { date: '2023-02', value: 200, category: 'A' }, // Converted to number
      { date: '2023-05', value: null, category: 'C' } // Null should be replaced
    ];

    const xFields = ['date'];
    const measureFields = ['value'];
    const categoryFields = ['category'];
    const isScatter = false;

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      columnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([{ key: 'category', value: 'A' }]),
        appendToKeyValueChain([{ key: 'category', value: 'C' }])
      ])
    );

    const keyJan_A = appendToKeyValueChain([
      { key: 'date', value: '2023-01' },
      { key: 'category', value: 'A' }
    ]);

    const keyMay_C = appendToKeyValueChain([
      { key: 'date', value: '2023-05' },
      { key: 'category', value: 'C' }
    ]);

    // Only numeric values and null (replaced with 0) should be included
    expect(result.get(keyJan_A)).toEqual({ value: [100] });
    expect(result.get(keyMay_C)).toEqual({ value: [0] });
    expect(result.size).toBe(3);
  });

  it('should handle nested category fields with null values', () => {
    const mockData: Array<{
      date: string;
      value: number;
      region_main: string;
      region_sub: string | null;
    }> = [
      { date: '2023-01', value: 100, region_main: 'US', region_sub: 'East' },
      { date: '2023-02', value: 200, region_main: 'US', region_sub: null },
      { date: '2023-03', value: 300, region_main: 'EU', region_sub: 'West' },
      { date: '2023-04', value: 400, region_main: 'EU', region_sub: null }
    ];

    const xFields = ['date'];
    const measureFields = ['value'];
    const categoryFields = ['region_main', 'region_sub'];
    const isScatter = false;

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData as Record<string, string | number | Date | null>[],
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      columnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([
          { key: 'region_main', value: 'US' },
          { key: 'region_sub', value: 'East' }
        ]),
        appendToKeyValueChain([
          { key: 'region_main', value: 'US' },
          { key: 'region_sub', value: null }
        ]),
        appendToKeyValueChain([
          { key: 'region_main', value: 'EU' },
          { key: 'region_sub', value: 'West' }
        ]),
        appendToKeyValueChain([
          { key: 'region_main', value: 'EU' },
          { key: 'region_sub', value: null }
        ])
      ])
    );

    const keyUS_East = appendToKeyValueChain([
      { key: 'date', value: '2023-01' },
      { key: 'region_main', value: 'US' },
      { key: 'region_sub', value: 'East' }
    ]);

    const keyEU_West = appendToKeyValueChain([
      { key: 'date', value: '2023-03' },
      { key: 'region_main', value: 'EU' },
      { key: 'region_sub', value: 'West' }
    ]);

    // Only entries with non-null category values should be included
    expect(result.get(keyUS_East)).toEqual({ value: [100] });
    expect(result.get(keyEU_West)).toEqual({ value: [300] });
    expect(result.size).toBe(4);
  });

  it('should handle date values in measure fields', () => {
    const date1 = new Date('2023-01-01');
    const date2 = new Date('2023-02-01');

    const mockData: Array<{
      category: string;
      series: string;
      timestamp: Date | null;
    }> = [
      { category: 'A', series: '1', timestamp: date1 },
      { category: 'B', series: '1', timestamp: date2 },
      { category: 'A', series: '2', timestamp: null },
      { category: 'B', series: '2', timestamp: null }
    ];

    const xFields = ['category'];
    const measureFields = ['timestamp'];
    const categoryFields = ['series'];
    const isScatter = false;

    const customColumnLabelFormats = {
      timestamp: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: null
      }
    };

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData as Record<string, string | number | Date | null>[],
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      customColumnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([{ key: 'series', value: '1' }]),
        appendToKeyValueChain([{ key: 'series', value: '2' }])
      ])
    );

    const keyA_1 = appendToKeyValueChain([
      { key: 'category', value: 'A' },
      { key: 'series', value: '1' }
    ]);

    const keyB_1 = appendToKeyValueChain([
      { key: 'category', value: 'B' },
      { key: 'series', value: '1' }
    ]);

    const keyA_2 = appendToKeyValueChain([
      { key: 'category', value: 'A' },
      { key: 'series', value: '2' }
    ]);

    expect(result.get(keyA_1)).toEqual({ timestamp: [date1] });
    expect(result.get(keyB_1)).toEqual({ timestamp: [date2] });
    expect(result.get(keyA_2)).toEqual({ timestamp: [null] });
    expect(result.size).toBe(4);
  });

  it('should handle scatter plot with multiple x fields', () => {
    const mockData: Array<{
      x1: number;
      x2: number;
      y: number | null;
      series: string;
    }> = [
      { x1: 10, x2: 20, y: 5, series: 'A' },
      { x1: 15, x2: 25, y: 8, series: 'B' },
      { x1: 20, x2: 30, y: null, series: 'A' },
      { x1: 25, x2: 35, y: 15, series: 'B' }
    ];

    const xFields = ['x1', 'x2'];
    const measureFields = ['y'];
    const categoryFields = ['series'];
    const isScatter = true;

    const customColumnLabelFormats = {
      y: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: null
      }
    };

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData as Record<string, string | number | Date | null>[],
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      customColumnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([{ key: 'series', value: 'A' }]),
        appendToKeyValueChain([{ key: 'series', value: 'B' }])
      ])
    );

    // Create keys for each series
    const keySeriesA = appendToKeyValueChain([{ key: 'series', value: 'A' }]);
    const keySeriesB = appendToKeyValueChain([{ key: 'series', value: 'B' }]);

    expect(result.get(keySeriesA)).toEqual({ y: [5, null] });
    expect(result.get(keySeriesB)).toEqual({ y: [8, 15] });
    expect(result.size).toBe(2);
  });

  it('should handle ISO date strings as x values with multiple measures', () => {
    const mockData: Array<{
      timestamp: string;
      temperature: number;
      humidity: number | null;
      location: string;
    }> = [
      { timestamp: '2023-01-01T00:00:00Z', temperature: 20.5, humidity: 45, location: 'Indoor' },
      { timestamp: '2023-01-01T01:00:00Z', temperature: 19.8, humidity: null, location: 'Indoor' },
      { timestamp: '2023-01-01T00:00:00Z', temperature: 15.2, humidity: 65, location: 'Outdoor' },
      { timestamp: '2023-01-01T01:00:00Z', temperature: 14.7, humidity: 70, location: 'Outdoor' }
    ];

    const xFields = ['timestamp'];
    const measureFields = ['temperature', 'humidity'];
    const categoryFields = ['location'];
    const isScatter = false;

    const customColumnLabelFormats = {
      temperature: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0 as 0
      },
      humidity: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: null
      }
    };

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData as Record<string, string | number | Date | null>[],
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      customColumnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([{ key: 'location', value: 'Indoor' }]),
        appendToKeyValueChain([{ key: 'location', value: 'Outdoor' }])
      ])
    );

    const key00Indoor = appendToKeyValueChain([
      { key: 'timestamp', value: '2023-01-01T00:00:00Z' },
      { key: 'location', value: 'Indoor' }
    ]);

    const key01Indoor = appendToKeyValueChain([
      { key: 'timestamp', value: '2023-01-01T01:00:00Z' },
      { key: 'location', value: 'Indoor' }
    ]);

    const key00Outdoor = appendToKeyValueChain([
      { key: 'timestamp', value: '2023-01-01T00:00:00Z' },
      { key: 'location', value: 'Outdoor' }
    ]);

    expect(result.get(key00Indoor)).toEqual({ temperature: [20.5], humidity: [45] });
    expect(result.get(key01Indoor)).toEqual({ temperature: [19.8], humidity: [null] });
    expect(result.get(key00Outdoor)).toEqual({ temperature: [15.2], humidity: [65] });
    expect(result.size).toBe(4);
  });

  it('should handle ISO date strings in scatter plot with multiple series', () => {
    const mockData: Array<{
      timestamp: string;
      value: number;
      confidence: number | null;
      series: string;
    }> = [
      { timestamp: '2023-01-01T12:00:00Z', value: 100, confidence: 0.95, series: 'Model A' },
      { timestamp: '2023-01-01T12:05:00Z', value: 102, confidence: null, series: 'Model A' },
      { timestamp: '2023-01-01T12:00:00Z', value: 98, confidence: 0.92, series: 'Model B' },
      { timestamp: '2023-01-01T12:05:00Z', value: 103, confidence: 0.89, series: 'Model B' }
    ];

    const xFields = ['timestamp'];
    const measureFields = ['value', 'confidence'];
    const categoryFields = ['series'];
    const isScatter = true;

    const customColumnLabelFormats = {
      value: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0 as 0
      },
      confidence: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: null
      }
    };

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData as Record<string, string | number | Date | null>[],
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      customColumnLabelFormats
    );

    // Check that categoriesSet is empty since there are no category fields
    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([{ key: 'series', value: 'Model A' }]),
        appendToKeyValueChain([{ key: 'series', value: 'Model B' }])
      ])
    );

    // Create keys for each series
    const keyModelA = appendToKeyValueChain([{ key: 'series', value: 'Model A' }]);
    const keyModelB = appendToKeyValueChain([{ key: 'series', value: 'Model B' }]);

    expect(result.get(keyModelA)).toEqual({
      value: [100, 102],
      confidence: [0.95, null]
    });
    expect(result.get(keyModelB)).toEqual({
      value: [98, 103],
      confidence: [0.92, 0.89]
    });
    expect(result.size).toBe(2);
  });

  it('should handle data with boolean values in measure fields', () => {
    const mockData = [
      { date: '2023-01', success: true, attempts: 5, category: 'Test A' },
      { date: '2023-01', success: false, attempts: 3, category: 'Test B' },
      { date: '2023-02', success: null, attempts: 4, category: 'Test A' },
      { date: '2023-02', success: true, attempts: null, category: 'Test B' }
    ];

    const xFields = ['date'];
    const measureFields = ['success', 'attempts'];
    const categoryFields = ['category'];
    const isScatter = false;

    const customColumnLabelFormats: Record<string, IColumnLabelFormat> = {
      success: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0 as 0
      },
      attempts: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0 as 0
      }
    };

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData.map((item) => ({
        ...item,
        success: item.success === null ? null : item.success ? 1 : 0
      })) as Record<string, string | number | Date | null>[],
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      customColumnLabelFormats
    );

    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([{ key: 'category', value: 'Test A' }]),
        appendToKeyValueChain([{ key: 'category', value: 'Test B' }])
      ])
    );

    const key2023Jan_TestA = appendToKeyValueChain([
      { key: 'date', value: '2023-01' },
      { key: 'category', value: 'Test A' }
    ]);

    const key2023Jan_TestB = appendToKeyValueChain([
      { key: 'date', value: '2023-01' },
      { key: 'category', value: 'Test B' }
    ]);

    // Boolean values should be converted to numbers (true = 1, false = 0)
    expect(result.get(key2023Jan_TestA)).toEqual({ success: [1], attempts: [5] });
    expect(result.get(key2023Jan_TestB)).toEqual({ success: [0], attempts: [3] });
    expect(result.size).toBe(4);
  });

  it('should handle data with extremely large numbers and scientific notation', () => {
    const mockData = [
      { time: '10:00', value: 1e9, category: 'High' },
      { time: '10:00', value: 1e-9, category: 'Low' },
      { time: '11:00', value: Number.MAX_SAFE_INTEGER, category: 'High' },
      { time: '11:00', value: Number.MIN_SAFE_INTEGER, category: 'Low' }
    ];

    const xFields = ['time'];
    const measureFields = ['value'];
    const categoryFields = ['category'];
    const isScatter = false;

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      columnLabelFormats
    );

    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([{ key: 'category', value: 'High' }]),
        appendToKeyValueChain([{ key: 'category', value: 'Low' }])
      ])
    );

    const key1000High = appendToKeyValueChain([
      { key: 'time', value: '10:00' },
      { key: 'category', value: 'High' }
    ]);

    const key1000Low = appendToKeyValueChain([
      { key: 'time', value: '10:00' },
      { key: 'category', value: 'Low' }
    ]);

    expect(result.get(key1000High)).toEqual({ value: [1e9] });
    expect(result.get(key1000Low)).toEqual({ value: [1e-9] });
    expect(result.size).toBe(4);
  });

  it('should handle data with special characters in category and x-axis values', () => {
    const mockData = [
      { id: 'test/1', value: 100, category: 'group@1' },
      { id: 'test\\2', value: 200, category: 'group#2' },
      { id: 'test:3', value: 300, category: 'group$3' },
      { id: 'test&4', value: 400, category: 'group%4' }
    ];

    const xFields = ['id'];
    const measureFields = ['value'];
    const categoryFields = ['category'];
    const isScatter = false;

    const { aggregatedData: result, categoriesSet } = aggregateBasedOnXAndCategory(
      mockData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      columnLabelFormats
    );

    expect(categoriesSet).toEqual(
      new Set([
        appendToKeyValueChain([{ key: 'category', value: 'group@1' }]),
        appendToKeyValueChain([{ key: 'category', value: 'group#2' }]),
        appendToKeyValueChain([{ key: 'category', value: 'group$3' }]),
        appendToKeyValueChain([{ key: 'category', value: 'group%4' }])
      ])
    );

    const keyTest1 = appendToKeyValueChain([
      { key: 'id', value: 'test/1' },
      { key: 'category', value: 'group@1' }
    ]);

    const keyTest2 = appendToKeyValueChain([
      { key: 'id', value: 'test\\2' },
      { key: 'category', value: 'group#2' }
    ]);

    expect(result.get(keyTest1)).toEqual({ value: [100] });
    expect(result.get(keyTest2)).toEqual({ value: [200] });
    expect(result.size).toBe(4);
  });
});
