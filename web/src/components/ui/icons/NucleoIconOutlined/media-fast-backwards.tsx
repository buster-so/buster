import type { iconProps } from './iconProps';

function mediaFastBackwards(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px media fast backwards';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.25,9.572l7.258,4.021c.333,.185,.742-.056,.742-.437V4.844c0-.381-.409-.622-.742-.437l-7.258,4.021"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.508,4.407L1.008,8.563c-.344,.19-.344,.685,0,.875l7.501,4.156c.333,.185,.742-.056,.742-.437V4.844c0-.381-.409-.622-.742-.437Z"
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

export default mediaFastBackwards;
