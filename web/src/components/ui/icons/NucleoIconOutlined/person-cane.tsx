import type { iconProps } from './iconProps';

function personCane(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px person cane';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="7.75"
          cy="2.5"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,16.75l-.453-3.17c-.031-.214-.13-.413-.283-.566l-1.721-1.721c-.188-.188-.293-.442-.293-.707V6.318"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6 13.75L5 16.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 10L8.75 6.318"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3,10l1.146-2.064c.068-.123,.162-.23,.274-.314l1.563-1.172c.173-.13,.384-.2,.6-.2h1.824c.222,0,.438,.074,.614,.211l1.878,1.46c.067,.052,.141,.096,.22,.13l1.632,.699"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75 10.75L15.75 16"
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

export default personCane;
