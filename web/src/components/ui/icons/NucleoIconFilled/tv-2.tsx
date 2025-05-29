import type { iconProps } from './iconProps';

function tv2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px tv 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m13.6626,14.7681l-3.9126-.8694v-2.1487h-1.5v2.1487l-3.9126.8694c-.4043.0898-.6592.4902-.5693.8945s.4873.6572.8945.5693l4.3374-.9639,4.3374.9639c.0547.0122.1094.0181.1631.0181.3442,0,.6538-.2378.7314-.5874.0898-.4043-.165-.8047-.5693-.8945Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m14.25,12.5H3.75c-1.5166,0-2.75-1.2334-2.75-2.75v-5c0-1.5166,1.2334-2.75,2.75-2.75h10.5c1.5166,0,2.75,1.2334,2.75,2.75v5c0,1.5166-1.2334,2.75-2.75,2.75ZM3.75,3.5c-.6895,0-1.25.5605-1.25,1.25v5c0,.6895.5605,1.25,1.25,1.25h10.5c.6895,0,1.25-.5605,1.25-1.25v-5c0-.6895-.5605-1.25-1.25-1.25H3.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default tv2;
