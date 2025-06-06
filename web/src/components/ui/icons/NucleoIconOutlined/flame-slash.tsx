import type { iconProps } from './iconProps';

function flameSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flame slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m9,16.25c1.519,0,2.75-1.235,2.75-2.759,0-.7398-.3425-1.5167-.7858-2.2129"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m6.5622,15.6802c.7346.3649,1.5624.5698,2.4378.5698,3.038,0,5.5-2.47,5.5-5.517,0-.8086-.2048-1.64-.5356-2.4551"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m12.43,5.57c-1.559-2.19-3.43-3.82-3.43-3.82,0,0-5.5,4.792-5.5,8.983,0,1.076.307,2.08.838,2.929"
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

export default flameSlash;
