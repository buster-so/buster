import type { iconProps } from './iconProps';

function highlighter(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px highlighter';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.25,14.78c-.698-.814-1.637-2.115-2.293-3.912-.3-.823-.484-1.593-.596-2.27-.081-.488-.493-.848-.987-.848h-2.374s-2.374,0-2.374,0c-.494,0-.907,.36-.987,.848-.112,.677-.296,1.447-.596,2.27-.656,1.797-1.595,3.097-2.293,3.912"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,16.25l.109-.876c.075-.597-.391-1.124-.992-1.124h-5.367s-5.367,0-5.367,0c-.601,0-1.067,.527-.992,1.124l.109,.876"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75,5.25v-1.431c0-.194,.114-.37,.292-.449l3.517-1.563c.325-.144,.691,.093,.691,.449v2.994"
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

export default highlighter;
