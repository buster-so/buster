import type { iconProps } from './iconProps';

function bamboo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bamboo';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11,9c-.225,.92-.431,2.133-.437,3.563-.006,1.487,.206,2.745,.437,3.687h-2s-2,0-2,0c.23-.943,.443-2.2,.437-3.688-.006-1.429-.212-2.643-.437-3.562,.225-.92,.431-2.133,.437-3.562,.006-1.487-.206-2.745-.437-3.688h4c-.23,.943-.443,2.2-.437,3.688,.006,1.429,.212,2.643,.437,3.562Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11 9L7 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2,4h0c1.932,0,3.5,1.568,3.5,3.5h0c0,.276-.224,.5-.5,.5h0c-1.932,0-3.5-1.568-3.5-3.5h0c0-.276,.224-.5,.5-.5Z"
          fill="currentColor"
        />
        <path
          d="M16,8h0c.276,0,.5,.224,.5,.5h0c0,1.932-1.568,3.5-3.5,3.5h0c-.276,0-.5-.224-.5-.5h0c0-1.932,1.568-3.5,3.5-3.5Z"
          fill="currentColor"
          transform="rotate(-180 14.5 10)"
        />
      </g>
    </svg>
  );
}

export default bamboo;
