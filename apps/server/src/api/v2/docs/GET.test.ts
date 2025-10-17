import type { User } from '@buster/database/queries';
import { getUserOrganizationId, listDocs } from '@buster/database/queries';
import type { GetDocsListRequest } from '@buster/server-shared/docs';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { listDocsHandler } from './GET';

vi.mock('@buster/database/queries');
vi.mock('@buster/database/schema');
vi.mock('@buster/database/connection');

describe('listDocsHandler', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  } as User;

  const mockDocs = [
    {
      id: 'doc-1',
      name: 'Doc 1',
      content: 'Content 1',
      type: 'normal' as const,
      organizationId: 'org-123',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      deletedAt: null,
    },
    {
      id: 'doc-2',
      name: 'Doc 2',
      content: 'Content 2',
      type: 'analyst' as const,
      organizationId: 'org-123',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      deletedAt: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    (getUserOrganizationId as Mock).mockResolvedValue({
      organizationId: 'org-123',
      role: 'member',
    });
  });

  it('should list all docs for organization', async () => {
    (listDocs as Mock).mockResolvedValue({
      data: mockDocs,
      total: 2,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });

    const request: GetDocsListRequest = {
      page: 1,
      page_size: 20,
    };

    const result = await listDocsHandler(request, mockUser);

    expect(getUserOrganizationId).toHaveBeenCalledWith(mockUser.id);
    expect(listDocs).toHaveBeenCalledWith({
      organizationId: 'org-123',
      type: undefined,
      search: undefined,
      page: 1,
      pageSize: 20,
    });
    expect(result).toEqual({
      data: mockDocs,
      total: 2,
      page: 1,
      page_size: 20,
      total_pages: 1,
    });
  });

  it('should filter by type', async () => {
    (listDocs as Mock).mockResolvedValue({
      data: [mockDocs[1]], // Only analyst doc
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });

    const request: GetDocsListRequest = {
      page: 1,
      page_size: 20,
      type: 'analyst',
    };

    const result = await listDocsHandler(request, mockUser);

    expect(listDocs).toHaveBeenCalledWith({
      organizationId: 'org-123',
      type: 'analyst',
      search: undefined,
      page: 1,
      pageSize: 20,
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.type).toBe('analyst');
  });

  it('should search by name', async () => {
    (listDocs as Mock).mockResolvedValue({
      data: [mockDocs[0]],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });

    const request: GetDocsListRequest = {
      page: 1,
      page_size: 20,
      search: 'Doc 1',
    };

    const result = await listDocsHandler(request, mockUser);

    expect(listDocs).toHaveBeenCalledWith({
      organizationId: 'org-123',
      type: undefined,
      search: 'Doc 1',
      page: 1,
      pageSize: 20,
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.name).toBe('Doc 1');
  });

  it('should handle pagination', async () => {
    (listDocs as Mock).mockResolvedValue({
      data: mockDocs,
      total: 50,
      page: 2,
      pageSize: 10,
      totalPages: 5,
    });

    const request: GetDocsListRequest = {
      page: 2,
      page_size: 10,
    };

    const result = await listDocsHandler(request, mockUser);

    expect(listDocs).toHaveBeenCalledWith({
      organizationId: 'org-123',
      type: undefined,
      search: undefined,
      page: 2,
      pageSize: 10,
    });
    expect(result.page).toBe(2);
    expect(result.page_size).toBe(10);
    expect(result.total_pages).toBe(5);
  });

  it('should throw 403 if user is not associated with an organization', async () => {
    (getUserOrganizationId as Mock).mockResolvedValue(null);

    const request: GetDocsListRequest = {
      page: 1,
      page_size: 20,
    };

    await expect(listDocsHandler(request, mockUser)).rejects.toThrow(HTTPException);
    await expect(listDocsHandler(request, mockUser)).rejects.toThrow(
      'User is not associated with an organization'
    );
  });

  it('should return empty list if no docs found', async () => {
    (listDocs as Mock).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    });

    const request: GetDocsListRequest = {
      page: 1,
      page_size: 20,
    };

    const result = await listDocsHandler(request, mockUser);

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });
});
