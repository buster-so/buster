import type { iconProps } from './iconProps';

function creditCardReader(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px credit card reader';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17,5v-1.25c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v1.25H17Z"
          fill="currentColor"
        />
        <path
          d="M1,7v3.25c0,1.517,1.233,2.75,2.75,2.75h2.25v-3.5h6v3.5h2.25c1.517,0,2.75-1.233,2.75-2.75v-3.25H1Z"
          fill="currentColor"
        />
        <path
          d="M11.068,8.5H6.932c-1.065,0-1.932,.867-1.932,1.932v4.137c0,1.065,.867,1.932,1.932,1.932h1.318v.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.75h1.318c1.065,0,1.932-.867,1.932-1.932v-4.137c0-1.065-.867-1.932-1.932-1.932Zm.432,6.068c0,.238-.194,.432-.432,.432H6.932c-.238,0-.432-.194-.432-.432v-4.137c0-.238,.194-.432,.432-.432h4.137c.238,0,.432,.194,.432,.432v4.137Z"
          fill="currentColor"
        />
        <rect height="3" width="3" fill="currentColor" rx=".25" ry=".25" x="7.5" y="11" />
      </g>
    </svg>
  );
}

export default creditCardReader;
