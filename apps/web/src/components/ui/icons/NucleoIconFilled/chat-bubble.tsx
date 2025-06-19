import type { iconProps } from './iconProps';

function chatBubble(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px chat bubble';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.75.501H3.25C1.733.501.5,1.735.5,3.251v8c0,.297.175.566.447.686.097.043.201.064.303.064.183,0,.364-.067.504-.195l2.536-2.305h4.46c1.517,0,2.75-1.233,2.75-2.75v-3.5c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default chatBubble;
