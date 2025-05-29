import type { iconProps } from './iconProps';

function slideshow(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px slideshow';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="5" cy="16" fill="currentColor" r="1" />
        <circle cx="13" cy="16" fill="currentColor" r="1" />
        <circle cx="9" cy="16" fill="currentColor" r="1.25" />
        <rect
          height="10"
          width="14.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="2.75"
        />
      </g>
    </svg>
  );
}

export default slideshow;
