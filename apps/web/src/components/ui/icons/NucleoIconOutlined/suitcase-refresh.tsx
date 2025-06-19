import type { iconProps } from './iconProps';

function suitcaseRefresh(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px suitcase refresh';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.25,4.75V2.25c0-.552,.448-1,1-1h3.5c.552,0,1,.448,1,1v2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.75 13.25L17.25 13.25 17.25 10.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,8.473v-1.723c0-1.104-.895-2-2-2H3.75c-1.105,0-2,.896-2,2v6.5c0,1.104,.895,2,2,2h5.667"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.5,15.887c-.501,.531-1.212,.863-2,.863-1.519,0-2.75-1.231-2.75-2.75s1.231-2.75,2.75-2.75c1.166,0,2.162,.726,2.563,1.75"
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

export default suitcaseRefresh;
