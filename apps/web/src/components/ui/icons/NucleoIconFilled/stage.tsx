import type { iconProps } from './iconProps';

function stage(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px stage';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,3H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V5.75c0-1.517-1.233-2.75-2.75-2.75ZM3.75,13.5c-.23,0-.435-.08-.62-.189l2.158-2.717c.048-.06,.118-.094,.194-.094h7.035c.076,0,.146,.034,.195,.095l2.157,2.717c-.185,.109-.39,.188-.62,.188H3.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default stage;
