import type { iconProps } from './iconProps';

function moonStars(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px moon stars';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m10.744,2.492l-.946-.315-.316-.947c-.102-.306-.609-.306-.711,0l-.316.947-.946.315c-.153.051-.257.194-.257.356s.104.305.257.356l.946.315.316.947c.051.153.194.256.355.256s.305-.104.355-.256l.316-.947.946-.315c.153-.051.257-.194.257-.356s-.104-.305-.257-.356h.001Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m8.5,7.75c-2.347,0-4.25-1.903-4.25-4.25,0-1.018.373-1.939.969-2.671C2.693,1.208.75,3.368.75,6c0,2.899,2.351,5.25,5.25,5.25,2.632,0,4.792-1.943,5.171-4.469-.732.597-1.653.969-2.671.969Z"
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

export default moonStars;
