import type { iconProps } from './iconProps';

function userPosition(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user position';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9.001"
          cy="2.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.324,9.499l-.852-2.413c-.282-.8-1.036-1.335-1.885-1.334-.381,0-.793,0-1.174,0-.848,0-1.602,.535-1.884,1.334l-.851,2.413c-.096,.272,.057,.568,.334,.647l1.239,.354,.195,3.309c.031,.529,.469,.941,.998,.941h1.114c.529,0,.967-.413,.998-.941l.195-3.309,1.239-.354c.277-.079,.43-.375,.334-.647Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.088,13.348c1.909,.36,3.162,.966,3.162,1.652,0,1.105-3.246,2-7.25,2s-7.25-.895-7.25-2c0-.686,1.254-1.292,3.164-1.652"
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

export default userPosition;
