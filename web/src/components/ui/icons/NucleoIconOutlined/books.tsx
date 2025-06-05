import type { iconProps } from './iconProps';

function books(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px books';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16,6.75c-.171-.387-.419-1.083-.422-1.984-.003-.918,.25-1.626,.422-2.016"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.75,2.75H6.25c-1.105,0-2,.895-2,2h0c0,1.105,.895,2,2,2h10.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16,14.75c-.171-.387-.419-1.083-.422-1.984-.003-.918,.25-1.626,.422-2.016"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75 14.75L16.75 14.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.75,10.75H6.25c-1.105,0-2,.895-2,2h0c0,1.105,.895,2,2,2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2,10.75c.171-.387,.419-1.083,.422-1.984,.003-.918-.25-1.626-.422-2.016"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.25,6.75H11.75c1.105,0,2,.895,2,2h0c0,1.105-.895,2-2,2H1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12,13h-4v3.5c0,.202,.122,.385,.309,.462,.187,.079,.401,.035,.545-.108l1.146-1.146,1.146,1.146c.096,.096,.224,.146,.354,.146,.064,0,.13-.012,.191-.038,.187-.077,.309-.26,.309-.462v-3.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default books;
