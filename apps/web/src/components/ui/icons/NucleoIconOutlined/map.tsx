import type { iconProps } from './iconProps';

function map(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px map';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.25 2.792L6.25 13.292"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75 4.708L11.75 15.208"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.533,3.576l3.432-.763c.186-.041,.38-.029,.559,.036l4.952,1.801c.179,.065,.373,.078,.559,.036l2.998-.666c.625-.139,1.217,.336,1.217,.976V13.448c0,.469-.326,.875-.783,.976l-3.432,.763c-.186,.041-.38,.029-.559-.036l-4.952-1.801c-.179-.065-.373-.078-.559-.036l-2.998,.666c-.625,.139-1.217-.336-1.217-.976V4.552c0-.469,.326-.875,.783-.976Z"
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

export default map;
