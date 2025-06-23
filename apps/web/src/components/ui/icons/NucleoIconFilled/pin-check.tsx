import type { iconProps } from './iconProps';

function pinCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pin check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C5.791,1,2.471,3.344,2.471,7.267c0,2.792,3.252,6.915,5.189,9.125,.339,.387,.827,.609,1.34,.609s1.001-.222,1.339-.608c1.938-2.21,5.19-6.335,5.19-9.125,0-3.922-3.32-6.267-6.529-6.267Zm3.102,4.952l-3.397,4.5c-.128,.169-.322,.276-.534,.295-.021,.002-.043,.003-.065,.003-.189,0-.372-.071-.511-.201l-1.609-1.5c-.303-.283-.32-.757-.038-1.06,.283-.303,.758-.319,1.06-.038l1.001,.933,2.896-3.836c.25-.33,.72-.396,1.051-.146,.331,.25,.396,.72,.146,1.051Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default pinCheck;
