import type { iconProps } from './iconProps';

function hotspotOff(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hotspot off';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.581,5.954c.429,.926,.669,1.958,.669,3.046,0,2.593-1.361,4.867-3.407,6.149"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.873,14.126c-1.312-1.312-2.123-3.124-2.123-5.126C1.75,4.996,4.996,1.75,9,1.75c2.002,0,3.815,.811,5.127,2.123"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.199,8.337c.034,.216,.051,.438,.051,.663,0,1.52-.798,2.853-1.997,3.604"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.995,12.005c-.769-.769-1.245-1.832-1.245-3.005,0-2.347,1.903-4.25,4.25-4.25,1.174,0,2.236,.476,3.005,1.245"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.116,9.884c-.226-.226-.366-.539-.366-.884,0-.69,.56-1.25,1.25-1.25,.345,0,.658,.14,.884,.366"
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

export default hotspotOff;
