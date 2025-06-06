import type { iconProps } from './iconProps';

function tabletMobile(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px tablet mobile';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m8,2.75c0-1.105-.895-2-2-2h-2.75c-1.105,0-2,.895-2,2v4.5c0,1.105.895,2,2,2h1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="6"
          width="4"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="6.75"
          y="5.25"
        />
      </g>
    </svg>
  );
}

export default tabletMobile;
