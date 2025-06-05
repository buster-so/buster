import type { iconProps } from './iconProps';

function clapperboardPlay(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px clapperboard play';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.798,10.47l-2.375-1.386c-.409-.239-.922,.056-.922,.53v2.771c0,.473,.514,.768,.922,.53l2.375-1.386c.406-.237,.406-.823,0-1.06Z"
          fill="currentColor"
        />
        <path
          d="M1.75,6.75v6.5c0,1.105,.895,2,2,2H14.25c1.105,0,2-.895,2-2V6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,6.75v-2c0-1.105-.895-2-2-2H3.75c-1.105,0-2,.895-2,2v2h14.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8 6.75L10 2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25 6.75L6.25 2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75 6.75L13.75 2.75"
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

export default clapperboardPlay;
