import type { iconProps } from './iconProps';

function mapSearch(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px map search';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16.25,9.343V4.997c0-.64-.592-1.115-1.217-.976l-2.998,.666c-.186,.041-.38,.029-.559-.036l-4.952-1.801c-.179-.065-.373-.078-.559-.036l-3.432,.763c-.458,.102-.783,.508-.783,.976V13.003c0,.64,.592,1.115,1.217,.976l2.998-.666c.186-.041,.38-.029,.559,.036l2.814,1.023"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.59 15.09L17.25 16.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="14"
          cy="13.5"
          fill="none"
          r="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default mapSearch;
