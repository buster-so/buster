import type { iconProps } from './iconProps';

function phoneOld(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px phone old';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="13.5"
          width="7.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="5.25"
          y="3.75"
        />
        <circle cx="7.75" cy="11.75" fill="currentColor" r=".75" />
        <circle cx="10.25" cy="11.75" fill="currentColor" r=".75" />
        <circle cx="7.75" cy="14.25" fill="currentColor" r=".75" />
        <circle cx="10.25" cy="14.25" fill="currentColor" r=".75" />
        <path
          d="M10.75 0.75L10.75 3.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75 8.25H10.25V9.25H7.75z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default phoneOld;
