import type { iconProps } from './iconProps';

function textStrikethrough(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text strikethrough';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13,11.336c.091,.274,.145,.579,.153,.919,.051,2.076-1.817,3.495-4.074,3.495-2.157,0-3.655-.839-4.234-2.736"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.774,4.626c-.819-1.937-2.456-2.376-3.695-2.376-1.152,0-4.174,.612-3.894,3.515,.196,2.037,2.117,2.796,3.794,3.095,.221,.039,.454,.085,.694,.139"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2 9L16 9"
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

export default textStrikethrough;
