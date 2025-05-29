import type { iconProps } from './iconProps';

function brain(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px brain';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.25,9.75c.361,0,.705-.077,1.015-.214"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.961,5.962c.336-.393,.539-.904,.539-1.462"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.221,12.965c.301,.181,.653,.285,1.029,.285,.076,0,.15-.004,.224-.012"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,4.5c0-1.243,1.007-2.25,2.25-2.25,1.243,0,2.25,1.007,2.25,2.25,0,.093-.016,.182-.027,.272,1.275,.114,2.277,1.173,2.277,2.478,0,1.02-.613,1.895-1.489,2.283,.589,.348,.989,.983,.989,1.717,0,1.028-.779,1.865-1.777,1.978,.011,.09,.027,.179,.027,.272,0,1.243-1.007,2.25-2.25,2.25-1.243,0-2.25-1.007-2.25-2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75,9.75c-.361,0-.705-.077-1.015-.214"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.039,5.962c-.336-.393-.539-.904-.539-1.462"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.779,12.965c-.301,.181-.653,.285-1.029,.285-.076,0-.15-.004-.224-.012"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,4.5c0-1.243-1.007-2.25-2.25-2.25s-2.25,1.007-2.25,2.25c0,.093,.016,.182,.027,.272-1.275,.114-2.277,1.173-2.277,2.478,0,1.02,.613,1.895,1.489,2.283-.589,.348-.989,.983-.989,1.717,0,1.028,.779,1.865,1.777,1.978-.011,.09-.027,.179-.027,.272,0,1.243,1.007,2.25,2.25,2.25s2.25-1.007,2.25-2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 13.5L9 4.5"
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

export default brain;
