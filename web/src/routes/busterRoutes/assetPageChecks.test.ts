import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { getEmbedAssetRedirect } from './assetPageChecks';
import { BusterRoutes } from './busterRoutes';

vi.mock('next/server', () => ({
  NextRequest: vi.fn().mockImplementation((url) => ({
    nextUrl: {
      pathname: new URL(url).pathname
    }
  }))
}));

describe('getEmbedAssetRedirect', () => {
  it('should redirect metric chart to embed metric', () => {
    const request = new NextRequest('https://example.com/app/metrics/123/chart');
    const redirect = getEmbedAssetRedirect(request);
    expect(redirect).toBe('/embed/metrics/123');
  });
  it('should redirect metric results to embed metric', () => {
    const request = new NextRequest('https://example.com/app/metrics/123/results');
    const redirect = getEmbedAssetRedirect(request);
    expect(redirect).toBe('/embed/metrics/123');
  });
  it('should redirect metric file to embed metric', () => {
    const request = new NextRequest('https://example.com/app/metrics/123/file');
    const redirect = getEmbedAssetRedirect(request);
    expect(redirect).toBe('/embed/metrics/123');
  });
  it('should redirect metric version to embed metric', () => {
    const request = new NextRequest('https://example.com/app/metrics/123/version/2');
    const redirect = getEmbedAssetRedirect(request);
    expect(redirect).toBeUndefined();
  });
  it('should redirect dashboard to embed dashboard', () => {
    const request = new NextRequest('https://example.com/app/dashboards/456');
    const redirect = getEmbedAssetRedirect(request);
    expect(redirect).toBe('/embed/dashboards/456');
  });
  it('should redirect dashboard file to embed dashboard', () => {
    const request = new NextRequest('https://example.com/app/dashboards/456/file');
    const redirect = getEmbedAssetRedirect(request);
    expect(redirect).toBe('/embed/dashboards/456');
  });
  it('should redirect chat metric to embed metric', () => {
    const request = new NextRequest(
      'https://example.com/app/chats/789/metrics/123/chart?secondary_view=file'
    );
    const redirect = getEmbedAssetRedirect(request);
    expect(redirect).toBe('/embed/metrics/123');
  });
  it('should redirect chat metric chart to embed metric', () => {
    const request = new NextRequest(
      'https://example.com/app/chats/789/metrics/123/chart?secondary_view=file'
    );
    const redirect = getEmbedAssetRedirect(request);
    expect(redirect).toBe('/embed/metrics/123');
  });
  it('should redirect chat dashboard to embed dashboard', () => {
    const request = new NextRequest('https://example.com/app/chats/789/dashboards/456');
    const redirect = getEmbedAssetRedirect(request);
    expect(redirect).toBe('/embed/dashboards/456');
  });
  it('should redirect chat dashboard file to embed dashboard', () => {
    const request = new NextRequest('https://example.com/app/chats/789/dashboards/456/file');
    const redirect = getEmbedAssetRedirect(request);
    expect(redirect).toBe('/embed/dashboards/456');
  });
  it('should return undefined for non-matching route', () => {
    const request = new NextRequest('https://example.com/some/random/path');
    const redirect = getEmbedAssetRedirect(request);
    expect(redirect).toBeUndefined();
  });
});
