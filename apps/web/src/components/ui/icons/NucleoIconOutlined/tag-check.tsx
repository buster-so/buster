import type { iconProps } from './iconProps';

function tagCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px tag check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="6.25" cy="6.25" fill="currentColor" r="1.25" />
        <path
          d="M11.5 5.5L13.109 7 16.506 2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.154,3.404l-.568-.568c-.375-.375-.884-.586-1.414-.586H3.25c-.552,0-1,.448-1,1v4.922c0,.53,.211,1.039,.586,1.414l5.75,5.75c.781,.781,2.047,.781,2.828,0l3.922-3.922c.781-.781,.781-2.047,0-2.828l-.166-.166"
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

export default tagCheck;
