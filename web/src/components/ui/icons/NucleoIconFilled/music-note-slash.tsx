import type { iconProps } from './iconProps';

function musicNoteSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px music note slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10,8V3.915c.563,.62,1.294,1.312,2.147,1.938l1.069-1.069c-2.03-1.424-3.319-3.415-3.333-3.438-.18-.281-.521-.41-.843-.316-.319,.094-.54,.387-.54,.72v7.75l1.5-1.5Z"
          fill="currentColor"
        />
        <path
          d="M4.588,16.594c.503,.251,1.063,.406,1.662,.406,2.068,0,3.75-1.682,3.75-3.75v-2.068l-5.412,5.412Z"
          fill="currentColor"
        />
        <path
          d="M8.032,9.968c-.53-.294-1.134-.468-1.782-.468-2.068,0-3.75,1.682-3.75,3.75,0,.647,.18,1.248,.47,1.78l5.062-5.062Z"
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

export default musicNoteSlash;
