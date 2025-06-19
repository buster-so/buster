import type { iconProps } from './iconProps';

function pivotTable(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pivot table';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.03,10.47l-1.75-1.75c-.293-.293-.768-.293-1.061,0l-1.75,1.75c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l.47-.47v1.689c0,.689-.561,1.25-1.25,1.25h-1.689l.47-.47c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-1.75,1.75c-.293,.293-.293,.768,0,1.061l1.75,1.75c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-.47-.47h1.689c1.517,0,2.75-1.233,2.75-2.75v-1.689l.47,.47c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
        <path d="M8,6.5h8v-1.75c0-1.517-1.233-2.75-2.75-2.75h-5.25V6.5Z" fill="currentColor" />
        <path d="M6.5,6.5V2h-1.75c-1.517,0-2.75,1.233-2.75,2.75v1.75H6.5Z" fill="currentColor" />
        <path d="M6.5,8H2v5.25c0,1.517,1.233,2.75,2.75,2.75h1.75V8Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default pivotTable;
