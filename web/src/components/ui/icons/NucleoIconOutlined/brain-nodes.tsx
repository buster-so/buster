import type { iconProps } from './iconProps';

function brainNodes(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px brain nodes';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="14.75"
          cy="9.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="13"
          cy="14.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="13"
          cy="3.75"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.25 9L13.25 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.94,13.19l-1.147-1.147c-.188-.188-.442-.293-.707-.293h-1.836"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.94,4.81l-1.147,1.147c-.188,.188-.442,.293-.707,.293h-1.836"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4,9.75c-.361,0-.705-.077-1.015-.214"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.289,5.962c-.336-.393-.539-.904-.539-1.462"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.029,12.965c-.301,.181-.653,.285-1.029,.285-.076,0-.15-.004-.224-.012"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.25,6.25v-1.75c0-1.243-1.007-2.25-2.25-2.25s-2.25,1.007-2.25,2.25c0,.093,.016,.182,.027,.272-1.275,.114-2.277,1.173-2.277,2.478,0,1.02,.613,1.895,1.489,2.283-.589,.348-.989,.983-.989,1.717,0,1.028,.779,1.865,1.777,1.978-.011,.09-.027,.179-.027,.272,0,1.243,1.007,2.25,2.25,2.25s2.25-1.007,2.25-2.25v-1.75"
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

export default brainNodes;
