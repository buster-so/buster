import type { iconProps } from './iconProps';

function sideProfileHeart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px side profile heart';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.25,16.25v-2.5h1.639c1.049,0,1.919-.81,1.995-1.856l.112-1.543,1.504-.601-1.5-2c0-3.736-3.415-6.675-7.293-5.865-2.266,.473-4.097,2.305-4.571,4.57-.595,2.846,.84,5.418,3.114,6.6v3.195"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.798,10.387c.127,.067,.276,.067,.403,0,.673-.354,2.798-1.636,2.798-3.721,.003-.916-.73-1.661-1.64-1.667-.547,.007-1.056,.285-1.36,.743-.304-.458-.813-.736-1.36-.743-.91,.006-1.643,.751-1.64,1.667,0,2.085,2.125,3.367,2.798,3.721Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default sideProfileHeart;
