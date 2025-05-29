import type { iconProps } from './iconProps';

function magicWand(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px magic wand';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75 15.25L10.749 7.251"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.998 2.052L12.337 3.579 14.921 2.519 14.191 5.215 15.998 7.344 13.209 7.483 11.742 9.86 10.748 7.25 8.034 6.59 10.209 4.837 9.998 2.052z"
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

export default magicWand;
