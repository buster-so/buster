import type { iconProps } from './iconProps';

function tty(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px tty';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.25,14.5h-4.5c-.414,0-.75.336-.75.75s.336.75.75.75h4.5c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m15.7568,3.9844c-1.4143-.9009-3.7435-1.9844-6.7568-1.9844s-5.3425,1.0835-6.7568,1.9844c-.7863.5005-1.2432,1.386-1.2432,2.3184v.9463c0,.9663.7835,1.75,1.75,1.75h1.501c.9658,0,1.748-.7825,1.749-1.7483v-1.7512c.6988-.3521,1.853-.4995,3-.4995s2.3012.1475,3,.4995v1.7512c.0009.9658.7831,1.7483,1.749,1.7483h1.501c.9665,0,1.75-.7837,1.75-1.75v-.9463c0-.9324-.4569-1.8179-1.2432-2.3184Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <rect
          height="1.5"
          width="1.5"
          fill="currentColor"
          rx=".5"
          ry=".5"
          strokeWidth="0"
          x="6.875"
          y="12"
        />
        <rect
          height="1.5"
          width="1.5"
          fill="currentColor"
          rx=".5"
          ry=".5"
          strokeWidth="0"
          x="4.125"
          y="12"
        />
        <rect
          height="1.5"
          width="1.5"
          fill="currentColor"
          rx=".5"
          ry=".5"
          strokeWidth="0"
          x="9.625"
          y="12"
        />
        <rect
          height="1.5"
          width="1.5"
          fill="currentColor"
          rx=".5"
          ry=".5"
          strokeWidth="0"
          x="12.375"
          y="12"
        />
        <rect
          height="1.5"
          width="1.5"
          fill="currentColor"
          rx=".5"
          ry=".5"
          strokeWidth="0"
          x="5.5"
          y="10"
        />
        <rect
          height="1.5"
          width="1.5"
          fill="currentColor"
          rx=".5"
          ry=".5"
          strokeWidth="0"
          x="8.25"
          y="10"
        />
        <rect
          height="1.5"
          width="1.5"
          fill="currentColor"
          rx=".5"
          ry=".5"
          strokeWidth="0"
          x="11"
          y="10"
        />
      </g>
    </svg>
  );
}

export default tty;
