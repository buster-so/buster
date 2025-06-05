import type { iconProps } from './iconProps';

function wifi(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px wifi';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="13" fill="currentColor" r="2" />
        <path
          d="M9,7c-1.669,0-3.239,.65-4.419,1.831-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0c.897-.897,2.09-1.391,3.358-1.391s2.461,.494,3.358,1.391c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061-1.18-1.181-2.75-1.831-4.419-1.831Z"
          fill="currentColor"
        />
        <path
          d="M16.248,6.002c-1.936-1.936-4.51-3.002-7.248-3.002S3.688,4.066,1.752,6.002c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0c1.652-1.653,3.851-2.563,6.188-2.563s4.535,.91,6.188,2.563c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default wifi;
