import type { iconProps } from './iconProps';

function vrHeadset2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px vr headset 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m15.457,6.594l-1.753-2.77c-.325-.513-.865-.86-1.469-.918-.99-.096-2.072-.156-3.235-.156-.98,0-2.062.043-3.227.155-.607.059-1.153.407-1.479.923l-1.67,2.644"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m9,5.481c1.837,0,3.541.103,5.091.264.947.098,1.659.902,1.659,1.854v4.608c0,.952-.712,1.755-1.659,1.854-1.012.105-1.838.175-2.976.218-.604.023-1.074-1.817-2.115-1.817s-1.511,1.84-2.115,1.817c-1.138-.043-1.964-.113-2.976-.218-.947-.098-1.659-.902-1.659-1.854v-4.609c0-.952.712-1.755,1.659-1.854,1.55-.161,3.254-.264,5.091-.264v.001Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m6,8.327c.999-.064,2.003-.096,3-.096s2.001.032,3,.096"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.25 8.75L1.25 8.75 1.25 11.25 2.25 11.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75 8.75L16.75 8.75 16.75 11.25 15.75 11.25"
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

export default vrHeadset2;
