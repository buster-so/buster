import type { iconProps } from './iconProps';

function hearts(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hearts';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.225,9.268c1.073-1.044,2.025-2.471,2.025-4.257,.006-1.514-1.217-2.747-2.733-2.756-.912,.012-1.76,.471-2.267,1.229-.507-.758-1.355-1.217-2.267-1.229-1.374,.009-2.496,1.024-2.693,2.341"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.414,15.663c.212,.111,.46,.111,.672,0,1.121-.585,4.664-2.705,4.664-6.152,.006-1.514-1.217-2.747-2.733-2.756-.912,.012-1.76,.471-2.267,1.229-.507-.757-1.355-1.217-2.267-1.229-1.516,.009-2.739,1.242-2.733,2.756,0,3.447,3.542,5.567,4.664,6.152Z"
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

export default hearts;
