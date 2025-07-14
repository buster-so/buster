import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppMarkdownStreamable } from './AppMarkdownStreamable';

describe('AppMarkdownStreamable', () => {
  it('renders markdown content without streaming', () => {
    render(
      <AppMarkdownStreamable
        content="# Hello World"
        streaming={false}
      />
    );
    
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders markdown content with streaming enabled', () => {
    render(
      <AppMarkdownStreamable
        content="# Hello World"
        streaming={true}
        charactersPerSecond={1000}
      />
    );
    
    // Should render the content immediately in test environment
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('handles empty content gracefully', () => {
    const { container } = render(
      <AppMarkdownStreamable
        content=""
        streaming={false}
      />
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AppMarkdownStreamable
        content="# Test"
        streaming={false}
        className="custom-class"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders with different separator types', () => {
    render(
      <AppMarkdownStreamable
        content="Hello **world**"
        streaming={false}
        separator="word"
      />
    );
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('world')).toBeInTheDocument();
  });

  it('renders complex markdown content', () => {
    const markdown = `
# Title
This is a **bold** text and *italic* text.

## Subtitle
- List item 1
- List item 2

\`inline code\`

> Blockquote
    `;

    render(
      <AppMarkdownStreamable
        content={markdown}
        streaming={false}
      />
    );
    
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
    expect(screen.getByText('bold')).toBeInTheDocument();
    expect(screen.getByText('italic')).toBeInTheDocument();
    expect(screen.getByText('inline code')).toBeInTheDocument();
    expect(screen.getByText('Blockquote')).toBeInTheDocument();
  });
});