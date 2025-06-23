import type { iconProps } from './iconProps';

function joystick(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px joystick';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="4"
          fill="none"
          r="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 6.25L9 10.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.628,8.68l2.147,1.057c.633,.311,.633,1.214,0,1.525l-4.338,2.135c-.138,.068-.288,.102-.438,.102h0c-.15,0-.3-.034-.438-.102l-4.338-2.135c-.633-.311-.633-1.214,0-1.525l2.147-1.057"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25,10.5v2.75c0,.303-.158,.607-.475,.763l-4.338,2.135c-.276,.136-.6,.136-.876,0l-4.338-2.135c-.316-.156-.475-.459-.475-.763v-2.75"
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

export default joystick;
