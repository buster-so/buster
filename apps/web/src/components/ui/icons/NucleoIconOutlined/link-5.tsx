import type { iconProps } from './iconProps';

function link5(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px link 5';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="6.854"
          width="6.732"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-45 5.725 5.725)"
          x="2.359"
          y="2.298"
        />
        <rect
          height="6.854"
          width="6.732"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-45 12.275 12.276)"
          x="8.909"
          y="8.848"
        />
        <path
          d="M6.25 6.25L11.75 11.75"
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

export default link5;
