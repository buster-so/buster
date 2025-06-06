import type { iconProps } from './iconProps';

function mobileHeart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px mobile heart';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="14.5"
          width="10.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="3.75"
          y="1.75"
        />
        <path
          d="M8.798,11.449c.127,.068,.276,.068,.403,0,.673-.358,2.798-1.655,2.798-3.763,.003-.926-.73-1.68-1.64-1.686-.547,.007-1.056,.288-1.36,.752-.304-.463-.813-.744-1.36-.752-.91,.006-1.643,.76-1.64,1.686,0,2.109,2.125,3.406,2.798,3.763Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default mobileHeart;
