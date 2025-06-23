import type { iconProps } from './iconProps';

function heartPulse(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px heart pulse';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.663,8.75c.214-.667,.337-1.381,.337-2.141,.008-2.12-1.704-3.846-3.826-3.859-1.277,.016-2.464,.66-3.173,1.72-.71-1.06-1.897-1.704-3.173-1.72-2.123,.013-3.834,1.739-3.826,3.859,0,.954,.194,1.835,.517,2.641"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.062,11.751c1.555,1.827,3.568,3.002,4.468,3.471,.297,.155,.644,.155,.941,0,.98-.511,3.278-1.858,4.869-3.972"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17.25,8.75h-5.25l-1.5,3.001-3.25-5.501-1.5,3.001H.75"
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

export default heartPulse;
