import type { iconProps } from './iconProps';

function angleDotted(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px angle dotted';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75,2.75V13.25c0,1.105,.895,2,2,2H15.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="5.429" cy="8.783" fill="currentColor" r=".75" />
        <circle cx="7.7" cy="10.3" fill="currentColor" r=".75" />
        <circle cx="9.217" cy="12.571" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default angleDotted;
