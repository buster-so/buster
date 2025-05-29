import type { iconProps } from './iconProps';

function personDelivery(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px person delivery';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.75 11.75L6.75 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,16.25v-4.624c0-1.055,.819-1.928,1.872-1.996l6.378-.41"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25,10c0-.69,.56-1.25,1.25-1.25h0c.69,0,1.25,.56,1.25,1.25v1.75h-2.5v-1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.473,11.75h4.054c.265,0,.485,.207,.499,.472l.194,3.5c.016,.287-.212,.528-.499,.528h-4.443c-.287,0-.515-.241-.499-.528l.194-3.5c.015-.265,.234-.472,.499-.472Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.3 4.25L9.5 3.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="5"
          cy="4.5"
          fill="none"
          r="2.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default personDelivery;
