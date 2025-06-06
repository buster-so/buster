import type { iconProps } from './iconProps';

function eye2Slash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px eye 2 slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M1.75,9.75c-.076,0-.154-.012-.231-.037-.394-.127-.609-.548-.482-.942,.02-.06,2.007-6.02,7.964-6.02s7.945,5.962,7.965,6.022c.125,.394-.092,.814-.486,.941-.393,.127-.815-.09-.942-.484-.066-.203-1.666-4.979-6.536-4.979S2.53,9.028,2.464,9.231c-.104,.316-.398,.518-.714,.518Z"
          fill="currentColor"
        />
        <path
          d="M11.474,6.526c-.634-.634-1.509-1.026-2.474-1.026-1.93,0-3.5,1.57-3.5,3.5,0,.965,.393,1.84,1.026,2.474l4.947-4.947Z"
          fill="currentColor"
        />
        <path
          d="M8.711,12.471c.097,.008,.19,.029,.289,.029,1.93,0,3.5-1.57,3.5-3.5,0-.099-.021-.192-.029-.289l-3.76,3.76Z"
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

export default eye2Slash;
