import type { iconProps } from './iconProps';

function fileRefresh(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px file refresh';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.75 6.75L7.75 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 9.75L10.25 9.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.16,6.25h-3.41c-.552,0-1-.448-1-1V1.852"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.75 13.75L17.25 13.75 17.25 11.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,9.319v-2.655c0-.265-.105-.52-.293-.707l-3.914-3.914c-.188-.188-.442-.293-.707-.293H4.75c-1.105,0-2,.896-2,2V14.25c0,1.104,.895,2,2,2h4.823"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.5,16.387c-.501,.531-1.212,.863-2,.863-1.519,0-2.75-1.231-2.75-2.75s1.231-2.75,2.75-2.75c1.166,0,2.162,.726,2.563,1.75"
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

export default fileRefresh;
