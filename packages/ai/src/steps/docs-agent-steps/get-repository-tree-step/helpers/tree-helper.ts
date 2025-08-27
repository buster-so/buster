/**
 * Helper functions for building and formatting repository tree structures
 */

export interface TreeNode {
  name: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
  path: string;
}

/**
 * Builds a tree structure from a list of file paths
 */
export function buildTreeFromPaths(paths: string[]): TreeNode {
  const root: TreeNode = {
    name: '/',
    type: 'directory',
    children: [],
    path: '/',
  };

  for (const path of paths) {
    const parts = path.split('/').filter(Boolean);
    let current: TreeNode = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue; // Skip empty parts
      
      const isFile = i === parts.length - 1 && path.includes('.');
      
      // Ensure current has children array
      if (!current.children) {
        current.children = [];
      }
      
      let child = current.children.find(c => c.name === part);
      
      if (!child) {
        const newChild: TreeNode = {
          name: part,
          type: isFile ? 'file' : 'directory',
          path: parts.slice(0, i + 1).join('/'),
        };
        
        if (!isFile) {
          newChild.children = [];
        }
        
        current.children.push(newChild);
        child = newChild;
      }
      
      if (!isFile && child.type === 'directory') {
        current = child;
      }
    }
  }

  return root;
}

/**
 * Formats a tree structure as a string with ASCII art
 */
export function formatTreeAsString(node: TreeNode, prefix = '', isLast = true): string {
  if (node.name === '/') {
    // For root, just format children if they exist
    const children = node.children;
    if (!children || children.length === 0) {
      return '';
    }
    return children
      .map((child, i) => formatTreeAsString(child, '', i === children.length - 1))
      .join('\n');
  }

  const connector = isLast ? '└── ' : '├── ';
  const result = prefix + connector + node.name;

  const children = node.children;
  if (children && children.length > 0) {
    const extension = isLast ? '    ' : '│   ';
    const childrenStr = children
      .map((child, i) => formatTreeAsString(child, prefix + extension, i === children.length - 1))
      .join('\n');
    return result + '\n' + childrenStr;
  }

  return result;
}

/**
 * Builds and formats a repository tree from file paths
 */
export function buildRepositoryTree(paths: string[]): string {
  const tree = buildTreeFromPaths(paths);
  return formatTreeAsString(tree);
}