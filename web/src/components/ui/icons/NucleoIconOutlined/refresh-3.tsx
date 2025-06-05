type iconProps = {
  fill?: string;
  secondaryfill?: string;
  strokewidth?: number;
  width?: string;
  height?: string;
  title?: string;
};

function refresh3(props: iconProps) {
  const strokewidth = props.strokewidth || 1;
  const title = props.title || '18px refresh 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16.12,14.695l-.408-2.945h-.002c-1.083,2.64-3.68,4.5-6.71,4.5-4.004,0-7.25-3.246-7.25-7.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.88,3.305l.408,2.945h.002C3.373,3.61,5.969,1.75,9,1.75c4.004,0,7.25,3.246,7.25,7.25"
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

export default refresh3;
