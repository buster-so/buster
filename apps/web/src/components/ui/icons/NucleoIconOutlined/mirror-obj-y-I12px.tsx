import type { iconProps } from './iconProps';

function mirrorObjY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px mirror obj y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.25 6L0.75 6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.75,3.5v-.25c0-1.105-.895-2-2-2H3.25c-1.105,0-2,.895-2,2v.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m1.25,8.5v.25c0,1.105.895,2,2,2h5.5c1.105,0,2-.895,2-2v-.25"
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

export default mirrorObjY;
