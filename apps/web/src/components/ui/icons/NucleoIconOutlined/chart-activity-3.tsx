import type { iconProps } from './iconProps';

function chartActivity3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart activity 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.75,8.75h-.5c-1.105,0-2,.895-2,2v2.375c0,1.174-.951,2.125-2.125,2.125h0c-1.174,0-2.125-.951-2.125-2.125v-4.125s0-4.125,0-4.125c0-1.174-.951-2.125-2.125-2.125h0c-1.174,0-2.125,.951-2.125,2.125v2.375c0,1.105-.895,2-2,2h-.5"
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

export default chartActivity3;
