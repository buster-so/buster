import type { iconProps } from './iconProps';

function chartActivity2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart activity 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16.25,8.75h-2.297c-.422,0-.798,.265-.941,.661l-1.647,4.575c-.12,.334-.594,.328-.706-.008L7.341,4.022c-.112-.336-.586-.342-.706-.008l-1.647,4.575c-.143,.397-.519,.661-.941,.661H1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default chartActivity2;
