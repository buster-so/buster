import type { iconProps } from './iconProps';

function scaleFromTopRight2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px scale from top right 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.25,2.75h-2.5c-1.105,0-2,.895-2,2V13.25c0,1.105,.895,2,2,2H13.25c1.105,0,2-.895,2-2v-2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="6"
          width="6"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(90 12.25 5.75)"
          x="9.25"
          y="2.75"
        />
      </g>
    </svg>
  );
}

export default scaleFromTopRight2;
