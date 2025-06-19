import type { iconProps } from './iconProps';

function calendarCheck2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px calendar check 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.75,3.5c-.414,0-.75-.336-.75-.75V.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V2.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M12.25,3.5c-.414,0-.75-.336-.75-.75V.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V2.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.75,2H4.25c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.75c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm0,12.5H4.25c-.689,0-1.25-.561-1.25-1.25V7H15v6.25c0,.689-.561,1.25-1.25,1.25Z"
          fill="currentColor"
        />
        <path
          d="M8.205,13.25c-.189,0-.372-.071-.511-.202l-1.43-1.333c-.303-.282-.32-.757-.037-1.06,.283-.303,.757-.319,1.06-.037l.822,.766,2.519-3.336c.25-.329,.719-.395,1.051-.146,.331,.25,.396,.72,.146,1.051l-3.02,4c-.128,.169-.322,.276-.534,.295-.021,.002-.043,.003-.065,.003Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default calendarCheck2;
