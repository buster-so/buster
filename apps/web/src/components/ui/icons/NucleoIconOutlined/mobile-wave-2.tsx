import type { iconProps } from './iconProps';

function mobileWave2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px mobile wave 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.25,11.25v3c0,1.105-.895,2-2,2H5.75c-1.105,0-2-.895-2-2v-2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75,6.75V3.75c0-1.105,.895-2,2-2h6.5c1.105,0,2,.895,2,2v2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,9.25h3.76c.44,0,.828-.287,.956-.708l.999-3.27c.049-.161,.276-.163,.328-.003l2.414,7.46c.052,.16,.279,.158,.328-.003l.999-3.27c.128-.421,.517-.708,.956-.708h3.76"
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

export default mobileWave2;
