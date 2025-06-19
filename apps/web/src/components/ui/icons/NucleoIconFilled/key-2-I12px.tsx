import type { iconProps } from './iconProps';

function key2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px key 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.53,5.47l-1.47-1.47,.72-.72c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-6.474,6.474c-.641-.437-1.414-.693-2.246-.693-2.206,0-4,1.794-4,4s1.794,4,4,4,4-1.794,4-4c0-.832-.257-1.605-.693-2.246l2.693-2.693,1.47,1.47c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.47-1.47,.939-.939,1.47,1.47c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default key2;
