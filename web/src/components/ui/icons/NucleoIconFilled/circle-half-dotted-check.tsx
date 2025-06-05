import type { iconProps } from './iconProps';

function circleHalfDottedCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px circle half dotted check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,12c-.414,0-.75-.336-.75-.75s.336-.75.75-.75c2.481,0,4.5-2.019,4.5-4.5S8.481,1.5,6,1.5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75c3.309,0,6,2.691,6,6s-2.691,6-6,6Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m5.25,8.75c-.198,0-.389-.078-.53-.219l-1.503-1.5c-.293-.292-.294-.767,0-1.061.292-.294.767-.294,1.061,0l.892.89,2.485-3.31c.248-.331.72-.399,1.05-.149.332.249.398.719.149,1.05l-3.003,4c-.13.174-.33.282-.546.298-.018.001-.036.002-.053.002Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m3.75,2.103c.359-.207.482-.666.275-1.024-.207-.359-.666-.482-1.025-.275s-.482.666-.275,1.025c.207.359.666.482,1.025.274Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m1.828,2.725c-.359-.207-.817-.084-1.025.275-.207.359-.084.817.275,1.024.359.207.817.084,1.025-.274.207-.359.084-.817-.275-1.025Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m1.078,7.975c-.359.207-.482.666-.275,1.025.207.359.666.482,1.025.274.359-.207.482-.666.275-1.024-.207-.359-.666-.482-1.025-.275Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m3.75,9.897c-.359-.207-.817-.084-1.025.275-.207.359-.084.817.275,1.025.359.207.817.084,1.025-.275.207-.359.084-.817-.275-1.025Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <circle cx=".75" cy="6" fill="currentColor" r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default circleHalfDottedCheck;
