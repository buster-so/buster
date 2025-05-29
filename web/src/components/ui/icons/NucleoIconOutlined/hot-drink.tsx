import type { iconProps } from './iconProps';

function hotDrink(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hot drink';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.75,.75c-.022,.631-.166,1.383-.672,2-.347,.424-.636,.504-.969,.922-.122,.153-.239,.338-.338,.564"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.5,2.75c-.015,.379-.111,.83-.448,1.2-.127,.14-.242,.217-.357,.3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75,6.75H14.25v3.5c0,2.76-2.24,5-5,5h-.5c-2.76,0-5-2.24-5-5v-3.5h0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25 15.25L2.75 15.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25,6.75h1c1.105,0,2,.891,2,2s-.895,2-2,2h-1"
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

export default hotDrink;
