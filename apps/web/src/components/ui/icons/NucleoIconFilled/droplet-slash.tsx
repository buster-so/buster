import type { iconProps } from './iconProps';

function dropletSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px droplet slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.983,5.017c-.483-.573-1.005-1.124-1.539-1.681-.624-.65-1.269-1.322-1.86-2.057-.284-.354-.884-.354-1.168,0-.592,.734-1.237,1.407-1.86,2.057-1.957,2.04-3.806,3.966-3.806,7.397,0,1.282,.387,2.474,1.049,3.468L12.983,5.017Z"
          fill="currentColor"
        />
        <path
          d="M8.304,12.878c.221,.073,.452,.122,.696,.122,.414,0,.75,.336,.75,.75s-.336,.75-.75,.75c-.665,0-1.281-.189-1.823-.496l-1.815,1.815c1.026,.74,2.28,1.181,3.637,1.181,3.446,0,6.25-2.812,6.25-6.267,0-1.534-.382-2.759-.966-3.836l-5.98,5.98Z"
          fill="currentColor"
        />
        <path
          d="M2,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.47c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L2.53,16.53c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default dropletSlash;
