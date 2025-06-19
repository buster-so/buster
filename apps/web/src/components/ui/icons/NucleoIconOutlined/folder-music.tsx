import type { iconProps } from './iconProps';

function folderMusic(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px folder music';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.25,8.75V4.75c0-1.105,.895-2,2-2h1.951c.607,0,1.18,.275,1.56,.748l.603,.752h5.386c1.105,0,2,.895,2,2v2.202"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.72,8.452c-.145-.962-.967-1.702-1.97-1.702H4.25c-1.105,0-2,.896-2,2v4.5c0,1.104,.895,2,2,2h5.043"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.75,15.75v-5c.317,.323,.73,.692,1.25,1.047,.45,.307,.879,.535,1.25,.703"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="13.25"
          cy="15.75"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default folderMusic;
