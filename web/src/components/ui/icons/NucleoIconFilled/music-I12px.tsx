import type { iconProps } from './iconProps';

function music(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px music';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.462,1.454l-7,1.167c-.847,.141-1.462,.867-1.462,1.726v6.967c-.377-.194-.798-.314-1.25-.314-1.517,0-2.75,1.233-2.75,2.75s1.233,2.75,2.75,2.75,2.75-1.233,2.75-2.75V7.385l7.5-1.25v3.679c-.377-.194-.798-.314-1.25-.314-1.517,0-2.75,1.233-2.75,2.75s1.233,2.75,2.75,2.75,2.75-1.233,2.75-2.75V3.181c0-.516-.226-1.002-.619-1.335-.394-.333-.908-.475-1.419-.391Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default music;
