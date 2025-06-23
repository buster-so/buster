import type { iconProps } from './iconProps';

function empty(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px empty';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.581,13.419c-1.131-1.131-1.831-2.694-1.831-4.419,0-3.452,2.798-6.25,6.25-6.25,1.726,0,3.288,.7,4.419,1.831"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.923,7c.212,.628,.327,1.301,.327,2,0,3.452-2.798,6.25-6.25,6.25-.699,0-1.372-.115-2-.327"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2 16L16 2"
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

export default empty;
