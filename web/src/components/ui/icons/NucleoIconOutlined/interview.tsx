import type { iconProps } from './iconProps';

function interview(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px interview';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.25,16.25v-2h1.353c.865,0,1.584-.668,1.646-1.532l.092-1.274,1.241-.496-1.238-1.651c0-2.255-1.508-4.159-3.57-4.757"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.75,16.25v-2h-1.353c-.865,0-1.584-.668-1.646-1.532l-.092-1.274-1.241-.496,1.238-1.651c0-2.255,1.508-4.159,3.57-4.757"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75,.75h-3.5c-.827,0-1.5,.673-1.5,1.5v1.5c0,.827,.673,1.5,1.5,1.5h.5v2l2.227-2h.773c.827,0,1.5-.673,1.5-1.5v-1.5c0-.827-.673-1.5-1.5-1.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="2" cy="8.75" fill="currentColor" r=".75" />
        <circle cx="16" cy="8.75" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default interview;
