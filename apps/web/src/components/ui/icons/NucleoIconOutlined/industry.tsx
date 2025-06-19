import type { iconProps } from './iconProps';

function industry(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px industry';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.431,4.75h.638c.525,0,.96,.405,.997,.929l.607,8.5c.041,.579-.417,1.071-.997,1.071h-1.852c-.58,0-1.039-.492-.997-1.071l.607-8.5c.037-.523,.473-.929,.997-.929Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4,2.598c.306-.508,.863-.848,1.5-.848h1.75c.696,0,1.298-.407,1.579-.996"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.759,8.721l3.491-2.971v4.25l5-4.25V14.25c0,.552-.448,1-1,1H4.676"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75 12L13.25 12"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 12L9.25 12"
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

export default industry;
